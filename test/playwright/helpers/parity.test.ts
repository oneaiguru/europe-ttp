// @ts-expect-error - bun:test is a built-in Bun module
import { describe, it, expect } from 'bun:test';

import { getSnapshotFileUrl } from './parity';

describe('getSnapshotFileUrl', () => {
  const basePath = '/project/docs/ui';

  it('constructs valid file URL for normal path', () => {
    const result = getSnapshotFileUrl(basePath, 'snapshots/html/foo.html');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('snapshots');
    expect(result).toContain('foo.html');
  });

  it('rejects path traversal with .. segments', () => {
    expect(() => getSnapshotFileUrl(basePath, '../etc/passwd')).toThrow(
      'Path traversal rejected'
    );
  });

  it('rejects traversal to parent directory', () => {
    expect(() => getSnapshotFileUrl(basePath, '../../secret')).toThrow(
      'Path traversal rejected'
    );
  });

  it('rejects traversal disguised in nested path', () => {
    expect(() =>
      getSnapshotFileUrl(basePath, 'snapshots/../../../etc/passwd')
    ).toThrow('Path traversal rejected');
  });

  it('URL-encodes spaces in path', () => {
    const result = getSnapshotFileUrl(basePath, 'snapshots/my file.html');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('my%20file.html');
  });

  it('handles paths with special characters', () => {
    const result = getSnapshotFileUrl(basePath, 'snapshots/file#hash.html');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('%23');
  });

  it('accepts path that equals base directory exactly', () => {
    // Edge case: path that resolves to exactly the base directory
    const result = getSnapshotFileUrl(basePath, '.');
    expect(result).toMatch(/^file:\/\//);
    // Should resolve to the base path itself
    expect(result).toContain('docs/ui');
  });
});
