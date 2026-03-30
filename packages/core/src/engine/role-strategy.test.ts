import { describe, it, expect } from 'vitest';
import { getRoleProfile, mergeWithUserPreferences, parseUserInstructions } from '../engine/role-strategy.js';

describe('RoleStrategy', () => {
  describe('getRoleProfile', () => {
    it('should return correct profile for each role', () => {
      const parents = getRoleProfile('parents');
      expect(parents.name).toBe('parents');
      expect(parents.pacing.activitiesPerDay).toBe(2);

      const soldier = getRoleProfile('soldier');
      expect(soldier.name).toBe('soldier');
      expect(soldier.pacing.activitiesPerDay).toBe(8);
    });
  });

  describe('parseUserInstructions', () => {
    it('should parse sleep-in instruction', () => {
      const prefs = parseUserInstructions(['不要早起', '睡到自然醒']);
      const wakePref = prefs.find(p => p.key === 'wakeUpTime');
      expect(wakePref?.value).toBe('09:00');
    });

    it('should parse slow pace instruction', () => {
      const prefs = parseUserInstructions(['多休息', '慢节奏']);
      const pacePref = prefs.find(p => p.key === 'activitiesPerDay');
      expect(pacePref?.value).toBe(2);
    });

    it('should parse family instruction', () => {
      const prefs = parseUserInstructions(['带孩子']);
      const familyPref = prefs.find(p => p.key === 'familyFacility');
      expect(familyPref?.value).toHaveProperty('requireBabyChair');
    });
  });

  describe('mergeWithUserPreferences', () => {
    it('should merge high priority preferences', () => {
      const profile = getRoleProfile('friends');
      const merged = mergeWithUserPreferences(profile, [
        { key: 'activitiesPerDay', value: 2, priority: 'high' },
      ]);

      expect(merged.pacing.activitiesPerDay).toBe(2);
    });

    it('should not affect profile without preferences', () => {
      const profile = getRoleProfile('couple');
      const merged = mergeWithUserPreferences(profile, []);

      expect(merged.pacing.activitiesPerDay).toBe(profile.pacing.activitiesPerDay);
    });
  });
});
