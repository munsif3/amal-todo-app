"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToMeetings } from "@/lib/firebase/meetings";
import { Meeting } from "@/types";
import { Plus, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loading";

export default function MeetingsPage() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMeetings(user.uid, (data) => {
            setMeetings(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Group meetings? For now just list.

    return (
        <div style={{ paddingBottom: '80px' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Meetings</h2>
                <Link href="/meetings/edit?id=new" style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
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
                    color: '#888',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px'
                }}>
                    <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No upcoming meetings.</p>
                    <p style={{ fontSize: '0.875rem' }}>Plan your first session to stay on track.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {meetings.map((meeting) => (
                        <Link href={`/meetings/edit?id=${meeting.id}`} key={meeting.id} style={{
                            display: 'block',
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary)'
                                }} />
                                <h3 style={{ fontWeight: '600' }}>{meeting.title}</h3>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                fontSize: '0.875rem',
                                color: '#666'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} />
                                    <span>
                                        {meeting.startTime?.toDate().toLocaleDateString()} {meeting.startTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {meeting.checklist?.length > 0 && (
                                    <span>{meeting.checklist.filter(i => i.completed).length}/{meeting.checklist.length} items</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
