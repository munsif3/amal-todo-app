"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { Task, Routine, Meeting } from "@/types";
import { useState, useEffect } from "react";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";
import Loader from "@/components/ui/Loading";
import { Search } from "lucide-react";
import { useRoutineCompletion } from "@/lib/hooks/use-routine-completion";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useRoutines } from "@/lib/hooks/use-routines";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { subscribeToMeetings } from "@/lib/firebase/meetings";

export default function TodayPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(true);

    const {
        activeTasks,
        snoozedTasks,
        finishedTasks,
        loading: tasksLoading,
        changeTaskStatus,
        taskStatusMap
    } = useTasks(user, searchQuery);

    const { todaysRoutines, loading: routinesLoading } = useRoutines(user, searchQuery);
    const { accounts, loading: accountsLoading } = useAccounts(user);
    const { isRoutineCompletedToday, toggleCompletion } = useRoutineCompletion(user);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            // Filter meetings for today + future? Or just all? 
            // For now, let's just take all, but ideally we filter for "Today" in memory or query
            // Simple "Today" filter:
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todaysMeetings = data.filter(m => {
                if (!m.startTime) return false;
                const date = m.startTime.toDate();
                return date >= today && date < tomorrow;
            });
            setMeetings(todaysMeetings);
            setLoadingMeetings(false);
        });
        return () => unsubscribe();
    }, [user]);

    const isLoading = tasksLoading || routinesLoading || accountsLoading || loadingMeetings;

    if (isLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    // Transform Data into UnifiedItems
    const unifiedItems: UnifiedItem[] = [];

    // 1. Meetings
    meetings.forEach(m => {
        unifiedItems.push({
            id: m.id!,
            type: 'meeting',
            title: m.title,
            subtitle: m.notes?.before || "No notes",
            time: m.startTime?.toDate(),
            isCompleted: false, // Meetings don't strictly have completion state in this model yet
            accountId: m.accountId || undefined,
            areaColor: accounts.find(a => a.id === m.accountId)?.color,
            originalItem: m
        });
    });

    // 2. Routines (Today's)
    todaysRoutines.forEach(r => {
        const isCompleted = isRoutineCompletedToday(r);
        unifiedItems.push({
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
    activeTasks.forEach(t => {
        unifiedItems.push({
            id: t.id!,
            type: 'task',
            title: t.title,
            subtitle: t.description,
            time: t.deadline?.toDate(),
            isCompleted: false,
            accountId: t.accountId || undefined,
            areaColor: accounts.find(a => a.id === t.accountId)?.color,
            originalItem: t
        });
    });

    // Sort Unified Stream
    // P1: Items with Time (Earliest first)
    // P2: Routines (Incomplete first)
    // P3: Tasks (In order they came from useTasks)
    unifiedItems.sort((a, b) => {
        // Completion pushes to bottom
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

        // If both have time, compare time
        if (a.time && b.time) return a.time.getTime() - b.time.getTime();

        // If one has time, it comes first
        if (a.time) return -1;
        if (b.time) return 1;

        // If neither has time, prioritize type: Routine -> Task
        // (Assuming you want to do habits before general tasks, or vice versa. Let's do Routine first)
        const typePriority = { meeting: 0, routine: 1, task: 2 };
        if (typePriority[a.type] !== typePriority[b.type]) {
            return typePriority[a.type] - typePriority[b.type];
        }

        return 0; // Keep original order otherwise
    });

    const handleToggle = (item: UnifiedItem) => {
        if (item.type === 'task') {
            changeTaskStatus(item.id, item.isCompleted ? 'next' : 'done');
        } else if (item.type === 'routine') {
            toggleCompletion(item.originalItem);
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

            {/* Header / Date or Greeting? */}
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Today</h1>

            {unifiedItems.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                    <p>Your day is clear.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {unifiedItems.map(item => (
                        <UnifiedItemCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onToggle={handleToggle}
                            isBlocked={false} // TODO: Re-integrate dependency logic
                        />
                    ))}
                </div>
            )}

            {/* Completed Section (optional, maybe specific toggler?) 
                Currently mixed into bottom because of sort logic.
            */}
        </div>
    );
}
