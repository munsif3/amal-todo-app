"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useState } from "react";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";
import Loader from "@/components/ui/Loading";
import { Search, ArchiveRestore } from "lucide-react";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { toggleTaskFrog, toggleTaskTwoMinute } from "@/lib/firebase/tasks";

export default function SomedayPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const {
        somedayTasks,
        loading: tasksLoading,
        changeTaskStatus,
    } = useTasks(user, searchQuery);

    const { accounts, loading: accountsLoading } = useAccounts(user);

    const isLoading = tasksLoading || accountsLoading;

    if (isLoading) {
        return <Loader fullScreen={false} className="py-8" />;
    }

    // --- Transform Content into Unified Items ---

    const somedayItems: UnifiedItem[] = somedayTasks.map(t => {
        return {
            id: t.id!,
            type: 'task',
            title: t.title,
            subtitle: t.description,
            time: t.deadline?.toDate(),
            isCompleted: false, // Someday tasks are implicitly not completed
            accountId: t.accountId || undefined,
            areaColor: accounts.find(a => a.id === t.accountId)?.color,
            epicName: t.epicName || undefined,
            isFrog: t.isFrog,
            isTwoMinute: t.isTwoMinute,
            originalItem: t,
            badge: undefined,
            subtasksCount: t.subtasks && t.subtasks.length > 0 ? {
                completed: t.subtasks.filter((s: any) => s.isCompleted).length,
                total: t.subtasks.length
            } : undefined
        };
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

    // For Someday page, "toggling" a task means restoring it to Active ('next')
    const handleRestore = (item: UnifiedItem) => {
        if (item.type === 'task') {
            changeTaskStatus(item.id, 'next');
        }
    };

    return (
        <div className="someday-page-container" style={{ paddingBottom: '6rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>Someday</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tasks placed on hold or swept away. Swipe right to restore them to your active list.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                    type="text"
                    placeholder="Search someday tasks..."
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

            {somedayItems.length === 0 ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <ArchiveRestore size={48} strokeWidth={1} />
                    <p>Your someday list is empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                    {somedayItems.map(item => (
                        <div key={`${item.type}-${item.id}`} style={{ position: 'relative' }}>
                            {/* Override swipe background specifically for Someday to show a Restore icon */}
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0 1.5rem', zIndex: 0, backgroundColor: 'var(--primary)', opacity: 0.5, borderRadius: 'var(--radius)'
                            }}>
                                <ArchiveRestore size={20} color="white" />
                                <ArchiveRestore size={20} color="white" />
                            </div>

                            <UnifiedItemCard
                                item={item}
                                onToggle={handleRestore}
                                onToggleFrog={handleToggleFrog}
                                onToggleTwoMinute={handleToggleTwoMinute}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
