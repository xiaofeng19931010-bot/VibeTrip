import { describe, it, expect } from 'vitest';
import { parsePlanRequest, extractDestination, extractDays, extractBudget, extractRole } from '../engine/planning.js';

describe('Planning', () => {
  describe('extractDestination', () => {
    it('should extract destination from simple description', () => {
      expect(extractDestination('去成都玩')).toBe('成都');
      expect(extractDestination('想去成都旅行')).toBe('成都');
    });

    it('should return unknown for no match', () => {
      expect(extractDestination('随便走走')).toBe('未知目的地');
    });
  });

  describe('extractDays', () => {
    it('should extract days from description', () => {
      expect(extractDays('成都3天')).toBe(3);
      expect(extractDays('去玩5天')).toBe(5);
      expect(extractDays('旅行一周')).toBeUndefined();
    });
  });

  describe('extractBudget', () => {
    it('should extract budget from description', () => {
      expect(extractBudget('预算5000')).toBe(5000);
      expect(extractBudget('3000元')).toBe(3000);
      expect(extractBudget('5k预算')).toBe(5000);
    });
  });

  describe('extractRole', () => {
    it('should extract role from description', () => {
      expect(extractRole('带父母去成都')).toBe('parents');
      expect(extractRole('带孩子旅行')).toBe('family');
      expect(extractRole('情侣出游')).toBe('couple');
      expect(extractRole('闺蜜旅行')).toBe('friends');
    });

    it('should return undefined for no match', () => {
      expect(extractRole('一个人旅行')).toBeUndefined();
    });
  });

  describe('parsePlanRequest', () => {
    it('should parse request and identify missing information', () => {
      const result = parsePlanRequest({
        description: '去成都3天',
        userId: 'user-123',
      });

      expect(result.destination).toBe('成都');
      expect(result.days).toBe(3);
      expect(result.role).toBe('friends');
    });

    it('should identify missing information', () => {
      const result = parsePlanRequest({
        description: '去旅行',
        userId: 'user-123',
      });

      expect(result.questions.length).toBeGreaterThan(0);
    });
  });
});
