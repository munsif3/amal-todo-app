import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import { createTask, updateTaskStatus } from '../tasks';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
    return {
        getFirestore: vi.fn(),
        collection: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        doc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        onSnapshot: vi.fn(),
        Timestamp: {
            now: () => ({ toMillis: () => 1234567890, seconds: 1234567890, nanoseconds: 0 }),
        },
        serverTimestamp: vi.fn(),
        arrayUnion: vi.fn(),
        writeBatch: vi.fn(),
    };
});

// Mock the client to avoid initializing real app
vi.mock('../client', () => ({
    db: {},
}));

describe('tasks logic', () => {
    const userId = 'test-user-id';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTask', () => {
        it('should call addDoc with correct data', async () => {
            const taskInput = {
                title: 'New Task',
                description: 'Description',
                accountId: 'acc-1',
                projectId: 'proj-1',
                priority: 'p1' as const,
                estimatedDuration: 30,
            };

            const mockAddDoc = firestore.addDoc as any;
            mockAddDoc.mockResolvedValue({ id: 'new-task-id' });

            await createTask(userId, taskInput);

            expect(firestore.collection).toHaveBeenCalled();
            expect(mockAddDoc).toHaveBeenCalledWith(
                undefined, // collection ref (mocked return of collection())
                expect.objectContaining({
                    ...taskInput,
                    ownerId: userId,
                    status: 'next',
                    history: expect.arrayContaining([
                        expect.objectContaining({
                            action: 'created',
                            userId: userId,
                        })
                    ]),
                })
            );
        });
    });

    describe('updateTaskStatus', () => {
        it('should call updateDoc with new status and history', async () => {
            const taskId = 'task-1';
            const newStatus = 'done';

            await updateTaskStatus(taskId, newStatus, userId);

            expect(firestore.doc).toHaveBeenCalled();
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                undefined, // doc ref
                expect.objectContaining({
                    status: newStatus,
                    history: undefined, // arrayUnion returns undefined in mock unless configured
                })
            );

            // Verify arrayUnion was called
            expect(firestore.arrayUnion).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: `status_changed_to_${newStatus}`,
                    userId: userId,
                })
            );
        });
    });
});
