import * as Crypto from 'expo-crypto';

export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DiceSides = (typeof DICE_SIDES)[number];

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface SingleDieRoll {
  id: string;
  sides: DiceSides;
  value: number;
  rawByte: number;
  timestamp: string;
  dropped?: boolean;
  rerollCount?: number;
}

export interface PhysicsWaypoint {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  hitWall?: boolean;
}

export interface DiePhysicsTrajectory {
  id: string;
  waypoints: PhysicsWaypoint[];
  finalX: number;
  finalY: number;
  finalRotation: number;
}

/**
 * Gerçek kriptografik rastgelelik (Crypto.getRandomBytesAsync) ve
 * Modulo Bias önleyici Rejection Sampling kullanan özel zar atma algoritması.
 * Kesinlikle Math.random() kullanılmaz.
 */
export async function rollCryptoDie(sides: number): Promise<{ value: number; rawByte: number }> {
  if (sides < 2 || sides > 256) {
    throw new Error(`Geçersiz zar yüzü sayısı: ${sides}`);
  }

  // Modulo bias'ı önlemek için kabul edilebilir üst sınır (256'nın sides'a tam bölünen en büyük katı)
  const maxUnbiasedValue = 256 - (256 % sides);

  while (true) {
    // Donanım tabanlı CSPRNG'den 8 rastgele byte çekiyoruz
    const randomBytes = await Crypto.getRandomBytesAsync(8);

    for (let i = 0; i < randomBytes.length; i++) {
      const byte = randomBytes[i];
      if (byte < maxUnbiasedValue) {
        const value = (byte % sides) + 1;
        return { value, rawByte: byte };
      }
    }
  }
}

/**
 * Avantaj / Dezavantaj kurallarına göre hangi zarların hesaba katılacağını (kept/dropped)
 * ve genel toplamı hesaplar.
 */
export function evaluateRollPool(
  rolls: SingleDieRoll[],
  mode: RollMode = 'normal',
  modifier: number = 0
): { evaluatedRolls: SingleDieRoll[]; diceSum: number; total: number } {
  if (rolls.length === 0) {
    return { evaluatedRolls: [], diceSum: 0, total: modifier };
  }

  if (mode === 'normal' || rolls.length === 1) {
    const evaluatedRolls = rolls.map((r) => ({ ...r, dropped: false }));
    const diceSum = evaluatedRolls.reduce((acc, r) => acc + r.value, 0);
    return { evaluatedRolls, diceSum, total: diceSum + modifier };
  }

  // Advantage veya Disadvantage modunda en yüksek veya en düşük tek zarı aktif tutar
  let targetIdx = 0;
  for (let i = 1; i < rolls.length; i++) {
    if (mode === 'advantage' && rolls[i].value > rolls[targetIdx].value) {
      targetIdx = i;
    } else if (mode === 'disadvantage' && rolls[i].value < rolls[targetIdx].value) {
      targetIdx = i;
    }
  }

  const evaluatedRolls = rolls.map((r, idx) => ({
    ...r,
    dropped: idx !== targetIdx,
  }));

  const diceSum = evaluatedRolls[targetIdx].value;
  return {
    evaluatedRolls,
    diceSum,
    total: diceSum + modifier,
  };
}

/**
 * Seçilen zarlar dizisini (ör. [20, 8, 6, 6]) kriptografik olarak atar,
 * her bir zarın tekil sonucunu ve genel toplamı döndürür.
 */
export async function rollCryptoPool(
  dicePool: DiceSides[],
  mode: RollMode = 'normal',
  modifier: number = 0
): Promise<{
  rolls: SingleDieRoll[];
  diceSum: number;
  total: number;
  effectivePool: DiceSides[];
}> {
  // Avantaj/Dezavantaj seçiliyse ve havuzda tek zar varsa otomatik 2 zar atılır (2d20 vb.)
  const effectivePool: DiceSides[] =
    mode !== 'normal' && dicePool.length === 1
      ? [dicePool[0], dicePool[0]]
      : [...dicePool];

  const rawRolls: SingleDieRoll[] = [];

  for (let i = 0; i < effectivePool.length; i++) {
    const sides = effectivePool[i];
    const { value, rawByte } = await rollCryptoDie(sides);
    const idBytes = await Crypto.getRandomBytesAsync(4);
    const hexId = Array.from(idBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    rawRolls.push({
      id: `${hexId}-${i}`,
      sides,
      value,
      rawByte,
      timestamp: timeStr,
      dropped: false,
      rerollCount: 0,
    });
  }

  const { evaluatedRolls, diceSum, total } = evaluateRollPool(rawRolls, mode, modifier);

  return {
    rolls: evaluatedRolls,
    diceSum,
    total,
    effectivePool,
  };
}

/**
 * Owlbear Rodeo benzeri deterministik 2.5B zar tepsisi fiziği.
 * Tüm başlangıç konumları, fırlatma vektörleri ve açısal hızlar
 * tamamen expo-crypto (CSPRNG) byte'larından üretilir.
 * Zarlar tepsi duvarlarından ve birbirlerinden elastik olarak sekerek durur.
 */
export async function simulateCryptoTrayPhysics(
  diceIds: string[],
  trayWidth: number,
  trayHeight: number,
  dieSize: number = 58
): Promise<DiePhysicsTrajectory[]> {
  const count = diceIds.length;
  if (count === 0) return [];

  const padding = 10;
  const minX = padding;
  const maxX = Math.max(minX + 10, trayWidth - dieSize - padding);
  const minY = padding;
  const maxY = Math.max(minY + 10, trayHeight - dieSize - padding);

  // Her zar için 8 kriptografik byte çekiyoruz
  const seedBytes = await Crypto.getRandomBytesAsync(count * 8);

  interface SimBody {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vRot: number;
    waypoints: PhysicsWaypoint[];
  }

  const bodies: SimBody[] = diceIds.map((id, i) => {
    const offset = i * 8;
    const b0 = seedBytes[offset];
    const b1 = seedBytes[offset + 1];
    const b2 = seedBytes[offset + 2];
    const b3 = seedBytes[offset + 3];
    const b4 = seedBytes[offset + 4];
    const b5 = seedBytes[offset + 5];

    // Tepsinin alt kısmından yukarı ve yana doğru fırlatma
    const spanX = Math.max(1, maxX - minX);
    const startX = minX + ((b0 / 255) * spanX * 0.7 + spanX * 0.15);
    const startY = maxY - (b1 / 255) * 18;

    const vx = ((b2 / 255) - 0.5) * 34;
    const vy = -16 - (b3 / 255) * 20;
    const rot = ((b4 / 255) - 0.5) * 180;
    const vRot = ((b5 / 255) >= 0.5 ? 1 : -1) * (110 + (b5 / 255) * 180);

    return {
      id,
      x: startX,
      y: startY,
      vx,
      vy,
      rot,
      vRot,
      waypoints: [
        {
          x: startX,
          y: startY,
          rotation: rot,
          scale: 1.28,
          hitWall: false,
        },
      ],
    };
  });

  const totalSteps = 24;
  const recordInterval = 4; // 6 ara kare + başlangıç = 7 waypoint
  const minDist = dieSize * 0.92;

  for (let step = 1; step <= totalSteps; step++) {
    const hitFlags = new Array<boolean>(count).fill(false);

    // 1. Hız ve duvar çarpışmaları
    for (let i = 0; i < count; i++) {
      const b = bodies[i];
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vRot * 0.18;

      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * 0.78;
        b.vRot = -b.vRot * 0.85;
        hitFlags[i] = true;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * 0.78;
        b.vRot = -b.vRot * 0.85;
        hitFlags[i] = true;
      }

      if (b.y < minY) {
        b.y = minY;
        b.vy = Math.abs(b.vy) * 0.78;
        b.vRot = -b.vRot * 0.85;
        hitFlags[i] = true;
      } else if (b.y > maxY) {
        b.y = maxY;
        b.vy = -Math.abs(b.vy) * 0.78;
        b.vRot = -b.vRot * 0.85;
        hitFlags[i] = true;
      }

      // Sürtünme (masa örtüsü sönümlemesi)
      b.vx *= 0.88;
      b.vy *= 0.88;
      b.vRot *= 0.86;
    }

    // 2. Zarların birbirleriyle elastik çarpışması (Rigid-body circle separation)
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const a = bodies[i];
          const b = bodies[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist) {
            if (dist < 0.001) {
              dx = 1;
              dy = 0;
              dist = 1;
            }
            const overlap = (minDist - dist) * 0.55;
            const nx = dx / dist;
            const ny = dy / dist;

            a.x = Math.min(maxX, Math.max(minX, a.x - nx * overlap));
            a.y = Math.min(maxY, Math.max(minY, a.y - ny * overlap));
            b.x = Math.min(maxX, Math.max(minX, b.x + nx * overlap));
            b.y = Math.min(maxY, Math.max(minY, b.y + ny * overlap));

            // Hız transferi
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal < 0) {
              const impulse = -velAlongNormal * 0.75;
              a.vx -= impulse * nx;
              a.vy -= impulse * ny;
              b.vx += impulse * nx;
              b.vy += impulse * ny;
              hitFlags[i] = true;
              hitFlags[j] = true;
            }
          }
        }
      }
    }

    if (step % recordInterval === 0 || step === totalSteps) {
      const progress = step / totalSteps;
      // Havadan tepsiye düşüş ölçeği (2.5B derinlik hissi)
      const bounceHeight =
        step === totalSteps
          ? 1
          : 1 + Math.max(0, (1 - progress) * 0.22 * Math.abs(Math.sin(step * 0.9)));

      for (let i = 0; i < count; i++) {
        const b = bodies[i];
        // Son karede zarın okunaklı ama doğal bir açıda durması
        const finalAngle =
          step === totalSteps
            ? Math.round(b.rot / 360) * 360 + ((seedBytes[i * 8 + 6] / 255 - 0.5) * 22)
            : b.rot;

        b.waypoints.push({
          x: Math.round(b.x),
          y: Math.round(b.y),
          rotation: Math.round(finalAngle),
          scale: Number(bounceHeight.toFixed(3)),
          hitWall: hitFlags[i],
        });
      }
    }
  }

  return bodies.map((b) => {
    const last = b.waypoints[b.waypoints.length - 1];
    return {
      id: b.id,
      waypoints: b.waypoints,
      finalX: last.x,
      finalY: last.y,
      finalRotation: last.rotation,
    };
  });
}

/**
 * Bir dizi içinden kriptografik rastgelelikle (Crypto.getRandomBytesAsync) eleman seçer.
 */
export async function pickCryptoRandomItem<T>(items: readonly T[]): Promise<T> {
  if (items.length === 0) {
    throw new Error('Boş diziden seçim yapılamaz.');
  }
  if (items.length === 1) {
    return items[0];
  }
  const { value } = await rollCryptoDie(items.length);
  return items[value - 1];
}
