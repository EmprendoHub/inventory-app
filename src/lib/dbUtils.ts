export async function batchProcess<T>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => Promise<void>
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processFn(batch);
  }
}
