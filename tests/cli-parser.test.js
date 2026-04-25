import { describe, it, expect } from 'vitest';
import { parseCLI, generateCLI } from '../src/cli-parser.js';

describe('CLI Parser', () => {
  describe('parseCLI', () => {
    it('should parse basic CLI format', () => {
      const input = 'set roll_rc_rate = 70';
      const result = parseCLI(input);
      expect(result).toEqual({ roll_rc_rate: '70' });
    });

    it('should parse multiple settings', () => {
      const input = `
        set roll_rc_rate = 70
        set pitch_rc_rate = 75
        set yaw_rc_rate = 80
      `;
      const result = parseCLI(input);
      expect(result).toEqual({
        roll_rc_rate: '70',
        pitch_rc_rate: '75',
        yaw_rc_rate: '80'
      });
    });

    it('should handle settings without "set" prefix', () => {
      const input = 'roll_rc_rate = 70';
      const result = parseCLI(input);
      expect(result).toEqual({ roll_rc_rate: '70' });
    });

    it('should handle varied spacing', () => {
      const input = 'set roll_rc_rate=70';
      const result = parseCLI(input);
      expect(result).toEqual({ roll_rc_rate: '70' });
    });

    it('should ignore comments and empty lines', () => {
      const input = `
        # This is a comment
        set roll_rc_rate = 70

        set pitch_rc_rate = 75
      `;
      const result = parseCLI(input);
      expect(result).toEqual({
        roll_rc_rate: '70',
        pitch_rc_rate: '75'
      });
    });

    it('should use last value for duplicate keys', () => {
      const input = `
        set roll_rc_rate = 70
        set roll_rc_rate = 80
      `;
      const result = parseCLI(input);
      expect(result).toEqual({ roll_rc_rate: '80' });
    });

    it('should parse all rate-related parameters', () => {
      const input = `
        set rates_type = ACTUAL
        set roll_rc_rate = 70
        set pitch_rc_rate = 75
        set yaw_rc_rate = 80
        set roll_rate = 670
        set pitch_rate = 680
        set yaw_rate = 690
        set roll_expo = 10
        set pitch_expo = 15
        set yaw_expo = 20
        set thr_mid = 50
        set thr_expo = 25
      `;
      const result = parseCLI(input);
      expect(result.roll_rc_rate).toBe('70');
      expect(result.pitch_rc_rate).toBe('75');
      expect(result.yaw_rc_rate).toBe('80');
      expect(result.roll_rate).toBe('670');
      expect(result.pitch_rate).toBe('680');
      expect(result.yaw_rate).toBe('690');
      expect(result.roll_expo).toBe('10');
      expect(result.pitch_expo).toBe('15');
      expect(result.yaw_expo).toBe('20');
      expect(result.thr_mid).toBe('50');
      expect(result.thr_expo).toBe('25');
    });
  });

  describe('generateCLI', () => {
    it('should generate CLI commands from profile', () => {
      const profile = {
        name: 'Test Profile',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 10 },
          pitch: { center: 75, maxRate: 680, expo: 15 },
          yaw: { center: 80, maxRate: 690, expo: 20 }
        },
        throttle: {
          mid: 50,
          expo: 25
        }
      };

      const result = generateCLI(profile);

      expect(result).toContain('set rates_type = ACTUAL');
      expect(result).toContain('set roll_rc_rate = 70');
      expect(result).toContain('set pitch_rc_rate = 75');
      expect(result).toContain('set yaw_rc_rate = 80');
      expect(result).toContain('set roll_rate = 670');
      expect(result).toContain('set pitch_rate = 680');
      expect(result).toContain('set yaw_rate = 690');
      expect(result).toContain('set roll_expo = 10');
      expect(result).toContain('set pitch_expo = 15');
      expect(result).toContain('set yaw_expo = 20');
      expect(result).toContain('set thr_mid = 50');
      expect(result).toContain('set thr_expo = 25');
      expect(result).toContain('save');
    });

    it('should include profile name as comment', () => {
      const profile = {
        name: 'My Custom Rates',
        rates: {
          roll: { center: 70, maxRate: 670, expo: 0 },
          pitch: { center: 70, maxRate: 670, expo: 0 },
          yaw: { center: 70, maxRate: 670, expo: 0 }
        },
        throttle: { mid: 50, expo: 0 }
      };

      const result = generateCLI(profile);
      expect(result).toContain('# Profile: My Custom Rates');
    });
  });
});
