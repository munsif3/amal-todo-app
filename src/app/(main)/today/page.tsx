"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { Meeting, Task, Subtask, Routine } from "@/types";
import { useState, useEffect } from "react";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";
import Loader from "@/components/ui/Loading";
import { Search, Eye, EyeOff, Target, Zap, ZapOff, ArrowRight } from "lucide-react";
import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useRoutines } from "@/lib/hooks/use-routines";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { subscribeToMeetings, toggleMeetingCompletion } from "@/lib/firebase/meetings";
import { createTask, toggleTaskFrog, toggleTaskTwoMinute, toggleTaskPriority, bulkUpdateTaskDeadline, deleteTask } from "@/lib/firebase/tasks";
import { Timestamp } from "firebase/firestore";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import confetti from "canvas-confetti";
import SomedaySweeper from "@/components/gamification/SomedaySweeper";
import { playPopSound } from "@/lib/sounds";
import { awardGamificationPoints } from "@/lib/firebase/user_stats";

export default function TodayPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);

    // Quick Capture & Focus Mode state
    const [quickTaskTitle, setQuickTaskTitle] = useState("");
    const [isCreatingQuickTask, setIsCreatingQuickTask] = useState(false);
    const [isQuickTwoMinute, setIsQuickTwoMinute] = useState(false);
    const [isQuickPriority, setIsQuickPriority] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showOnlyTwoMinute, setShowOnlyTwoMinute] = useState(false);
    const [isSnoozingAll, setIsSnoozingAll] = useState(false);

    const {
        activeTasks,
        finishedTasks,
        loading: tasksLoading,
        changeTaskStatus,
    } = useTasks(user, searchQuery);

    const { todaysRoutines, loading: routinesLoading } = useRoutines(user, searchQuery);
    const { accounts, loading: accountsLoading } = useAccounts(user);
    const { isRoutineCompletedToday, toggleCompletion } = useRoutineCompletion(user);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            setMeetings(data);
            setLoadingMeetings(false);
        });
        return () => unsubscribe();
    }, [user]);

    const isLoading = tasksLoading || routinesLoading || accountsLoading || loadingMeetings;

    if (isLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    // --- Helpers for Dates ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const isFuture = (date: Date | undefined) => {
        if (!date) return false;
        return date > endOfToday;
    };

    const isCompletedToday = (date: Date | undefined) => {
        if (!date) return false;
        return date >= today && date <= endOfToday;
    };

    // --- Transform Content into Unified Items ---

    // 1. Meetings
    const todayMeetings: UnifiedItem[] = [];
    const futureMeetings: UnifiedItem[] = [];

    meetings.forEach(m => {
        const date = m.startTime?.toDate();
        let badge: UnifiedItem['badge'] = undefined;

        const now = new Date();
        if (date && date < now) {
            const d1 = new Date(today);
            const d2 = new Date(date);
            d2.setHours(0, 0, 0, 0);

            const diffTime = d1.getTime() - d2.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                badge = {
                    text: `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
                    variant: 'destructive'
                };
            } else {
                badge = {
                    text: `Overdue`,
                    variant: 'destructive'
                };
            }
        }

        const item: UnifiedItem = {
            id: m.id!,
            type: 'meeting',
            title: m.title,
            subtitle: m.notes?.before || "No notes",
            time: date,
            isCompleted: m.isCompleted || false,
            accountId: m.accountId || undefined,
            areaColor: accounts.find(a => a.id === m.accountId)?.color,
            originalItem: m,
            badge: badge
        };

        if (isFuture(date)) {
            futureMeetings.push(item);
        } else {
            if (date && date <= endOfToday) {
                todayMeetings.push(item);
            }
        }
    });

    // 2. Routines (Today only)
    const todayRoutinesItems: UnifiedItem[] = [];
    todaysRoutines.forEach(r => {
        const isCompleted = isRoutineCompletedToday(r);
        let itemTime = undefined;
        if (r.time) {
            const [hours, minutes] = r.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            itemTime = date;
        }

        if (!showCompleted && isCompleted) return;

        todayRoutinesItems.push({
            id: r.id!,
            type: 'routine',
            title: r.title,
            time: itemTime,
            isCompleted: isCompleted,
            accountId: r.accountId || undefined,
            areaColor: accounts.find(a => a.id === r.accountId)?.color,
            originalItem: r
        });
    });

    // 3. Active Tasks
    const todayTasksItems: UnifiedItem[] = [];
    const futureTasksItems: UnifiedItem[] = [];

    activeTasks.forEach(t => {
        const date = t.deadline?.toDate();
        let badge: UnifiedItem['badge'] = undefined;

        if (!date) {
            badge = { text: 'No Deadline', variant: 'neutral' };
        } else if (date < today) {
            const d1 = new Date(today);
            const d2 = new Date(date);
            d2.setHours(0, 0, 0, 0);

            const diffTime = d1.getTime() - d2.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                badge = {
                    text: `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
                    variant: 'destructive'
                };
            }
        }

        const item: UnifiedItem = {
            id: t.id!,
            type: 'task',
            title: t.title,
            subtitle: t.description,
            time: date,
            isCompleted: false,
            accountId: t.accountId || undefined,
            areaColor: accounts.find(a => a.id === t.accountId)?.color,
            epicName: t.epicName || undefined,
            isFrog: t.isFrog,
            isTwoMinute: t.isTwoMinute,
            isPriority: t.isPriority,
            originalItem: t,
            badge: badge,
            subtasksCount: t.subtasks && t.subtasks.length > 0 ? {
                completed: t.subtasks.filter((s: Subtask) => s.isCompleted).length,
                total: t.subtasks.length
            } : undefined
        };

        if (isFuture(date)) {
            futureTasksItems.push(item);
        } else {
            todayTasksItems.push(item);
        }
    });

    // 4. Completed Tasks (Today Only)
    const completedTodayItems: UnifiedItem[] = [];
    if (showCompleted) {
        finishedTasks.forEach(t => {
            const getCompletionDate = (task: Task) => {
                const doneEntries = task.history?.filter((h: { action: string }) => h.action === 'status_changed_to_done');
                if (doneEntries && doneEntries.length > 0) {
                    const latest = doneEntries.reduce((prev, current) => {
                        return (prev.timestamp?.toMillis() || 0) > (current.timestamp?.toMillis() || 0) ? prev : current;
                    });
                    return latest.timestamp?.toDate();
                }
                return task.updatedAt?.toDate();
            };

            const completionDate = getCompletionDate(t);
            if (isCompletedToday(completionDate)) {
                const item: UnifiedItem = {
                    id: t.id!,
                    type: 'task',
                    title: t.title,
                    subtitle: t.description,
                    time: t.deadline?.toDate(),
                    isCompleted: true,
                    accountId: t.accountId || undefined,
                    areaColor: accounts.find(a => a.id === t.accountId)?.color,
                    epicName: t.epicName || undefined,
                    originalItem: t,
                    badge: undefined,
                    subtasksCount: t.subtasks && t.subtasks.length > 0 ? {
                        completed: t.subtasks.filter((s: Subtask) => s.isCompleted).length,
                        total: t.subtasks.length
                    } : undefined
                };
                completedTodayItems.push(item);
            }
        });
    }

    // --- Sort Lists ---
    // Priority order: Frog > Priority > time > type
    const sortItems = (items: UnifiedItem[]) => {
        return items.sort((a, b) => {
            // Completion pushes to bottom
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

            // Frog pushes to very top
            if (a.isFrog && !a.isCompleted && (!b.isFrog || b.isCompleted)) return -1;
            if (b.isFrog && !b.isCompleted && (!a.isFrog || a.isCompleted)) return 1;

            // Priority comes next (above non-frog tasks)
            if (a.isPriority && !a.isCompleted && !b.isPriority) return -1;
            if (b.isPriority && !b.isCompleted && !a.isPriority) return 1;

            // Time comparison
            if (a.time && b.time) return a.time.getTime() - b.time.getTime();
            if (a.time) return -1;
            if (b.time) return 1;

            // Type priority: Routine -> Meeting -> Task
            const typePriority = { routine: 0, meeting: 1, task: 2 };
            if (typePriority[a.type] !== typePriority[b.type]) {
                return typePriority[a.type] - typePriority[b.type];
            }
            return 0;
        });
    };

    const unifiedToday = sortItems([...todayRoutinesItems, ...todayTasksItems, ...completedTodayItems])
        .filter(item => {
            if (showOnlyTwoMinute) {
                return item.isTwoMinute;
            }
            return true;
        });
    const unifiedFuture = sortItems([...futureMeetings, ...futureTasksItems])
        .filter(item => {
            if (showOnlyTwoMinute) {
                return item.isTwoMinute;
            }
            return true;
        });

    const handleToggleFrog = async (item: UnifiedItem) => {
        if (item.type === 'task') {
            await toggleTaskFrog(item.id, !item.isFrog);
        }
    };

    const handleToggleTwoMinute = async (item: UnifiedItem) => {
        if (item.type === 'task') {
            await toggleTaskTwoMinute(item.id, !item.isTwoMinute);
        }
    };

    const handleTogglePriority = async (item: UnifiedItem) => {
        if (item.type === 'task') {
            await toggleTaskPriority(item.id, !item.isPriority);
        }
    };

    const handleDelete = async (item: UnifiedItem) => {
        if (item.type === 'task') {
            await deleteTask(item.id);
        }
        // Routines and meetings have their own delete flow via the edit page
    };

    const handleToggle = (item: UnifiedItem) => {
        const isNowCompleting = !item.isCompleted;

        if (isNowCompleting) {
            playPopSound();

            if (user) {
                awardGamificationPoints(user.uid, {
                    isFrog: item.isFrog,
                    isTwoMinute: item.isTwoMinute,
                    isRoutine: item.type === 'routine'
                }).catch(console.error);
            }

            const remainingIncomplete = unifiedToday.filter(i => !i.isCompleted && i.id !== item.id);

            if (item.isFrog) {
                const now = new Date();
                if (now.getHours() < 12) {
                    setTimeout(() => {
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            colors: ['#8a9a5b', '#556b2f', '#FFD700'],
                            origin: { y: 0.6 }
                        });
                    }, 100);
                }
            }

            if (remainingIncomplete.length === 0) {
                setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }, 300);
            }
        }

        if (item.type === 'task') {
            changeTaskStatus(item.id, item.isCompleted ? 'next' : 'done');
        } else if (item.type === 'routine') {
            toggleCompletion(item.originalItem as Routine);
        } else if (item.type === 'meeting') {
            toggleMeetingCompletion(item.id, !item.isCompleted);
        }
    };

    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTaskTitle.trim() || !user) return;
        setIsCreatingQuickTask(true);
        try {
            await createTask(user.uid, {
                title: quickTaskTitle.trim(),
                deadline: Timestamp.fromDate(endOfToday),
                status: "next",
                isTwoMinute: isQuickTwoMinute,
                isPriority: isQuickPriority
            });
            setQuickTaskTitle("");
            setIsQuickTwoMinute(false);
            setIsQuickPriority(false);
        } catch (error) {
            console.error("Failed to create quick task", error);
        } finally {
            setIsCreatingQuickTask(false);
        }
    };

    const handleSnoozeAll = async () => {
        const incompleteTasks = unifiedToday.filter(i => !i.isCompleted && i.type === 'task');
        if (incompleteTasks.length === 0) return;

        if (!confirm(`Are you sure you want to snooze ${incompleteTasks.length} tasks to tomorrow?`)) return;

        setIsSnoozingAll(true);
        try {
            const taskIds = incompleteTasks.map(t => t.id);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);

            await bulkUpdateTaskDeadline(taskIds, Timestamp.fromDate(tomorrow));
        } catch (error) {
            console.error("Failed to snooze all tasks:", error);
        } finally {
            setIsSnoozingAll(false);
        }
    };

    if (isFocusMode) {
        const incompleteToday = unifiedToday.filter(i => !i.isCompleted);
        const currentFocusTask = incompleteToday.length > 0 ? incompleteToday[0] : null;

        return (
            <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
                <button
                    onClick={() => setIsFocusMode(false)}
                    style={{ position: 'absolute', top: '2rem', right: '1rem', padding: '0.5rem 1rem', borderRadius: '20px', backgroundColor: 'var(--muted)', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
                >
                    Exit Focus
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem', color: 'var(--primary)' }}>
                    <Target size={24} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Focus Mode</h2>
                </div>

                {currentFocusTask ? (
                    <div style={{ width: '100%', maxWidth: '500px', transform: 'scale(1.05)', transition: 'transform 0.3s' }}>
                        <UnifiedItemCard item={currentFocusTask} onToggle={handleToggle} />
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>You're all done!</p>
                        <button onClick={() => setIsFocusMode(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                            Return to List
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="today-page-container">
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                    type="text"
                    placeholder="Search today..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        fontSize: '1rem',
                        backgroundColor: 'rgba(0,0,0,0.02)'
                    }}
                />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1, margin: 0 }}>Today</h1>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        style={{
                            padding: '0.5rem',
                            color: showCompleted ? 'var(--primary)' : 'var(--text-secondary)',
                            backgroundColor: showCompleted ? 'var(--primary-muted, rgba(0,0,0,0.05))' : 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            width: '36px',
                            height: '36px'
                        }}
                        title={showCompleted ? "Hide Completed" : "Show Completed"}
                    >
                        {showCompleted ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* Filter / Action Chips (Scrollable on Mobile) */}
                <div className="hide-scrollbar" style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.25rem',
                    margin: '0 -1rem',
                    padding: '0 1rem',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <button
                        onClick={() => setShowOnlyTwoMinute(!showOnlyTwoMinute)}
                        style={{
                            padding: '0.5rem 0.875rem',
                            color: showOnlyTwoMinute ? 'var(--warning, #eab308)' : 'var(--text-secondary)',
                            backgroundColor: showOnlyTwoMinute ? 'rgba(234, 179, 8, 0.15)' : 'var(--card-bg)',
                            border: '1px solid',
                            borderColor: showOnlyTwoMinute ? 'rgba(234, 179, 8, 0.3)' : 'var(--border)',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                        title="Filter 2-Minute Tasks"
                    >
                        {showOnlyTwoMinute ? <Zap size={14} /> : <ZapOff size={14} />}
                        Quick 2m
                    </button>

                    <button
                        onClick={() => setIsFocusMode(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            color: 'var(--primary-foreground)',
                            backgroundColor: 'var(--primary)',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'opacity 0.2s',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Target size={14} />
                        Focus Mode
                    </button>

                    <button
                        onClick={handleSnoozeAll}
                        disabled={isSnoozingAll || unifiedToday.filter(i => !i.isCompleted && i.type === 'task').length === 0}
                        style={{
                            padding: '0.5rem 0.875rem',
                            color: 'var(--foreground)',
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            cursor: isSnoozingAll ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'opacity 0.2s',
                            opacity: (isSnoozingAll || unifiedToday.filter(i => !i.isCompleted && i.type === 'task').length === 0) ? 0.4 : 1,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                        title="Snooze all incomplete tasks to tomorrow"
                    >
                        {isSnoozingAll ? 'Snoozing...' : 'Snooze All'}
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {unifiedToday.length === 0 ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '3rem' }}>🔥</div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>You crushed today!</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No more tasks. Go relax and recharge.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                    <SomedaySweeper activeTasks={activeTasks} />

                    {/* Routines Collapsible */}
                    {unifiedToday.filter(i => i.type === 'routine').length > 0 && (
                        <CollapsibleSection title={`Daily Routines (${unifiedToday.filter(i => i.type === 'routine' && !i.isCompleted).length} active)`}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                {unifiedToday.filter(i => i.type === 'routine').map(item => (
                                    <UnifiedItemCard
                                        key={`${item.type}-${item.id}`}
                                        item={item}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Hard Tasks & Meetings */}
                    {unifiedToday.filter(i => i.type !== 'routine').map(item => (
                        <UnifiedItemCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onToggle={handleToggle}
                            onToggleFrog={handleToggleFrog}
                            onToggleTwoMinute={handleToggleTwoMinute}
                            onTogglePriority={handleTogglePriority}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}



            {/* Quick Capture Bar */}
            <div className="quick-capture-bar">
                <form onSubmit={handleQuickSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '768px', margin: '0 auto' }}>
                    <input
                        type="text"
                        placeholder="I need to..."
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        disabled={isCreatingQuickTask}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            borderRadius: '9999px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-subtle)',
                            fontSize: '1rem',
                            outline: 'none',
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setIsQuickTwoMinute(!isQuickTwoMinute)}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: isQuickTwoMinute ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-subtle)',
                            border: isQuickTwoMinute ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid var(--border)',
                            color: isQuickTwoMinute ? 'var(--warning, #eab308)' : 'var(--muted-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        title="Mark as 2-Minute Task"
                    >
                        <Zap size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsQuickPriority(!isQuickPriority)}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: isQuickPriority ? 'rgba(var(--primary-rgb, 0, 0, 0), 0.1)' : 'var(--bg-subtle)',
                            border: isQuickPriority ? '1px solid var(--primary)' : '1px solid var(--border)',
                            color: isQuickPriority ? 'var(--primary)' : 'var(--muted-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        title="Mark as Priority"
                    >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1, filter: isQuickPriority ? 'grayscale(0)' : 'grayscale(1) opacity(0.5)' }}>⭐</span>
                    </button>
                    <button
                        type="submit"
                        disabled={!quickTaskTitle.trim() || isCreatingQuickTask}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: quickTaskTitle.trim() ? 'var(--primary)' : 'var(--muted)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: quickTaskTitle.trim() ? 'pointer' : 'default',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {isCreatingQuickTask ? <Loader size="sm" /> : <span style={{ fontSize: '1.5rem', lineHeight: '1' }}>+</span>}
                    </button>
                </form>
            </div>
        </div>
    );
}
