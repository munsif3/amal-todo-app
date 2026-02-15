"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToMeetings, toggleMeetingCompletion } from "@/lib/firebase/meetings";
import { Meeting } from "@/types";
import { Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loading";
import UnifiedItemCard, { UnifiedItem } from "@/components/today/UnifiedItemCard";
import { useAccounts } from "@/lib/hooks/use-accounts";

export default function MeetingsPage() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const { accounts } = useAccounts(user);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            setMeetings(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Helpers
    const getBadge = (meeting: Meeting): UnifiedItem['badge'] => {
        if (meeting.isCompleted) return undefined;
        const date = meeting.startTime?.toDate();
        const now = new Date();
        if (date && date < now) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const mDate = new Date(date);
            mDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - mDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                return {
                    text: `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
                    variant: 'destructive'
                };
            } else {
                return {
                    text: 'Overdue',
                    variant: 'destructive'
                };
            }
        }
        return undefined;
    };

    const unifiedMeetings: UnifiedItem[] = meetings.map(meeting => ({
        id: meeting.id!,
        type: 'meeting',
        title: meeting.title,
        subtitle: meeting.notes?.before || "No notes",
        time: meeting.startTime?.toDate(),
        isCompleted: meeting.isCompleted || false,
        accountId: meeting.accountId || undefined,
        areaColor: accounts.find(a => a.id === meeting.accountId)?.color,
        originalItem: meeting,
        badge: getBadge(meeting)
    }));

    const handleToggle = (item: UnifiedItem) => {
        toggleMeetingCompletion(item.id, !item.isCompleted);
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Meetings</h2>
                <Link href="/add?mode=MEETING" style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Plus size={20} />
                </Link>
            </header>

            {loading ? (
                <Loader fullScreen={false} className="py-8" />
            ) : meetings.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--text-muted)',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px'
                }}>
                    <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No upcoming meetings.</p>
                    <p style={{ fontSize: '0.875rem' }}>Plan your first session to stay on track.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {unifiedMeetings.map((item) => (
                        <UnifiedItemCard
                            key={item.id}
                            item={item}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
