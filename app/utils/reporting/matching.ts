/**
 * Bounded Levenshtein distance check.
 * Returns true if the edit distance between str1 and str2 is <= maxDistance.
 *
 * Port of pyutils.utils.levenshteinB
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @param maxDistance - Maximum allowed edit distance (1 for TTC evals, 2 for post-TTC)
 * @param caseInsensitive - If true, compare lowercase versions
 */
export function levenshteinB(
  str1: string,
  str2: string,
  maxDistance: number,
  caseInsensitive: boolean = false,
): boolean {
  let source = str1.trim();
  let target = str2.trim();

  if (!source || !target || source.length === 0 || target.length === 0) {
    return false;
  }

  // If tolerance is greater than length of either string
  // then levenshtein is not that useful
  if (maxDistance >= source.length || maxDistance >= target.length) {
    return false;
  }

  if (caseInsensitive) {
    source = source.toLowerCase();
    target = target.toLowerCase();
  }

  if (source.length < target.length) {
    return levenshteinB(target, source, maxDistance, caseInsensitive);
  }
  // So now we have len(source) >= len(target).

  // We use a dynamic programming algorithm, but with the
  // added optimization that we only need the last two rows
  // of the matrix.
  const previousRow: number[] = [];
  for (let i = 0; i <= target.length; i++) {
    previousRow.push(i);
  }

  for (const s of source) {
    // Insertion (target grows longer than source):
    const currentRow: number[] = [previousRow[0] + 1];

    for (let j = 1; j <= target.length; j++) {
      // Substitution or matching:
      // Target and source items are aligned, and either
      // are different (cost of 1), or are the same (cost of 0).
      const subCost = previousRow[j - 1] + (target[j - 1] !== s ? 1 : 0);
      const insertCost = previousRow[j] + 1;
      const delCost = currentRow[j - 1] + 1;

      currentRow[j] = Math.min(subCost, insertCost, delCost);
    }

    for (let i = 0; i < previousRow.length; i++) {
      previousRow[i] = currentRow[i];
    }
  }

  return previousRow[target.length] <= maxDistance;
}
