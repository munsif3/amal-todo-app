import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccounts } from '../use-accounts';
import * as accountsModule from '@/lib/firebase/accounts';

vi.mock('@/lib/firebase/client', () => ({ db: {}, auth: {}, app: {} }));
vi.mock('@/lib/firebase/accounts');

describe('useAccounts', () => {
    const fakeUser = { uid: 'user-1' } as any;
    let unsubscribeMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        unsubscribeMock = vi.fn();
        (accountsModule.subscribeToAccounts as ReturnType<typeof vi.fn>).mockReturnValue(unsubscribeMock);
    });

    it('returns empty accounts and loading=false when user is null', () => {
        const { result } = renderHook(() => useAccounts(null));
        expect(result.current.accounts).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(accountsModule.subscribeToAccounts).not.toHaveBeenCalled();
    });

    it('returns empty accounts and loading=false when user is undefined', () => {
        const { result } = renderHook(() => useAccounts(undefined));
        expect(result.current.accounts).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('calls subscribeToAccounts with userId when user is provided', () => {
        renderHook(() => useAccounts(fakeUser));
        expect(accountsModule.subscribeToAccounts).toHaveBeenCalledWith(
            fakeUser.uid,
            expect.any(Function)
        );
    });

    it('updates accounts when the subscription callback fires', async () => {
        const fakeAccounts = [
            { id: 'a1', name: 'Work', ownerId: fakeUser.uid },
            { id: 'a2', name: 'Personal', ownerId: fakeUser.uid },
        ];

        (accountsModule.subscribeToAccounts as ReturnType<typeof vi.fn>).mockImplementation(
            (_uid: string, callback: (accounts: any[]) => void) => {
                callback(fakeAccounts);
                return unsubscribeMock;
            }
        );

        const { result } = renderHook(() => useAccounts(fakeUser));

        await waitFor(() => {
            expect(result.current.accounts).toEqual(fakeAccounts);
            expect(result.current.loading).toBe(false);
        });
    });

    it('calls the unsubscribe function on unmount', () => {
        const { unmount } = renderHook(() => useAccounts(fakeUser));
        unmount();
        expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
});
