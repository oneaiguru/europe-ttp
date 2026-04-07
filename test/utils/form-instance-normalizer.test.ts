// @ts-expect-error - bun:test is a built-in Bun module
import { describe, expect, it } from 'bun:test';
import { getReportableInstanceKeys } from '../../app/utils/reporting/form-instance-normalizer';

describe('form instance normalizer', () => {
  it('returns default when default is the only instance', () => {
    const keys = getReportableInstanceKeys({
      default: { data: { i_fname: 'Test' } },
    });

    expect(keys).toEqual(['default']);
  });

  it('keeps non-default behavior unchanged when alias default exists', () => {
    const keys = getReportableInstanceKeys({
      default: { data: { i_fname: 'Alias' } },
      us_2026: { data: { i_fname: 'Primary' } },
      ca_2026: { data: { i_fname: 'Secondary' } },
    });

    expect(keys).toEqual(['us_2026', 'ca_2026']);
  });

  it('ignores metadata keys during aggregation loops', () => {
    const keys = getReportableInstanceKeys(
      {
        reporting: { count: 1 },
        default: { data: { i_fname: 'Test' } },
      },
      ['reporting'],
    );

    expect(keys).toEqual(['default']);
  });
});
