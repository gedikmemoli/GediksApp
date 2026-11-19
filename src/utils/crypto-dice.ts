import * as Crypto from 'expo-crypto';

export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DiceSides = (typeof DICE_SIDES)[number];

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export type DieKind = 'standard' | 'd100_tens' | 'd100_ones';

export interface PoolEntry {
  poolId: string;
  sides: DiceSides;
}

export interface SingleDieRoll {
  id: string;
  poolId: string;
  sides: DiceSides;
  dieKind: DieKind;
  value: number;
  displayValue: string;
  rawByte: number;
  timestamp: string;
  isRolled: boolean;
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
 * Zar türüne (standard, d100_tens [00..90], d100_ones [1..10]) göre
 * kriptografik zar atışı yapar ve sayısal değer ile gösterim metnini döndürür.
 */
export async function rollCryptoDieByKind(
  sides: DiceSides,
  dieKind: DieKind
): Promise<{ value: number; displayValue: string; rawByte: number }> {
  if (dieKind === 'd100_tens') {
    // 10'ar 10'ar artan 100'lük zar: 00, 10, 20, 30, 40, 50, 60, 70, 80, 90
    const { value: step10, rawByte } = await rollCryptoDie(10);
    const tensVal = (step10 - 1) * 10;
    const displayValue = tensVal === 0 ? '00' : String(tensVal);
    return { value: tensVal, displayValue, rawByte };
  }

  if (dieKind === 'd100_ones') {
    // 1'er 1'er artan 10'luk zar: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    const { value, rawByte } = await rollCryptoDie(10);
    return { value, displayValue: String(value), rawByte };
  }

  const { value, rawByte } = await rollCryptoDie(sides);
  return { value, displayValue: String(value), rawByte };
}

/**
 * Seçilen bir PoolEntry için tablada belirecek atılmamış (hazır) zar nesnelerini oluşturur.
 * D100 seçildiğinde 1 adet 100'lük (00-90) ve 1 adet 10'luk (1-10) zar üretir.
 */
export function createUnrolledDiceForEntry(entry: PoolEntry): SingleDieRoll[] {
  if (entry.sides === 100) {
    return [
      {
        id: `${entry.poolId}-tens`,
        poolId: entry.poolId,
        sides: 100,
        dieKind: 'd100_tens',
        value: 0,
        displayValue: '00',
        rawByte: 0,
        timestamp: '--:--:--',
        isRolled: false,
        dropped: false,
        rerollCount: 0,
      },
      {
        id: `${entry.poolId}-ones`,
        poolId: entry.poolId,
        sides: 10,
        dieKind: 'd100_ones',
        value: 10,
        displayValue: '10',
        rawByte: 0,
        timestamp: '--:--:--',
        isRolled: false,
        dropped: false,
        rerollCount: 0,
      },
    ];
  }

  return [
    {
      id: `${entry.poolId}-std`,
      poolId: entry.poolId,
      sides: entry.sides,
      dieKind: 'standard',
      value: entry.sides,
      displayValue: String(entry.sides),
      rawByte: 0,
      timestamp: '--:--:--',
      isRolled: false,
      dropped: false,
      rerollCount: 0,
    },
  ];
}

/**
 * Atılmamış veya tablada dizilecek zarlar için düzenli ızgara/tabla koordinatı hesaplar.
 */
export function computeUnrolledTrayPosition(
  index: number,
  totalCount: number,
  trayWidth: number,
  trayHeight: number,
  dieSize: number = 60
): { x: number; y: number } {
  const cols = Math.min(4, Math.max(1, totalCount));
  const rows = Math.ceil(totalCount / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);

  const itemsInThisRow = row === rows - 1 ? totalCount - row * cols : cols;
  const gapX = 14;
  const gapY = 14;

  const rowWidth = itemsInThisRow * dieSize + (itemsInThisRow - 1) * gapX;
  const totalHeight = rows * dieSize + (rows - 1) * gapY;

  const startX = Math.max(12, (trayWidth - rowWidth) / 2);
  const startY = Math.max(14, (trayHeight - totalHeight) / 2);

  return {
    x: Math.round(startX + col * (dieSize + gapX)),
    y: Math.round(startY + row * (dieSize + gapY)),
  };
}

/**
 * Avantaj / Dezavantaj kurallarına göre hangi zarların hesaba katılacağını (kept/dropped)
 * ve genel toplamı hesaplar. D100 çiftleri aynı poolId altında birlikte değerlendirilir.
 */
export function evaluateRollPool(
  rolls: SingleDieRoll[],
  mode: RollMode = 'normal',
  modifier: number = 0
): { evaluatedRolls: SingleDieRoll[]; diceSum: number; total: number } {
  const rolledOnly = rolls.filter((r) => r.isRolled);
  if (rolledOnly.length === 0) {
    return {
      evaluatedRolls: rolls.map((r) => ({ ...r, dropped: false })),
      diceSum: 0,
      total: modifier,
    };
  }

  // poolId bazında gruplama (D100'ün 100'lük ve 10'luk zarları aynı gruptadır)
  const groupOrder: string[] = [];
  const groupSums: Record<string, number> = {};

  for (const r of rolledOnly) {
    if (!groupOrder.includes(r.poolId)) {
      groupOrder.push(r.poolId);
      groupSums[r.poolId] = 0;
    }
    groupSums[r.poolId] += r.value;
  }

  if (mode === 'normal' || groupOrder.length <= 1) {
    const evaluatedRolls = rolls.map((r) => ({ ...r, dropped: false }));
    const diceSum = rolledOnly.reduce((acc, r) => acc + r.value, 0);
    return { evaluatedRolls, diceSum, total: diceSum + modifier };
  }

  // Advantage veya Disadvantage modunda en yüksek veya en düşük grubu aktif tutar
  let targetGroupId = groupOrder[0];
  for (let i = 1; i < groupOrder.length; i++) {
    const gid = groupOrder[i];
    if (mode === 'advantage' && groupSums[gid] > groupSums[targetGroupId]) {
      targetGroupId = gid;
    } else if (mode === 'disadvantage' && groupSums[gid] < groupSums[targetGroupId]) {
      targetGroupId = gid;
    }
  }

  const evaluatedRolls = rolls.map((r) => ({
    ...r,
    dropped: r.isRolled ? r.poolId !== targetGroupId : false,
  }));

  const diceSum = groupSums[targetGroupId] ?? 0;
  return {
    evaluatedRolls,
    diceSum,
    total: diceSum + modifier,
  };
}

/**
 * Seçilen zar girişlerini (PoolEntry[]) kriptografik olarak atar,
 * her bir zarın tekil sonucunu ve genel toplamı döndürür.
 */
export async function rollCryptoPoolEntries(
  entries: PoolEntry[],
  mode: RollMode = 'normal',
  modifier: number = 0
): Promise<{
  rolls: SingleDieRoll[];
  diceSum: number;
  total: number;
}> {
  // Avantaj/Dezavantaj seçiliyse ve havuzda tek zar girişi varsa otomatik 2. kopyayı atar
  const effectiveEntries: PoolEntry[] =
    mode !== 'normal' && entries.length === 1
      ? [entries[0], { poolId: `${entries[0].poolId}-advpair`, sides: entries[0].sides }]
      : [...entries];

  const templates: SingleDieRoll[] = [];
  for (const entry of effectiveEntries) {
    templates.push(...createUnrolledDiceForEntry(entry));
  }

  const rawRolls: SingleDieRoll[] = [];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  for (let i = 0; i < templates.length; i++) {
    const tmpl = templates[i];
    const { value, displayValue, rawByte } = await rollCryptoDieByKind(
      tmpl.sides,
      tmpl.dieKind
    );

    rawRolls.push({
      ...tmpl,
      value,
      displayValue,
      rawByte,
      timestamp: timeStr,
      isRolled: true,
      dropped: false,
      rerollCount: 0,
    });
  }

  const { evaluatedRolls, diceSum, total } = evaluateRollPool(rawRolls, mode, modifier);

  return {
    rolls: evaluatedRolls,
    diceSum,
    total,
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
  dieSize: number = 60
): Promise<DiePhysicsTrajectory[]> {
  const count = diceIds.length;
  if (count === 0) return [];

  const padding = 10;
  const topSafePadding = 12;
  const rightSafeClearBtn = 42; // Sağ üstteki kırmızı X butonuna çarpmaması için
  const minX = padding;
  const maxX = Math.max(minX + 10, trayWidth - dieSize - padding);
  const minY = topSafePadding;
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
          scale: 1.26,
          hitWall: false,
        },
      ],
    };
  });

  const totalSteps = 24;
  const recordInterval = 4;
  const minDist = dieSize * 0.94;

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

      // Sağ üst köşedeki X silme tuşu alanından uzak tutma
      if (b.x > maxX - rightSafeClearBtn && b.y < minY + rightSafeClearBtn) {
        b.x = Math.max(minX, maxX - rightSafeClearBtn);
        b.vx = -Math.abs(b.vx) * 0.7;
      }

      b.vx *= 0.88;
      b.vy *= 0.88;
      b.vRot *= 0.86;
    }

    // 2. Zarların birbirleriyle elastik çarpışması
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
      const bounceHeight =
        step === totalSteps
          ? 1
          : 1 + Math.max(0, (1 - progress) * 0.22 * Math.abs(Math.sin(step * 0.9)));

      for (let i = 0; i < count; i++) {
        const b = bodies[i];
        // Son karede zarların geometrik şeklinin net okunması için hafif doğal açı (-10° ile +10° arası)
        const finalAngle =
          step === totalSteps
            ? Math.round(b.rot / 360) * 360 + ((seedBytes[i * 8 + 6] / 255 - 0.5) * 16)
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
