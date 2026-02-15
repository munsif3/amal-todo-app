"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { Meeting } from "@/types";
import { useState, useEffect } from "react";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";
import Loader from "@/components/ui/Loading";
import { Search } from "lucide-react";
import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useRoutines } from "@/lib/hooks/use-routines";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { subscribeToMeetings, toggleMeetingCompletion } from "@/lib/firebase/meetings";
import CollapsibleSection from "@/components/ui/CollapsibleSection";

export default function TodayPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(true);

    const {
        activeTasks,
        loading: tasksLoading,
        changeTaskStatus,
    } = useTasks(user, searchQuery);

    const { todaysRoutines, loading: routinesLoading } = useRoutines(user, searchQuery);
    const { accounts, loading: accountsLoading } = useAccounts(user);
    const { isRoutineCompletedToday, toggleCompletion } = useRoutineCompletion(user);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            // Fetch all meetings, then we can filter in-memory for Today vs Future
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
            // Past (Overdue) + Today
            // We show all past meetings as "Overdue" or just "Past" items in the main list
            if (date && date <= endOfToday) {
                todayMeetings.push(item);
            }
        }
    });

    // 2. Routines (Always "Today" as useRoutines returns today's routines)
    const todayRoutinesItems: UnifiedItem[] = [];
    todaysRoutines.forEach(r => {
        const isCompleted = isRoutineCompletedToday(r);
        todayRoutinesItems.push({
            id: r.id!,
            type: 'routine',
            title: r.title,
            isCompleted: isCompleted,
            accountId: r.accountId || undefined,
            areaColor: accounts.find(a => a.id === r.accountId)?.color,
            originalItem: r
        });
    });

    // 3. Active Tasks
    // Split into Today (includes Overdue/No Date) and Future
    const todayTasksItems: UnifiedItem[] = [];
    const futureTasksItems: UnifiedItem[] = [];

    activeTasks.forEach(t => {
        const date = t.deadline?.toDate();
        let badge: UnifiedItem['badge'] = undefined;

        if (!date) {
            badge = { text: 'No Deadline', variant: 'neutral' };
        } else if (date < today) {
            // Overdue
            // Calculate difference in days based on midnight to midnight
            const d1 = new Date(today);
            const d2 = new Date(date);
            d2.setHours(0, 0, 0, 0); // Reset deadline to midnight for day calc

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
            originalItem: t,
            badge: badge
        };

        if (isFuture(date)) {
            futureTasksItems.push(item);
        } else {
            // Today, Overdue, or No Date
            todayTasksItems.push(item);
        }
    });

    // --- Sort Lists ---
    const sortItems = (items: UnifiedItem[]) => {
        return items.sort((a, b) => {
            // Completion pushes to bottom
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

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

    const unifiedToday = sortItems([...todayMeetings, ...todayRoutinesItems, ...todayTasksItems]);
    const unifiedFuture = sortItems([...futureMeetings, ...futureTasksItems]);

    const handleToggle = (item: UnifiedItem) => {
        if (item.type === 'task') {
            changeTaskStatus(item.id, item.isCompleted ? 'next' : 'done');
        } else if (item.type === 'routine') {
            toggleCompletion(item.originalItem);
        } else if (item.type === 'meeting') {
            toggleMeetingCompletion(item.id, !item.isCompleted);
        }
    };

    return (
        <div style={{ paddingBottom: '6rem' }}>
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Today</h1>

            {unifiedToday.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                    <p>Your day is clear.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                    {unifiedToday.map(item => (
                        <UnifiedItemCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            {/* Future Section */}
            {unifiedFuture.length > 0 && (
                <CollapsibleSection title={`Upcoming (${unifiedFuture.length})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {unifiedFuture.map(item => (
                            <UnifiedItemCard
                                key={`${item.type}-${item.id}`}
                                item={item}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
            )}
        </div>
    );
}
