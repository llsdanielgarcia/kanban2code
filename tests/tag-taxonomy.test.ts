/**
 * Unit Tests for Tag Taxonomy
 * Phase 5.7: Tag Taxonomy and Conventions
 */

import { describe, it, expect } from 'vitest';
import {
  TYPE_TAGS,
  PRIORITY_TAGS,
  STATUS_TAGS,
  DOMAIN_TAGS,
  COMPONENT_TAGS,
  ORCHESTRATION_TAGS,
  TAG_TAXONOMY,
  ALL_TAGS,
  isTagInCategory,
  getTagCategory,
  validateTags,
  getTagColor,
} from '../src/types/filters';

describe('Tag Taxonomy', () => {
  describe('Tag Constants', () => {
    it('should define type tags', () => {
      expect(TYPE_TAGS).toContain('feature');
      expect(TYPE_TAGS).toContain('bug');
      expect(TYPE_TAGS).toContain('refactor');
      expect(TYPE_TAGS).toContain('docs');
      expect(TYPE_TAGS).toContain('chore');
    });

    it('should define priority tags', () => {
      expect(PRIORITY_TAGS).toContain('p0');
      expect(PRIORITY_TAGS).toContain('critical');
      expect(PRIORITY_TAGS).toContain('p1');
      expect(PRIORITY_TAGS).toContain('high');
      expect(PRIORITY_TAGS).toContain('p2');
      expect(PRIORITY_TAGS).toContain('p3');
    });

    it('should define status tags', () => {
      expect(STATUS_TAGS).toContain('blocked');
      expect(STATUS_TAGS).toContain('in-progress');
      expect(STATUS_TAGS).toContain('review');
      expect(STATUS_TAGS).toContain('shipped');
    });

    it('should define domain tags', () => {
      expect(DOMAIN_TAGS).toContain('mvp');
      expect(DOMAIN_TAGS).toContain('accessibility');
      expect(DOMAIN_TAGS).toContain('performance');
      expect(DOMAIN_TAGS).toContain('security');
    });

    it('should define component tags', () => {
      expect(COMPONENT_TAGS).toContain('sidebar');
      expect(COMPONENT_TAGS).toContain('board');
      expect(COMPONENT_TAGS).toContain('keyboard');
      expect(COMPONENT_TAGS).toContain('context');
    });

    it('should define orchestration tags', () => {
      expect(ORCHESTRATION_TAGS).toContain('missing-architecture');
      expect(ORCHESTRATION_TAGS).toContain('architecture-ready');
      expect(ORCHESTRATION_TAGS).toContain('missing-decomposition');
      expect(ORCHESTRATION_TAGS).toContain('decomposition-ready');
      expect(ORCHESTRATION_TAGS).toContain('roadmap');
      expect(ORCHESTRATION_TAGS).toContain('architecture');
      expect(ORCHESTRATION_TAGS).toContain('decomposition');
    });

    it('should have all categories in TAG_TAXONOMY', () => {
      expect(TAG_TAXONOMY.type).toBe(TYPE_TAGS);
      expect(TAG_TAXONOMY.priority).toBe(PRIORITY_TAGS);
      expect(TAG_TAXONOMY.status).toBe(STATUS_TAGS);
      expect(TAG_TAXONOMY.domain).toBe(DOMAIN_TAGS);
      expect(TAG_TAXONOMY.component).toBe(COMPONENT_TAGS);
      expect(TAG_TAXONOMY.orchestration).toBe(ORCHESTRATION_TAGS);
    });

    it('should have ALL_TAGS contain all tags', () => {
      expect(ALL_TAGS.length).toBe(
        TYPE_TAGS.length +
        PRIORITY_TAGS.length +
        STATUS_TAGS.length +
        DOMAIN_TAGS.length +
        COMPONENT_TAGS.length +
        ORCHESTRATION_TAGS.length
      );
    });
  });

  describe('isTagInCategory', () => {
    it('should return true for tags in category', () => {
      expect(isTagInCategory('feature', 'type')).toBe(true);
      expect(isTagInCategory('bug', 'type')).toBe(true);
      expect(isTagInCategory('p0', 'priority')).toBe(true);
      expect(isTagInCategory('blocked', 'status')).toBe(true);
      expect(isTagInCategory('mvp', 'domain')).toBe(true);
      expect(isTagInCategory('sidebar', 'component')).toBe(true);
      expect(isTagInCategory('missing-architecture', 'orchestration')).toBe(true);
      expect(isTagInCategory('architecture-ready', 'orchestration')).toBe(true);
      expect(isTagInCategory('roadmap', 'orchestration')).toBe(true);
    });

    it('should return false for tags not in category', () => {
      expect(isTagInCategory('feature', 'priority')).toBe(false);
      expect(isTagInCategory('p0', 'type')).toBe(false);
      expect(isTagInCategory('custom-tag', 'type')).toBe(false);
    });
  });

  describe('getTagCategory', () => {
    it('should return correct category for known tags', () => {
      expect(getTagCategory('feature')).toBe('type');
      expect(getTagCategory('bug')).toBe('type');
      expect(getTagCategory('p0')).toBe('priority');
      expect(getTagCategory('critical')).toBe('priority');
      expect(getTagCategory('blocked')).toBe('status');
      expect(getTagCategory('mvp')).toBe('domain');
      expect(getTagCategory('sidebar')).toBe('component');
      expect(getTagCategory('missing-architecture')).toBe('orchestration');
      expect(getTagCategory('missing-decomposition')).toBe('orchestration');
      expect(getTagCategory('architecture-ready')).toBe('orchestration');
      expect(getTagCategory('decomposition-ready')).toBe('orchestration');
      expect(getTagCategory('roadmap')).toBe('orchestration');
    });

    it('should return "custom" for unknown tags', () => {
      expect(getTagCategory('my-custom-tag')).toBe('custom');
      expect(getTagCategory('unknown')).toBe('custom');
    });
  });

  describe('validateTags', () => {
    it('should pass for valid single type tag', () => {
      const result = validateTags(['feature', 'mvp', 'sidebar']);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for multiple type tags', () => {
      const result = validateTags(['feature', 'bug']);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Multiple type tags');
    });

    it('should warn for multiple priority tags', () => {
      const result = validateTags(['feature', 'p0', 'p1']);
      expect(result.valid).toBe(true); // Warnings don't fail validation
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Multiple priority tags');
    });

    it('should warn for blocked tag', () => {
      const result = validateTags(['feature', 'blocked']);
      expect(result.warnings.some(w => w.includes('blocked'))).toBe(true);
    });

    it('should warn for MVP with low priority', () => {
      const result = validateTags(['feature', 'mvp', 'p3']);
      expect(result.warnings.some(w => w.includes('MVP') && w.includes('p3'))).toBe(true);
    });

    it('should pass for empty tags', () => {
      const result = validateTags([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow custom tags', () => {
      const result = validateTags(['feature', 'custom-tag', 'another-custom']);
      expect(result.valid).toBe(true);
    });

    it('should warn for missing-architecture without missing-decomposition', () => {
      const result = validateTags(['architecture', 'p0', 'missing-architecture']);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('missing-architecture') && w.includes('missing-decomposition'))).toBe(true);
    });

    it('should pass for both missing-* tags together', () => {
      const result = validateTags(['architecture', 'p0', 'missing-architecture', 'missing-decomposition']);
      expect(result.valid).toBe(true);
      expect(result.warnings.every(w => !w.includes('missing-architecture') || w.includes('priority'))).toBe(true);
    });

    it('should pass for only missing-decomposition', () => {
      const result = validateTags(['architecture', 'p0', 'missing-decomposition']);
      expect(result.valid).toBe(true);
      expect(result.warnings.every(w => !w.includes('Typically both are set'))).toBe(true);
    });

    it('should warn for orchestration state tags without p0', () => {
      const result = validateTags(['architecture', 'p1', 'missing-decomposition']);
      expect(result.warnings.some(w => w.includes('Orchestration') && w.includes('p0'))).toBe(true);
    });

    it('should fail for conflicting orchestration state tags (missing-architecture + architecture-ready)', () => {
      const result = validateTags(['architecture', 'p0', 'missing-architecture', 'architecture-ready']);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing-architecture') && e.includes('architecture-ready'))).toBe(true);
    });

    it('should fail for conflicting orchestration state tags (missing-decomposition + decomposition-ready)', () => {
      const result = validateTags(['decomposition', 'p0', 'missing-decomposition', 'decomposition-ready']);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing-decomposition') && e.includes('decomposition-ready'))).toBe(true);
    });

    it('should fail for decomposition-ready without architecture-ready', () => {
      const result = validateTags(['decomposition', 'p0', 'decomposition-ready']);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('decomposition-ready') && e.includes('architecture-ready'))).toBe(true);
    });

    it('should pass for architecture-ready with missing-decomposition', () => {
      const result = validateTags(['architecture', 'p0', 'architecture-ready', 'missing-decomposition']);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getTagColor', () => {
    it('should return red for bugs', () => {
      const color = getTagColor('bug');
      expect(color).toBe('#e74c3c');
    });

    it('should return green for features', () => {
      const color = getTagColor('feature');
      expect(color).toBe('#27ae60');
    });

    it('should return red for critical priority', () => {
      expect(getTagColor('p0')).toBe('#e74c3c');
      expect(getTagColor('critical')).toBe('#e74c3c');
    });

    it('should return orange for high priority', () => {
      expect(getTagColor('p1')).toBe('#e67e22');
      expect(getTagColor('high')).toBe('#e67e22');
    });

    it('should return different colors for different categories', () => {
      const domainColor = getTagColor('mvp');
      const componentColor = getTagColor('sidebar');
      const customColor = getTagColor('my-custom');

      expect(domainColor).toBe('#1abc9c');
      expect(componentColor).toBe('#34495e');
      expect(customColor).toBe('#7f8c8d');
    });

    it('should return orange for orchestration state tags (missing-*)', () => {
      expect(getTagColor('missing-architecture')).toBe('#e67e22');
      expect(getTagColor('missing-decomposition')).toBe('#e67e22');
    });

    it('should return green for orchestration ready tags (*-ready)', () => {
      expect(getTagColor('architecture-ready')).toBe('#27ae60');
      expect(getTagColor('decomposition-ready')).toBe('#27ae60');
    });

    it('should return teal for orchestration type tags', () => {
      expect(getTagColor('roadmap')).toBe('#16a085');
      expect(getTagColor('architecture')).toBe('#16a085');
      expect(getTagColor('decomposition')).toBe('#16a085');
    });
  });
});
