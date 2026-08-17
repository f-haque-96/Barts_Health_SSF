/**
 * Unit tests for the VAT COS suggestion logic (Finance determination).
 */
import { describe, it, expect } from 'vitest';
import {
  suggestCosCategory,
  SERVICE_TYPE_TO_COS,
  VAT_STATUS_OPTIONS,
  COS_CATEGORIES,
} from './vatDetermination';

describe('suggestCosCategory', () => {
  it('maps a known service type to its COS heading', () => {
    expect(suggestCosCategory(['software'])).toBe('computer_services');
    expect(suggestCosCategory(['construction'])).toBe('estates_maintenance');
  });
  it('accepts a bare string as well as an array', () => {
    expect(suggestCosCategory('training')).toBe('training');
  });
  it('returns the first mappable type when several are selected', () => {
    expect(suggestCosCategory(['unknownthing', 'legal'])).toBe('legal_services');
  });
  it('returns empty string when nothing maps', () => {
    expect(suggestCosCategory(['nope'])).toBe('');
    expect(suggestCosCategory([])).toBe('');
    expect(suggestCosCategory(undefined)).toBe('');
  });
});

describe('option lists are well-formed', () => {
  it('every mapping target exists in COS_CATEGORIES', () => {
    const cosValues = new Set(COS_CATEGORIES.map((c) => c.value));
    for (const target of Object.values(SERVICE_TYPE_TO_COS)) {
      expect(cosValues.has(target)).toBe(true);
    }
  });
  it('option lists have value+label shape', () => {
    for (const list of [VAT_STATUS_OPTIONS, COS_CATEGORIES]) {
      for (const o of list) {
        expect(typeof o.value).toBe('string');
        expect(typeof o.label).toBe('string');
      }
    }
  });
});
