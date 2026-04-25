import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileManager } from '../src/profile-manager.js';

// Mock localStorage
const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
};

describe('ProfileManager', () => {
  let localStorage;
  let manager;

  beforeEach(() => {
    localStorage = createLocalStorageMock();
    manager = new ProfileManager(localStorage);
  });

  describe('saveProfile', () => {
    it('should save a profile', () => {
      const profile = {
        name: 'Test Profile',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      manager.saveProfile(profile);

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should add timestamp to profile', () => {
      const profile = {
        name: 'Test Profile',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      const saved = manager.saveProfile(profile);

      expect(saved.timestamp).toBeDefined();
      expect(typeof saved.timestamp).toBe('number');
    });

    it('should add to history', () => {
      const profile = {
        name: 'Test Profile',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      manager.saveProfile(profile);
      const history = manager.getHistory();

      expect(history).toHaveLength(1);
      expect(history[0].name).toBe('Test Profile');
    });
  });

  describe('getProfiles', () => {
    it('should return all saved profiles', () => {
      const profile1 = {
        name: 'Profile 1',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      const profile2 = {
        name: 'Profile 2',
        rates: {
          roll: { center: 80, maxRate: 700, expo: 10 },
          pitch: { center: 80, maxRate: 700, expo: 10 },
          yaw: { center: 80, maxRate: 700, expo: 10 }
        },
        throttle: { mid: 60, expo: 5 }
      };

      manager.saveProfile(profile1);
      manager.saveProfile(profile2);

      const profiles = manager.getProfiles();
      expect(profiles).toHaveLength(2);
    });

    it('should return empty array when no profiles exist', () => {
      const profiles = manager.getProfiles();
      expect(profiles).toEqual([]);
    });
  });

  describe('getHistory', () => {
    it('should maintain chronological order', () => {
      const profile1 = {
        name: 'First',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      const profile2 = {
        name: 'Second',
        rates: {
          roll: { center: 80, maxRate: 700, expo: 10 },
          pitch: { center: 80, maxRate: 700, expo: 10 },
          yaw: { center: 80, maxRate: 700, expo: 10 }
        },
        throttle: { mid: 60, expo: 5 }
      };

      manager.saveProfile(profile1);
      manager.saveProfile(profile2);

      const history = manager.getHistory();
      expect(history[0].name).toBe('First');
      expect(history[1].name).toBe('Second');
      expect(history[0].timestamp).toBeLessThanOrEqual(history[1].timestamp);
    });
  });

  describe('exportHistory', () => {
    it('should export history as JSON', () => {
      const profile = {
        name: 'Test Profile',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      manager.saveProfile(profile);
      const exported = manager.exportHistory();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Test Profile');
    });
  });

  describe('importHistory', () => {
    it('should import history from JSON', () => {
      const history = [
        {
          name: 'Imported Profile',
          timestamp: Date.now(),
          rates: {
            roll: { center: 70, maxRate: 670, expo: 0 },
            pitch: { center: 70, maxRate: 670, expo: 0 },
            yaw: { center: 70, maxRate: 670, expo: 0 }
          },
          throttle: { mid: 50, expo: 0 }
        }
      ];

      manager.importHistory(JSON.stringify(history));
      const profiles = manager.getProfiles();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Imported Profile');
    });

    it('should merge with existing history', () => {
      const profile = {
        name: 'Existing',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      manager.saveProfile(profile);

      const importData = [
        {
          name: 'Imported',
          timestamp: Date.now(),
          rates: {
            roll: { center: 80, maxRate: 700, expo: 10 },
            pitch: { center: 80, maxRate: 700, expo: 10 },
            yaw: { center: 80, maxRate: 700, expo: 10 }
          },
          throttle: { mid: 60, expo: 5 }
        }
      ];

      manager.importHistory(JSON.stringify(importData));
      const profiles = manager.getProfiles();

      expect(profiles).toHaveLength(2);
    });
  });

  describe('createDefaultProfile', () => {
    it('should create a profile with default values', () => {
      const profile = manager.createDefaultProfile('Default');

      expect(profile.name).toBe('Default');
      expect(profile.rates.roll).toBeDefined();
      expect(profile.rates.pitch).toBeDefined();
      expect(profile.rates.yaw).toBeDefined();
      expect(profile.throttle).toBeDefined();
    });
  });

  describe('deleteProfile', () => {
    it('should remove profile by timestamp', () => {
      const profile = {
        name: 'To Delete',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      const saved = manager.saveProfile(profile);
      expect(manager.getProfiles()).toHaveLength(1);

      manager.deleteProfile(saved.timestamp);
      expect(manager.getProfiles()).toHaveLength(0);
    });
  });
});
