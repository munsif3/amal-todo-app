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
    order?: number;
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
    accountId?: string | null;
    title: string;
    startTime: Timestamp;
    notes: {
        before: string;
        during: string;
        after: string;
    };
    prepTaskIds: string[];
    checklist: {
        id: string;
        text: string;
        completed: boolean;
    }[];
    isCompleted: boolean;
    updatedAt: Timestamp;
}

export interface Routine {
    id: string;
    ownerId: string;
    accountId?: string | null;
    title: string;
    schedule: "daily" | "weekly" | "custom" | "monthly";
    time?: string; // HH:mm format (optional)
    type: 'fixed' | 'flexible';
    isShared: boolean;
    days?: number[]; // 0 = Sunday, 1 = Monday, etc.
    monthDay?: number; // 1-31 for monthly routines
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

export type CreateMeetingInput = Partial<Omit<Meeting, "id" | "ownerId" | "updatedAt">>;
export type UpdateMeetingInput = Partial<Omit<Meeting, "id" | "ownerId" | "updatedAt">>;

export type CreateRoutineInput = Partial<Omit<Routine, "id" | "ownerId" | "completionLog">>;
export type UpdateRoutineInput = Partial<Omit<Routine, "id" | "ownerId">>;

export interface Note {
    id: string;
    ownerId: string;
    accountId: string;
    title: string;
    content: string; // Markdown
    type: 'text' | 'checklist';
    isPinned: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type CreateNoteInput = Partial<Omit<Note, "id" | "ownerId" | "createdAt" | "updatedAt">>;
export type UpdateNoteInput = Partial<Omit<Note, "id" | "ownerId" | "createdAt">>;
