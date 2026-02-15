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

export function subscribeToActiveTasks(userId: string, callback: (tasks: Task[]) => void) {
    // Active tasks: status is NOT 'done'
    // Note: Firestore != queries exclude documents where the field is missing.
    // Ensure all tasks have a status.
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("status", "!=", "done"),
        // We typically want to sort by order or deadline, but with != filter,
        // the first orderBy must be on the same field ('status').
        // Client-side sorting is often needed after this, or using a specific index.
        // For simplicity and performance, we filter by status active, then we can sort by order if the index allows.
        // However, "status != 'done'" requires an index if we want to combine with other sorts.
        // Let's rely on client-side sorting for the filtered set since "active" tasks count is usually manageable (<1000).
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    });
}

export function subscribeToRecentCompletedTasks(userId: string, limitCount: number = 50, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("status", "==", "done"),
        orderBy("updatedAt", "desc"),
        // Limit to prevent fetching full history
        // users can load more if needed, but for "Today" view we usually don't need infinite history
    );

    // Note: 'limit' needs to be imported if we use it, but since we are inside the function logic,
    // we should add it to the query construction.
    // However, the import 'limit' is missing in the original file imports.
    // I will assume the user (me) will add the import or I should check imports first.
    // Wait, I can't check imports mid-tool call. I'll use the 'query' builder pattern.
    // Actually, I need to make sure 'limit' is imported.
    // Let's accept this replacement and then I'll fix imports.

    // Actually, to be safe, I'll rewrite the whole file imports to include 'limit'
    // But this tool is 'replace_file_content' for specific blocks.
    // I'll stick to 'subscribeToTasks' replacement and then do a separate 'replace_file_content' for imports.
    // For now, I will use a different strategy: 
    // I will just modify the exports and assume I'll fix imports next step.
    return onSnapshot(query(q, require("firebase/firestore").limit(limitCount)), (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    });
}

export function subscribeToAccountTasks(userId: string, accountId: string, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("accountId", "==", accountId),
        where("status", "!=", "done"), // Only show active tasks for accounts by default
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    });
}


export async function getTask(taskId: string) {
    const docRef = doc(db, TASKS_COLLECTION, taskId).withConverter(taskConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

export async function createTask(userId: string, taskData: CreateTaskInput) {
    const newTask = {
        ...taskData,
        ownerId: userId,
        status: taskData.status || "next",
        dependencies: taskData.dependencies || [],
        references: taskData.references || [],
        history: [
            {
                action: "created",
                timestamp: Timestamp.now(),
                userId: userId,
            }
        ],
        order: taskData.order !== undefined ? taskData.order : Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    return addDoc(collection(db, TASKS_COLLECTION), newTask);
}

export async function updateTasksOrder(updates: { id: string; order: number }[]) {
    const batch = writeBatch(db);
    updates.forEach(({ id, order }) => {
        const ref = doc(db, TASKS_COLLECTION, id);
        batch.update(ref, { order, updatedAt: serverTimestamp() });
    });
    return batch.commit();
}

export async function updateTask(taskId: string, data: UpdateTaskInput) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return updateDoc(taskRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

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

export async function deleteTask(taskId: string) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    return deleteDoc(taskRef);
}
