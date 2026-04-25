import { describe, it, expect } from 'vitest';
import { calculateActualRate, calculateThrottle } from '../src/rate-calculator.js';

describe('Rate Calculator', () => {
  describe('calculateActualRate', () => {
    it('should return 0 at center stick', () => {
      const result = calculateActualRate(0, 70, 670, 0);
      expect(result).toBe(0);
    });

    it('should return positive rate for positive stick input', () => {
      const result = calculateActualRate(1, 70, 670, 0);
      expect(result).toBeGreaterThan(0);
    });

    it('should return negative rate for negative stick input', () => {
      const result = calculateActualRate(-1, 70, 670, 0);
      expect(result).toBeLessThan(0);
    });

    it('should be symmetric around center', () => {
      const positive = calculateActualRate(0.5, 70, 670, 0);
      const negative = calculateActualRate(-0.5, 70, 670, 0);
      expect(positive).toBeCloseTo(-negative, 5);
    });

    it('should respect max rate at full deflection', () => {
      const maxRate = 670;
      const result = Math.abs(calculateActualRate(1, 70, maxRate, 0));
      expect(result).toBeCloseTo(maxRate, 0);
    });

    it('should apply expo correctly', () => {
      // With expo, center should be less sensitive
      const noExpo = Math.abs(calculateActualRate(0.5, 50, 800, 0));
      const withExpo = Math.abs(calculateActualRate(0.5, 50, 800, 50));
      expect(withExpo).toBeLessThan(noExpo);
    });

    it('should increase center sensitivity with higher center value', () => {
      // Center sensitivity affects rate when expo is applied
      const lowCenter = Math.abs(calculateActualRate(0.2, 30, 1200, 30));
      const highCenter = Math.abs(calculateActualRate(0.2, 90, 1200, 30));
      expect(highCenter).toBeGreaterThan(lowCenter);
    });
  });

  describe('calculateThrottle', () => {
    it('should return 0 at zero throttle', () => {
      const result = calculateThrottle(0, 50, 0);
      expect(result).toBe(0);
    });

    it('should return 1 at full throttle', () => {
      const result = calculateThrottle(1, 50, 0);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should pass through mid point at 50% stick', () => {
      const mid = 0.6;
      const result = calculateThrottle(0.5, mid * 100, 0);
      expect(result).toBeCloseTo(mid, 5);
    });

    it('should apply expo to make lower throttle less sensitive', () => {
      const noExpo = calculateThrottle(0.3, 50, 0);
      const withExpo = calculateThrottle(0.3, 50, 50);
      expect(withExpo).toBeLessThan(noExpo);
    });

    it('should handle different mid points correctly', () => {
      const lowMid = calculateThrottle(0.5, 30, 0);
      const highMid = calculateThrottle(0.5, 70, 0);
      expect(lowMid).toBeCloseTo(0.3, 5);
      expect(highMid).toBeCloseTo(0.7, 5);
    });
  });
});
