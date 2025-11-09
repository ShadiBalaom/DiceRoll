interface Identifiable {
  id: string;
}

/**
 * Generates a new, unique, sequential ID for a list of items.
 * It finds the highest existing numeric ID for a given prefix and increments it.
 * A do-while loop ensures the generated ID is truly unique, preventing collisions
 * even if the existing list has gaps or manually-added non-sequential IDs.
 * @param prefix 'ST' for students or 'QS' for questions.
 * @param items The array of existing items to check against.
 * @returns A new unique ID string (e.g., "ST-05", "QS-012").
 */
export const generateNewId = <T extends Identifiable>(prefix: 'ST' | 'QS', items: T[]): string => {
  const existingIdSet = new Set(items.map(item => item.id));

  // Find the highest number from existing IDs with the same prefix
  const numericIds = items
    .map(item => {
      if (item.id.startsWith(prefix + '-')) {
        return parseInt(item.id.split('-')[1], 10);
      }
      return NaN;
    })
    .filter(num => !isNaN(num));

  let newIdNumber = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
  let newId: string;

  // Ensure the generated ID is unique
  do {
    const padLength = prefix === 'ST' ? 2 : 3;
    const paddedId = String(newIdNumber).padStart(padLength, '0');
    newId = `${prefix}-${paddedId}`;
    newIdNumber++; // Increment for the next potential loop iteration
  } while (existingIdSet.has(newId));

  return newId;
};
