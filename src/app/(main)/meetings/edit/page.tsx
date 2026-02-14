"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { getMeeting, updateMeeting, createMeeting } from "@/lib/firebase/meetings";
import { ArrowLeft, Plus, Trash2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Timestamp } from "firebase/firestore";

function MeetingDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const id = searchParams.get('id');
    const isNew = !id || id === "new";

    const [loading, setLoading] = useState(!isNew);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState({ before: "", during: "", after: "" });
    const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([]);
    const [newItemText, setNewItemText] = useState("");
    const [startTime, setStartTime] = useState("");

    useEffect(() => {
        if (!user || isNew) return;
        getMeeting(id as string).then(data => {
            if (data) {
                setTitle(data.title);
                setNotes(data.notes || { before: "", during: "", after: "" });
                setChecklist(data.checklist || []);
                // Format datetime-local string
                if (data.startTime) {
                    const d = data.startTime.toDate();
                    const offset = d.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
                    setStartTime(localISOTime);
                }
            } else {
                // handle 404
            }
            setLoading(false);
        });
    }, [user, id, isNew]);

    const handleSave = async () => {
        if (!user) return;
        const meetingData = {
            title,
            notes,
            checklist,
            startTime: startTime ? Timestamp.fromDate(new Date(startTime)) : Timestamp.now(),
        };

        if (isNew) {
            await createMeeting(user.uid, meetingData);
        } else {
            await updateMeeting(id as string, meetingData);
        }
        router.push("/meetings");
    };

    const addChecklistItem = () => {
        if (!newItemText.trim()) return;
        setChecklist([...checklist, { id: Date.now().toString(), text: newItemText, completed: false }]);
        setNewItemText("");
    };

    const toggleChecklistItem = (itemId: string) => {
        setChecklist(checklist.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item));
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading details...</div>;

    return (
        <div style={{ paddingBottom: '80px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
            }}>
                <Link href="/meetings" style={{ color: '#666' }}>
                    <ArrowLeft size={24} />
                </Link>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {isNew ? "New Meeting" : "Edit Meeting"}
                </h2>
                <div style={{ flex: 1 }} />
                <button
                    onClick={handleSave}
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                    }}
                >
                    Save
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Meeting Object..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Date & Time</label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* Pre-Meeting Notes */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Prep Notes (Agenda)</label>
                    <textarea
                        value={notes.before}
                        onChange={(e) => setNotes({ ...notes, before: e.target.value })}
                        placeholder="Topics to discuss..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* Checklist */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Checklist</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {checklist.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button onClick={() => toggleChecklistItem(item.id)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)' }}>
                                    {item.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-muted)' : 'inherit', flex: 1 }}>{item.text}</span>
                                <button onClick={() => setChecklist(checklist.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                            placeholder="Add item..."
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                fontSize: '0.875rem'
                            }}
                        />
                        <button onClick={addChecklistItem} style={{
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '0 0.75rem'
                        }}>
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* Meeting Notes */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Meeting Notes</label>
                    <textarea
                        value={notes.during}
                        onChange={(e) => setNotes({ ...notes, during: e.target.value })}
                        placeholder="Key takeaways..."
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function MeetingDetailPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <MeetingDetailContent />
        </Suspense>
    );
}
