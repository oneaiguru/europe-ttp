/**
 * Select reportable form instances while preserving legacy alias behavior:
 * if non-default instances exist, ignore "default" (it is just last-instance alias);
 * otherwise include "default" so default-only submissions remain reportable.
 */
export function getReportableInstanceKeys(
  instanceMap: Record<string, unknown> | undefined,
  ignoreKeys: string[] = [],
): string[] {
  if (!instanceMap) return [];

  const ignored = new Set(ignoreKeys);
  const allKeys = Object.keys(instanceMap).filter((key) => !ignored.has(key));
  const nonDefaultKeys = allKeys.filter((key) => key !== 'default');

  if (nonDefaultKeys.length > 0) {
    return nonDefaultKeys;
  }

  return allKeys.includes('default') ? ['default'] : [];
}
