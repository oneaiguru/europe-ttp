// @ts-expect-error - bun:test is a built-in Bun module
import { describe, it, expect } from 'bun:test';
import { getValidatedModuleUrl } from '../../../scripts/ui/capture-new-ui-snapshots';

describe('getValidatedModuleUrl', () => {
  it('accepts valid relative paths within repo', () => {
    const url = getValidatedModuleUrl('app/portal/home/render.ts');
    expect(url.startsWith('file://')).toBe(true);
  });

  it('rejects path traversal with ..', () => {
    expect(() => getValidatedModuleUrl('../../../etc/passwd')).toThrow(/Path traversal rejected/);
  });

  it('rejects absolute path escaping root', () => {
    expect(() => getValidatedModuleUrl('/etc/passwd')).toThrow(/Path traversal rejected/);
  });

  it('rejects path that starts within repo but escapes via ..', () => {
    expect(() => getValidatedModuleUrl('app/../../../etc/passwd')).toThrow(/Path traversal rejected/);
  });

  it('accepts deeply nested valid paths', () => {
    const url = getValidatedModuleUrl('app/forms/ttc_application_us/render.ts');
    expect(url.startsWith('file://')).toBe(true);
    expect(url).toContain('ttc_application_us');
  });
});
