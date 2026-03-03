import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    Timestamp,
    serverTimestamp,
    arrayUnion,
    writeBatch,
    limit
} from "firebase/firestore";
import { db } from "./client";
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "@/types";
import { genericConverter } from "./converters";

const TASKS_COLLECTION = "tasks";
const taskConverter = genericConverter<Task>();

/**
 * Subscribes to all non-done tasks for a user.
 * Client-side sorting is expected since Firestore `!=` queries limit compound ordering.
 */
export function subscribeToActiveTasks(userId: string, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("status", "!=", "done"),
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    }, (error) => {
        console.error("Error subscribing to active tasks:", error);
    });
}

/**
 * Subscribes to recently completed tasks for a user, ordered by most recently updated.
 * Results are capped by `limitCount` to avoid fetching full completion history.
 */
export function subscribeToRecentCompletedTasks(userId: string, limitCount: number = 50, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("status", "==", "done"),
        orderBy("updatedAt", "desc"),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    }, (error) => {
        console.error("Error subscribing to completed tasks:", error);
    });
}

/** Subscribes to active tasks for a specific account. */
export function subscribeToAccountTasks(userId: string, accountId: string, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("accountId", "==", accountId),
        where("status", "!=", "done"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    }, (error) => {
        console.error("Error subscribing to account tasks:", error);
    });
}

/** Fetches a single task by ID, returns null if not found. */
export async function getTask(taskId: string) {
    const docRef = doc(db, TASKS_COLLECTION, taskId).withConverter(taskConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

/** Creates a new task with default fields and an initial history entry. */
export async function createTask(userId: string, taskData: CreateTaskInput) {
    const newTask = {
        ...taskData,
        ownerId: userId,
        status: taskData.status || "next",
        dependencies: taskData.dependencies || [],
        references: taskData.references || [],
        subtasks: taskData.subtasks || [],
        history: [
            {
                action: "created",
                timestamp: Timestamp.now(),
                userId: userId,
            }
        ],
        isFrog: taskData.isFrog || false,
        isTwoMinute: taskData.isTwoMinute || false,
        order: taskData.order !== undefined ? taskData.order : Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    return addDoc(collection(db, TASKS_COLLECTION), newTask);
}

/** Batch-updates the display order of multiple tasks in a single Firestore write. */
export async function updateTasksOrder(updates: { id: string; order: number }[]) {
    const batch = writeBatch(db);
    updates.forEach(({ id, order }) => {
        const ref = doc(db, TASKS_COLLECTION, id);
        batch.update(ref, { order, updatedAt: serverTimestamp() });
    });
    return batch.commit();
}

/** Updates a task's fields and refreshes `updatedAt`. */
export async function updateTask(taskId: string, data: UpdateTaskInput) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return updateDoc(taskRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/** Updates task status and appends a history entry with the status change. */
export async function updateTaskStatus(taskId: string, status: TaskStatus, userId: string) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return updateDoc(taskRef, {
        status: status,
        updatedAt: serverTimestamp(),
        history: arrayUnion({
            action: `status_changed_to_${status}`,
            timestamp: Timestamp.now(),
            userId: userId,
        })
    });
}

/** Toggles the 'Eat the Frog' flag on a task. */
export async function toggleTaskFrog(taskId: string, isFrog: boolean) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return updateDoc(taskRef, {
        isFrog,
        updatedAt: serverTimestamp(),
    });
}

/** Toggles the 2-minute rule flag on a task. */
export async function toggleTaskTwoMinute(taskId: string, isTwoMinute: boolean) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return updateDoc(taskRef, {
        isTwoMinute,
        updatedAt: serverTimestamp(),
    });
}

/** Permanently deletes a task. */
export async function deleteTask(taskId: string) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return deleteDoc(taskRef);
}

/**
 * Batch-updates the status of multiple tasks.
 * Note: Firestore batches support up to 500 operations.
 */
export async function bulkUpdateTaskStatus(taskIds: string[], status: TaskStatus, userId: string) {
    if (!taskIds.length) return;

    const batch = writeBatch(db);

    taskIds.forEach(id => {
        const taskRef = doc(db, TASKS_COLLECTION, id);
        batch.update(taskRef, {
            status,
            updatedAt: serverTimestamp(),
            history: arrayUnion({
                action: `bulk_status_changed_to_${status}`,
                timestamp: Timestamp.now(),
                userId: userId,
            })
        });
    });

    return batch.commit();
}

/** Batch-updates the deadline of multiple tasks. */
export async function bulkUpdateTaskDeadline(taskIds: string[], newDeadline: Timestamp | null) {
    if (!taskIds.length) return;

    const batch = writeBatch(db);

    taskIds.forEach(id => {
        const taskRef = doc(db, TASKS_COLLECTION, id);
        batch.update(taskRef, {
            deadline: newDeadline,
            updatedAt: serverTimestamp(),
        });
    });

    return batch.commit();
}
