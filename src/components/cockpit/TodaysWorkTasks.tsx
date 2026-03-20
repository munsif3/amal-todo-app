import { useState } from "react";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { toggleTaskFrog, toggleTaskTwoMinute, toggleTaskPriority } from "@/lib/firebase/tasks";
import UnifiedItemCard from "@/components/today/UnifiedItemCard";

// --- Types ---
export interface TodaysWorkTasksPresenterProps {
    workTasksToday: any[];
    workAccountColor?: string;
    epicMap: Record<string, string>;
    onToggle: (item: any) => Promise<void>;
    onToggleFrog: (item: any) => Promise<void>;
    onToggleTwoMinute: (item: any) => Promise<void>;
    onTogglePriority: (item: any) => Promise<void>;
    onDelete: (item: any) => Promise<void>;
}

// --- DUMB PRESENTER ---
export function TodaysWorkTasksPresenter({
    workTasksToday,
    workAccountColor,
    epicMap,
    onToggle,
    onToggleFrog,
    onToggleTwoMinute,
    onTogglePriority,
    onDelete
}: TodaysWorkTasksPresenterProps) {
    return (
        <div style={{ width: '100%', marginTop: '3rem' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                TODAY'S WORK TASKS
            </h2>
            
            {workTasksToday.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No work tasks scheduled for today.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {workTasksToday.map((task: any) => {
                        const item = {
                            id: task.id!,
                            type: 'task' as const,
                            title: task.title,
                            subtitle: task.description,
                            time: task.deadline?.toDate(),
                            isCompleted: false,
                            accountId: task.accountId || undefined,
                            areaColor: workAccountColor,
                            epicName: task.epicId ? epicMap[task.epicId] : undefined,
                            isFrog: task.isFrog,
                            isTwoMinute: task.isTwoMinute,
                            isPriority: task.isPriority,
                            originalItem: task,
                            subtasksCount: task.subtasks && task.subtasks.length > 0 ? {
                                completed: task.subtasks.filter((s: any) => s.isCompleted).length,
                                total: task.subtasks.length
                            } : undefined
                        };

                        return (
                            <UnifiedItemCard
                                key={task.id}
                                item={item}
                                onToggle={onToggle}
                                onToggleFrog={onToggleFrog}
                                onToggleTwoMinute={onToggleTwoMinute}
                                onTogglePriority={onTogglePriority}
                                onDelete={onDelete}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// --- SMART CONTAINER ---
interface TodaysWorkTasksProps {
    user: any;
    epics?: { id: string, name: string }[];
}

export default function TodaysWorkTasks({ user, epics = [] }: TodaysWorkTasksProps) {
    const { activeTasks, loading: tasksLoading, changeTaskStatus } = useTasks(user, "");
    const { accounts, loading: accountsLoading } = useAccounts(user);
    
    const workAccount = accounts.find(a => a.name.toLowerCase() === 'work');
    const workAccountId = workAccount?.id;

    if (tasksLoading || accountsLoading) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

    const workTasksToday = activeTasks.filter(task => {
        if (!workAccountId || task.accountId !== workAccountId) return false;
        if (!task.deadline) return false;
        const deadlineDate = task.deadline.toDate();
        return deadlineDate >= startOfToday && deadlineDate <= endOfToday;
    });

    const handleToggleFrog = async (item: any) => await toggleTaskFrog(item.id, !item.isFrog);
    const handleToggleTwoMinute = async (item: any) => await toggleTaskTwoMinute(item.id, !item.isTwoMinute);
    const handleTogglePriority = async (item: any) => await toggleTaskPriority(item.id, !item.isPriority);
    const handleToggle = async (item: any) => await changeTaskStatus(item.id, 'done');
    const handleDelete = async (item: any) => {}; 

    // Build Epic Name dictionary
    const epicMap = epics.reduce((acc, epic) => {
        acc[epic.id] = epic.name;
        return acc;
    }, {} as Record<string, string>);

    return (
        <TodaysWorkTasksPresenter 
            workTasksToday={workTasksToday}
            workAccountColor={workAccount?.color}
            epicMap={epicMap}
            onToggle={handleToggle}
            onToggleFrog={handleToggleFrog}
            onToggleTwoMinute={handleToggleTwoMinute}
            onTogglePriority={handleTogglePriority}
            onDelete={handleDelete}
        />
    );
}
