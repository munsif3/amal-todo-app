import { useState, useEffect } from 'react';
import { subscribeToTasks, updateTaskStatus, updateTasksOrder } from "@/lib/firebase/tasks";
import { Task } from "@/types";
import { User } from 'firebase/auth';

export function useTasks(user: User | null | undefined, searchQuery: string = "") {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToTasks(user.uid, (fetchedTasks) => {
                // Client-side sort by order then createdAt
                const sorted = [...fetchedTasks].sort((a, b) => {
                    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                    if (orderA !== orderB) return orderA - orderB;
                    // Fallback to createdAt desc (newer first) if no order
                    return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
                });

                if (!isReordering) {
                    setTasks(sorted);
                }
                if (loading) setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setTasks([]);
            setLoading(false);
        }
    }, [user, isReordering]);

    const filterItem = (text: string) => text.toLowerCase().includes(searchQuery.toLowerCase());

    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'waiting' && (filterItem(t.title) || (t.description && filterItem(t.description))));
    const snoozedTasks = tasks.filter(t => t.status === 'waiting' && (filterItem(t.title) || (t.description && filterItem(t.description))));
    const finishedTasks = tasks.filter(t => t.status === 'done' && (filterItem(t.title) || (t.description && filterItem(t.description))));

    const reorderTasks = async (newOrder: Task[]) => {
        setIsReordering(true);

        // Optimistically update
        const orderMap = new Map(newOrder.map((t, i) => [t.id, i]));

        const updatedTasks = tasks.map(t => {
            if (orderMap.has(t.id)) {
                return { ...t, order: orderMap.get(t.id) };
            }
            return t;
        }).sort((a, b) => {
            const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) return orderA - orderB;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });

        setTasks(updatedTasks);

        const reorderedUpdates = newOrder.map((t, i) => ({ id: t.id, order: i }));

        try {
            await updateTasksOrder(reorderedUpdates);
        } catch (error) {
            console.error("Failed to update task order", error);
        } finally {
            setTimeout(() => setIsReordering(false), 1000);
        }
    };

    const changeTaskStatus = async (taskId: string, status: Task['status']) => {
        if (user) {
            await updateTaskStatus(taskId, status, user.uid);
        }
    };

    const taskStatusMap = new Map(tasks.map(t => [t.id, t.status]));

    return {
        tasks,
        activeTasks,
        snoozedTasks,
        finishedTasks,
        loading,
        reorderTasks,
        changeTaskStatus,
        taskStatusMap,
        setIsReordering // Exported if needed, but reorderTasks handles it internally mostly
    };
}
