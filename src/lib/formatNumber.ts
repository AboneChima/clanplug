// Format numbers like TikTok (1k, 5k, 1M, etc.)
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  } else if (count < 1000000000) {
    const m = count / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  } else {
    const b = count / 1000000000;
    return b % 1 === 0 ? `${b}B` : `${b.toFixed(1)}B`;
  }
}
