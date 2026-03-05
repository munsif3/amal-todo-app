import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
    createAccount,
    updateAccount,
    deleteAccount,
    getAccount,
} from '../accounts';

vi.mock('firebase/firestore', async () => {
    const fakeRef = { withConverter: vi.fn().mockReturnThis() };
    return {
        getFirestore: vi.fn(),
        collection: vi.fn(() => fakeRef),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        doc: vi.fn(() => fakeRef),
        getDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        onSnapshot: vi.fn(),
        serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    };
});

vi.mock('../client', () => ({ db: {} }));
vi.mock('../converters', () => ({
    genericConverter: vi.fn(() => ({})),
}));

describe('accounts firebase module', () => {
    const userId = 'user-1';
    const accountId = 'account-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── createAccount ────────────────────────────────────────
    describe('createAccount', () => {
        it('adds a doc with ownerId, status="active", and default color', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-acc' });

            await createAccount(userId, { name: 'Work', description: 'Work account' });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    name: 'Work',
                    description: 'Work account',
                    ownerId: userId,
                    status: 'active',
                    color: '#2d3436', // DEFAULT_ACCOUNT_COLOR
                    createdAt: 'SERVER_TIMESTAMP',
                })
            );
        });

        it('respects a custom color when provided', async () => {
            (firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-acc' });

            await createAccount(userId, { name: 'Personal', description: '', color: '#e17055' });

            expect(firestore.addDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ color: '#e17055' })
            );
        });
    });

    // ─── updateAccount ────────────────────────────────────────
    describe('updateAccount', () => {
        it('calls updateDoc with provided data and updatedAt', async () => {
            (firestore.updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await updateAccount(accountId, { name: 'Renamed' });

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ name: 'Renamed', updatedAt: 'SERVER_TIMESTAMP' })
            );
        });
    });

    // ─── deleteAccount ────────────────────────────────────────
    describe('deleteAccount', () => {
        it('calls deleteDoc for the given account', async () => {
            (firestore.deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            await deleteAccount(accountId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.anything());
        });
    });

    // ─── getAccount ───────────────────────────────────────────
    describe('getAccount', () => {
        it('returns account data when document exists', async () => {
            const fakeData = { id: accountId, name: 'Work', ownerId: userId };
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => fakeData,
            });

            const result = await getAccount(accountId);

            expect(result).toEqual(fakeData);
        });

        it('returns null when document does not exist', async () => {
            (firestore.getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            });

            const result = await getAccount(accountId);

            expect(result).toBeNull();
        });
    });
});
