/**
 * Common statistical functions - Available to all plugins
 */
export class StatisticsHelper {
  static frequency<T>(items: T[]): Map<T, number> {
    const freq = new Map<T, number>();
    items.forEach((item) => {
      freq.set(item, (freq.get(item) || 0) + 1);
    });
    return freq;
  }

  static topN<T>(items: T[], n: number): Array<{ item: T; count: number }> {
    const freq = this.frequency(items);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([item, count]) => ({ item, count }));
  }

  static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  static median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  static groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return items.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  static countBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
  ): Record<K, number> {
    return items.reduce((counts, item) => {
      const key = keyFn(item);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {} as Record<K, number>);
  }
}
