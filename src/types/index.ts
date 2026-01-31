import { Timestamp } from 'firebase/firestore';

export type TaskStatus = 'next' | 'waiting' | 'blocked' | 'scheduled' | 'fyi' | 'done';

export interface Reference {
    type: 'email' | 'link' | 'meeting';
    label: string;
    url?: string;
}

export interface Task {
    id: string;
    ownerId: string;
    accountId?: string | null;
    meetingId?: string | null;
    title: string;
    description: string;
    status: TaskStatus;
    deadline?: Timestamp | null;
    dependencies: string[]; // Task IDs
    references: Reference[];
    history: {
        action: string;
        timestamp: Timestamp;
        userId: string;
    }[];
    routineId?: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Account {
    id: string;
    ownerId: string;
    name: string;
    description: string;
    color?: string;
    status: 'active' | 'archived';
    createdAt: Timestamp;
}

export interface Meeting {
    id: string;
    ownerId: string;
    accountId?: string;
    title: string;
    startTime: Timestamp;
    notes: {
        before: string;
        during: string;
        after: string;
    };
    prepTaskIds: string[];
}

export interface Routine {
    id: string;
    ownerId: string;
    title: string;
    schedule: string; // E.g., 'daily', 'weekly', 'mondays'
    type: 'fixed' | 'flexible';
    isShared: boolean;
    completionLog: {
        [date: string]: {
            [userId: string]: boolean;
        };
    };
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    preferences: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
}

// Input Types for Services
export type CreateTaskInput = Partial<Omit<Task, "id" | "ownerId" | "createdAt" | "updatedAt" | "history">>;
export type UpdateTaskInput = Partial<Omit<Task, "id" | "ownerId" | "createdAt" | "updatedAt" | "history">>;

export type CreateAccountInput = Partial<Omit<Account, "id" | "ownerId" | "createdAt" | "status">>;
export type UpdateAccountInput = Partial<Omit<Account, "id" | "ownerId" | "createdAt">>;
