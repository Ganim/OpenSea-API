import { describe, expect, it } from 'vitest';

import { calculateKrProgress, inferKrDirection } from './key-result';

describe('inferKrDirection', () => {
  it('infers increase when target is above start', () => {
    expect(inferKrDirection(0, 100)).toBe('increase');
  });

  it('infers decrease when target is below start', () => {
    expect(inferKrDirection(100, 20)).toBe('decrease');
  });

  it('infers increase when start equals target (defensive default)', () => {
    expect(inferKrDirection(50, 50)).toBe('increase');
  });
});

describe('calculateKrProgress', () => {
  describe('NaN safety (zero range)', () => {
    it('never returns NaN when startValue === targetValue === currentValue', () => {
      const progress = calculateKrProgress({
        startValue: 50,
        targetValue: 50,
        currentValue: 50,
      });

      expect(progress).not.toBeNaN();
      expect(Number.isFinite(progress)).toBe(true);
    });

    it('returns 100 when current meets the (increase) target with zero range', () => {
      const progress = calculateKrProgress({
        startValue: 10,
        targetValue: 10,
        currentValue: 10,
        direction: 'increase',
      });

      expect(progress).toBe(100);
    });

    it('returns 100 when current meets the (decrease) target with zero range', () => {
      const progress = calculateKrProgress({
        startValue: 10,
        targetValue: 10,
        currentValue: 10,
        direction: 'decrease',
      });

      expect(progress).toBe(100);
    });

    it('returns 0 when current is below target for increase zero-range', () => {
      const progress = calculateKrProgress({
        startValue: 10,
        targetValue: 10,
        currentValue: 5,
        direction: 'increase',
      });

      expect(progress).toBe(0);
    });

    it('returns 0 when current is above target for decrease zero-range', () => {
      const progress = calculateKrProgress({
        startValue: 10,
        targetValue: 10,
        currentValue: 25,
        direction: 'decrease',
      });

      expect(progress).toBe(0);
    });
  });

  describe('increase direction (happy path)', () => {
    it('reports 0% when current equals start', () => {
      expect(
        calculateKrProgress({
          startValue: 0,
          targetValue: 100,
          currentValue: 0,
        }),
      ).toBe(0);
    });

    it('reports 50% at the midpoint', () => {
      expect(
        calculateKrProgress({
          startValue: 0,
          targetValue: 100,
          currentValue: 50,
        }),
      ).toBe(50);
    });

    it('reports 100% when target is met', () => {
      expect(
        calculateKrProgress({
          startValue: 0,
          targetValue: 100,
          currentValue: 100,
        }),
      ).toBe(100);
    });

    it('clamps overachievement at 100%', () => {
      expect(
        calculateKrProgress({
          startValue: 0,
          targetValue: 100,
          currentValue: 150,
        }),
      ).toBe(100);
    });

    it('clamps below-start values at 0%', () => {
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 100,
          currentValue: 5,
        }),
      ).toBe(0);
    });

    it('rounds to 2 decimal places', () => {
      const progress = calculateKrProgress({
        startValue: 0,
        targetValue: 3,
        currentValue: 1,
      });

      // 1/3 * 100 = 33.333... → 33.33
      expect(progress).toBe(33.33);
    });
  });

  describe('decrease direction (reduce churn, bug fix)', () => {
    it('reports 0% when nothing has moved', () => {
      // "Reduce churn from 10% to 2%", current still at 10%
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 2,
          currentValue: 10,
        }),
      ).toBe(0);
    });

    it('reports 50% at the midpoint on the way down', () => {
      // start=10, target=2, current=6 → (10-6)/(10-2) = 4/8 = 50%
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 2,
          currentValue: 6,
        }),
      ).toBe(50);
    });

    it('reports 100% when target is reached', () => {
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 2,
          currentValue: 2,
        }),
      ).toBe(100);
    });

    it('clamps overachievement (current below target) at 100%', () => {
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 2,
          currentValue: 0,
        }),
      ).toBe(100);
    });

    it('clamps regression (current above start) at 0%', () => {
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 2,
          currentValue: 15,
        }),
      ).toBe(0);
    });

    it('respects explicit direction override even if values imply increase', () => {
      // With an explicit 'decrease' direction: (start - current) / (start - target)
      // = (0 - 50) / (0 - 100) = 0.5 → 50%. Same as increase math for this
      // symmetric case — the formula matches when start/target are swapped.
      expect(
        calculateKrProgress({
          startValue: 0,
          targetValue: 100,
          currentValue: 50,
          direction: 'decrease',
        }),
      ).toBe(50);
    });

    it('handles regression when direction is explicitly decrease', () => {
      // Asymmetric example: start=100, target=0, current=120 (went UP, not down).
      // With 'decrease' explicitly: (100 - 120) / (100 - 0) = -0.2 → clamped 0.
      expect(
        calculateKrProgress({
          startValue: 100,
          targetValue: 0,
          currentValue: 120,
          direction: 'decrease',
        }),
      ).toBe(0);
    });
  });

  describe('direction inference', () => {
    it('uses decrease math automatically when target < start', () => {
      // Inferred as 'decrease' because target (2) < start (10)
      expect(
        calculateKrProgress({
          startValue: 10,
          targetValue: 2,
          currentValue: 6,
        }),
      ).toBe(50);
    });

    it('uses increase math automatically when target > start', () => {
      expect(
        calculateKrProgress({
          startValue: 0,
          targetValue: 100,
          currentValue: 50,
        }),
      ).toBe(50);
    });
  });
});
