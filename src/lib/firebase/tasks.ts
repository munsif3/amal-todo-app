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
    writeBatch
} from "firebase/firestore";
import { db } from "./client";
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "@/types";
import { genericConverter } from "./converters";

const TASKS_COLLECTION = "tasks";
const taskConverter = genericConverter<Task>();

export function subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => doc.data());
        callback(tasks);
    });
}

export function subscribeToAccountTasks(userId: string, accountId: string, callback: (tasks: Task[]) => void) {
    const q = query(
        collection(db, TASKS_COLLECTION).withConverter(taskConverter),
        where("ownerId", "==", userId),
        where("accountId", "==", accountId),
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
