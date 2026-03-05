import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 500));
        expect(result.current).toBe('hello');
    });

    it('does not update the value before the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'updated', delay: 500 });

        // Advance time just short of the delay
        act(() => { vi.advanceTimersByTime(499); });
        expect(result.current).toBe('initial');
    });

    it('updates the value after the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'updated', delay: 500 });

        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe('updated');
    });

    it('resets the timer when the value changes before the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'first', delay: 300 } }
        );

        rerender({ value: 'second', delay: 300 });
        act(() => { vi.advanceTimersByTime(200); });

        rerender({ value: 'third', delay: 300 });
        act(() => { vi.advanceTimersByTime(200); });

        // 'second' timer was cancelled, we're still mid-delay for 'third'
        expect(result.current).toBe('first');

        act(() => { vi.advanceTimersByTime(100); });
        expect(result.current).toBe('third');
    });

    it('clears the timer on unmount (value does not update after unmount)', () => {
        const { result, rerender, unmount } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'updated', delay: 500 });
        unmount();

        act(() => { vi.advanceTimersByTime(1000); });
        // After unmount the value is whatever it was when the hook last ran
        expect(result.current).toBe('initial');
    });

    it('works with numeric values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 0, delay: 200 } }
        );

        rerender({ value: 42, delay: 200 });
        act(() => { vi.advanceTimersByTime(200); });
        expect(result.current).toBe(42);
    });
});
