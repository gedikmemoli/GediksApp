import * as Crypto from 'expo-crypto';

export const DICE_SIDES = [4, 6, 8, 10, 12, 20] as const;
export type DiceSides = (typeof DICE_SIDES)[number];

export interface SingleDieRoll {
  id: string;
  sides: DiceSides;
  value: number;
  rawByte: number;
  timestamp: string;
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
 * Seçilen zarlar dizisini (ör. [20, 8, 6, 6]) kriptografik olarak atar,
 * her bir zarın tekil sonucunu ve genel toplamı döndürür.
 */
export async function rollCryptoPool(
  dicePool: DiceSides[]
): Promise<{ rolls: SingleDieRoll[]; total: number }> {
  const rolls: SingleDieRoll[] = [];
  let total = 0;

  for (let i = 0; i < dicePool.length; i++) {
    const sides = dicePool[i];
    const { value, rawByte } = await rollCryptoDie(sides);
    const idBytes = await Crypto.getRandomBytesAsync(4);
    const hexId = Array.from(idBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    rolls.push({
      id: `${hexId}-${i}`,
      sides,
      value,
      rawByte,
      timestamp: timeStr,
    });
    total += value;
  }

  return { rolls, total };
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
