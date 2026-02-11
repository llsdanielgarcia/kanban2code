import { describe, expect, test } from 'vitest';
import {
  parseAuditRating,
  parseAuditVerdict,
  parseFilesChanged,
  parseStageTransition,
} from '../src/runner/output-parser';

describe('output-parser', () => {
  test('Parse <!-- AUDIT_RATING: 8 --> returns 8', () => {
    expect(parseAuditRating('Result\n<!-- AUDIT_RATING: 8 -->')).toBe(8);
  });

  test("Parse <!-- STAGE_TRANSITION: audit --> returns 'audit'", () => {
    expect(parseStageTransition('<!-- STAGE_TRANSITION: audit -->')).toBe('audit');
  });

  test('Fallback parses "Rating: 9/10" returns 9', () => {
    const output = 'Looks good overall. **Rating: 9/10** with minor nits.';
    expect(parseAuditRating(output)).toBe(9);
  });

  test('Missing markers return undefined', () => {
    const output = 'No structured fields here.';
    expect(parseAuditRating(output)).toBeUndefined();
    expect(parseStageTransition(output)).toBeUndefined();
    expect(parseAuditVerdict(output)).toBeUndefined();
    expect(parseFilesChanged(output)).toBeUndefined();
  });

  test("Parse <!-- FILES_CHANGED: a.ts, b.ts --> returns ['a.ts', 'b.ts']", () => {
    const output = '<!-- FILES_CHANGED: a.ts, b.ts -->';
    expect(parseFilesChanged(output)).toEqual(['a.ts', 'b.ts']);
  });

  test('parseAuditVerdict extracts ACCEPTED and NEEDS_WORK', () => {
    expect(parseAuditVerdict('<!-- AUDIT_VERDICT: ACCEPTED -->')).toBe('ACCEPTED');
    expect(parseAuditVerdict('Verdict: NEEDS_WORK due to failing tests')).toBe('NEEDS_WORK');
  });

  test('parseFilesChanged supports multiline and deduplicates', () => {
    const output = `<!-- FILES_CHANGED:
- src/a.ts
- src/b.ts
- src/a.ts
-->`;

    expect(parseFilesChanged(output)).toEqual(['src/a.ts', 'src/b.ts']);
  });

  test('parseStageTransition ignores unknown stage values', () => {
    expect(parseStageTransition('<!-- STAGE_TRANSITION: deploy -->')).toBeUndefined();
  });
});
