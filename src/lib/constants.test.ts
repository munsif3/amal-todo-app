import { describe, it, expect } from 'vitest';
import { PRESET_COLORS, DEFAULT_ACCOUNT_COLOR } from '@/lib/constants';

describe('constants', () => {
    describe('PRESET_COLORS', () => {
        it('is a non-empty array', () => {
            expect(Array.isArray(PRESET_COLORS)).toBe(true);
            expect(PRESET_COLORS.length).toBeGreaterThan(0);
        });

        it('every entry has a name (string) and value (hex color string)', () => {
            for (const color of PRESET_COLORS) {
                expect(typeof color.name).toBe('string');
                expect(color.name.length).toBeGreaterThan(0);
                expect(typeof color.value).toBe('string');
                expect(color.value).toMatch(/^#[0-9a-fA-F]{6}$/);
            }
        });

        it('has no duplicate hex values', () => {
            const values = PRESET_COLORS.map(c => c.value);
            const unique = new Set(values);
            expect(unique.size).toBe(values.length);
        });

        it('has no duplicate names', () => {
            const names = PRESET_COLORS.map(c => c.name);
            const unique = new Set(names);
            expect(unique.size).toBe(names.length);
        });
    });

    describe('DEFAULT_ACCOUNT_COLOR', () => {
        it('is a valid hex color string', () => {
            expect(DEFAULT_ACCOUNT_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('is included in PRESET_COLORS', () => {
            const presetValues = PRESET_COLORS.map(c => c.value);
            expect(presetValues).toContain(DEFAULT_ACCOUNT_COLOR);
        });
    });
});
