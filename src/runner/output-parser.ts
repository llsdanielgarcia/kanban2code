import type { Stage } from '../types/task';

const STAGES: readonly Stage[] = ['inbox', 'plan', 'code', 'audit', 'completed'];

type AuditVerdict = 'ACCEPTED' | 'NEEDS_WORK';

function parseCommentMarker(output: string, marker: string): string | undefined {
  const pattern = new RegExp(`<!--\\s*${marker}\\s*:\\s*([\\s\\S]*?)\\s*-->`, 'i');
  const match = output.match(pattern);
  return match?.[1]?.trim();
}

function normalizeStage(value: string | undefined): Stage | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (STAGES.includes(normalized as Stage)) {
    return normalized as Stage;
  }

  return undefined;
}

/**
 * Extracts stage transition marker from output.
 */
export function parseStageTransition(output: string): Stage | undefined {
  const markerValue = parseCommentMarker(output, 'STAGE_TRANSITION');
  return normalizeStage(markerValue);
}

/**
 * Extracts audit rating from explicit marker, with prose fallback patterns.
 */
export function parseAuditRating(output: string): number | undefined {
  const markerValue = parseCommentMarker(output, 'AUDIT_RATING');
  if (markerValue) {
    const fromMarker = Number.parseInt(markerValue, 10);
    if (Number.isFinite(fromMarker)) {
      return fromMarker;
    }
  }

  const prosePatterns = [
    /\b(?:audit\s*)?rating\b\s*[:=-]?\s*\**\s*(\d{1,2})\s*\/\s*10\b/i,
    /\b(?:audit\s*)?rating\b\s*[:=-]?\s*\**\s*(\d{1,2})\b/i,
  ];

  for (const pattern of prosePatterns) {
    const match = output.match(pattern);
    if (!match) {
      continue;
    }

    const rating = Number.parseInt(match[1], 10);
    if (Number.isFinite(rating)) {
      return rating;
    }
  }

  return undefined;
}

/**
 * Extracts audit verdict (ACCEPTED / NEEDS_WORK) from marker or prose text.
 */
export function parseAuditVerdict(output: string): AuditVerdict | undefined {
  const markerValue = parseCommentMarker(output, 'AUDIT_VERDICT');
  if (markerValue) {
    const normalized = markerValue.toUpperCase();
    if (normalized === 'ACCEPTED' || normalized === 'NEEDS_WORK') {
      return normalized;
    }
  }

  if (/\bACCEPTED\b/i.test(output)) {
    return 'ACCEPTED';
  }

  if (/\bNEEDS_WORK\b/i.test(output)) {
    return 'NEEDS_WORK';
  }

  return undefined;
}

/**
 * Extracts files changed marker into a normalized file path list.
 */
export function parseFilesChanged(output: string): string[] | undefined {
  const markerValue = parseCommentMarker(output, 'FILES_CHANGED');
  if (!markerValue) {
    return undefined;
  }

  const parts = markerValue
    .split(/[\n,]+/)
    .map(part => part.trim())
    .map(part => part.replace(/^[-*]\s*/, '').replace(/^`|`$/g, '').trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  return [...new Set(parts)];
}
