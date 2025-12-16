/**
 * BatchManager - Utility for splitting arrays into batches
 */
export class BatchManager {
  /**
   * Split an array into batches of specified size
   * @param items - Array to split
   * @param batchSize - Size of each batch
   * @returns Array of batches
   *
   * @example
   * splitIntoBatches([1,2,3,4,5], 2) → [[1,2], [3,4], [5]]
   * splitIntoBatches([1,2,3], 5) → [[1,2,3]]
   */
  static splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    if (batchSize <= 0) {
      throw new Error('Batch size must be greater than 0');
    }

    if (items.length === 0) {
      return [];
    }

    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Get batch info for display
   * @param totalItems - Total number of items
   * @param batchSize - Size of each batch
   * @returns Batch information
   */
  static getBatchInfo(totalItems: number, batchSize: number): {
    totalBatches: number;
    batchSizes: number[];
  } {
    if (totalItems === 0) {
      return { totalBatches: 0, batchSizes: [] };
    }

    const totalBatches = Math.ceil(totalItems / batchSize);
    const batchSizes: number[] = [];

    for (let i = 0; i < totalBatches; i++) {
      const remaining = totalItems - i * batchSize;
      batchSizes.push(Math.min(batchSize, remaining));
    }

    return { totalBatches, batchSizes };
  }
}
