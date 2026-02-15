"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { subscribeToMeetings, toggleMeetingCompletion } from "@/lib/firebase/meetings";
import { Meeting } from "@/types";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";
import Loader from "@/components/ui/Loading";
import { ArrowLeft, ScrollText, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LogbookPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(true);

    // We only care about finished tasks here
    const { finishedTasks, loading: tasksLoading, changeTaskStatus } = useTasks(user, searchQuery);
    const { accounts, loading: accountsLoading } = useAccounts(user);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            setMeetings(data);
            setLoadingMeetings(false);
        });
        return () => unsubscribe();
    }, [user]);

    const isLoading = tasksLoading || accountsLoading || loadingMeetings;

    if (isLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    // Filter completed meetings
    const completedMeetings = meetings.filter(m => m.isCompleted);

    // Create Unified Items
    const unifiedItems: UnifiedItem[] = [];

    // Add Tasks
    finishedTasks.forEach(task => {
        const item: UnifiedItem = {
            id: task.id!,
            type: 'task',
            title: task.title,
            subtitle: task.description,
            time: task.deadline?.toDate(),
            isCompleted: true,
            accountId: task.accountId || undefined,
            areaColor: accounts.find(a => a.id === task.accountId)?.color,
            originalItem: task,
            badge: undefined // Logbook items usually don't show overdue badges
        };
        unifiedItems.push(item);
    });

    // Add Meetings
    completedMeetings.forEach(meeting => {
        const item: UnifiedItem = {
            id: meeting.id!,
            type: 'meeting',
            title: meeting.title,
            subtitle: meeting.notes?.before || "No notes",
            time: meeting.startTime?.toDate(),
            isCompleted: true,
            accountId: meeting.accountId || undefined,
            areaColor: accounts.find(a => a.id === meeting.accountId)?.color,
            originalItem: meeting,
            badge: undefined
        };
        unifiedItems.push(item);
    });

    // Sort by completion time (reverse chronological)
    const sortedItems = unifiedItems.sort((a, b) => {
        const getTime = (item: UnifiedItem) => {
            if (item.type === 'task') {
                const t = item.originalItem;
                // Find latest 'done' status change
                const doneEntries = t.history?.filter((h: any) => h.action === 'status_changed_to_done');
                if (doneEntries && doneEntries.length > 0) {
                    const latest = doneEntries.reduce((prev: any, current: any) => {
                        return (prev.timestamp?.toMillis() || 0) > (current.timestamp?.toMillis() || 0) ? prev : current;
                    });
                    return latest.timestamp?.toMillis() || 0;
                }
                return t.updatedAt?.toMillis() || t.createdAt?.toMillis() || 0;
            } else if (item.type === 'meeting') {
                const m = item.originalItem;
                return m.updatedAt?.toMillis() || 0;
            }
            return 0;
        };
        return getTime(b) - getTime(a);
    });

    // Filter by search query if needed (useTasks already filters tasks, meetings need manual filter if search is for both?)
    // useTasks filters tasks. meetings are raw.
    const filteredItems = sortedItems.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q));
    });


    const handleToggle = (item: UnifiedItem) => {
        if (item.type === 'task') {
            // Move back to Todo (next)
            changeTaskStatus(item.id, 'next');
        } else if (item.type === 'meeting') {
            toggleMeetingCompletion(item.id, false);
        }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ScrollText size={24} color="var(--primary)" />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Logbook</h1>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Search logbook..."
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
            </header>

            {filteredItems.length === 0 ? (
                <div style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    opacity: 0.5,
                    border: '1px dashed var(--border)',
                    borderRadius: '16px'
                }}>
                    <p>No completed items yet.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Finish some tasks or meetings to see them here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredItems.map(item => (
                        <UnifiedItemCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onToggle={handleToggle}
                            isBlocked={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
