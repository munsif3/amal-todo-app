"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getDelegation, updateDelegation, deleteDelegation } from "@/lib/firebase/delegations";
import { getDelegationProgress } from "@/lib/hooks/use-delegations";
import { Delegation } from "@/types";
import Loader from "@/components/ui/Loading";
import { ArrowLeft, User, Clock, Pencil, Trash2, CheckCircle2, AlertCircle, Eye, Calendar } from "lucide-react";
import Link from "next/link";

function DelegationDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [delegation, setDelegation] = useState<Delegation | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [closingNotes, setClosingNotes] = useState("");
    const [showCloseForm, setShowCloseForm] = useState(false);

    const delegationId = searchParams.get("id");

    useEffect(() => {
        if (delegationId) {
            getDelegation(delegationId).then((data) => {
                setDelegation(data);
                if (data?.closingNotes) setClosingNotes(data.closingNotes);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [delegationId]);

    if (loading) return <Loader fullScreen={false} className="py-8" />;
    if (!delegation) {
        return (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>Delegation not found.</p>
                <Link href="/delegations" style={{ color: 'var(--primary)', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>
                    Back to Delegations
                </Link>
            </div>
        );
    }

    const progress = getDelegationProgress(delegation);
    const isOverdue = delegation.deadline && delegation.deadline.toDate() < new Date() && delegation.status !== 'closed';

    const toggleSubtask = async (subtaskId: string) => {
        if (!delegation || delegation.status === 'closed') return;
        setUpdating(true);
        const updated = delegation.subtasks.map(s =>
            s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        await updateDelegation(delegation.id, { subtasks: updated });
        setDelegation({ ...delegation, subtasks: updated });
        setUpdating(false);
    };

    const moveToReview = async () => {
        setUpdating(true);
        await updateDelegation(delegation.id, { status: 'review' });
        setDelegation({ ...delegation, status: 'review' });
        setUpdating(false);
    };

    const closeDelegation = async () => {
        setUpdating(true);
        await updateDelegation(delegation.id, { status: 'closed', closingNotes });
        setDelegation({ ...delegation, status: 'closed', closingNotes });
        setUpdating(false);
        setShowCloseForm(false);
    };

    const reopenDelegation = async () => {
        setUpdating(true);
        await updateDelegation(delegation.id, { status: 'active', closingNotes: '' });
        setDelegation({ ...delegation, status: 'active', closingNotes: '' });
        setUpdating(false);
    };

    const handleDelete = async () => {
        if (confirm("Delete this delegation permanently?")) {
            await deleteDelegation(delegation.id);
            router.push("/delegations");
        }
    };

    const statusColors: Record<string, { color: string; bg: string; label: string }> = {
        active: { label: "Active", color: "#8a9a5b", bg: "rgba(138,154,91,0.12)" },
        review: { label: "In Review", color: "#d1b894", bg: "rgba(209,184,148,0.12)" },
        closed: { label: "Closed", color: "#b2bec3", bg: "rgba(178,190,195,0.12)" },
    };
    const sc = statusColors[delegation.status];

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem', maxWidth: '700px' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, flex: 1 }}>{delegation.title}</h1>
            </header>

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <span style={{
                    fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.75rem',
                    borderRadius: '20px', backgroundColor: sc.bg, color: sc.color,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                    {sc.label}
                </span>

                {delegation.assignee && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <User size={14} /> {delegation.assignee}
                    </span>
                )}

                {delegation.deadline && (
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem',
                        color: isOverdue ? 'var(--destructive)' : 'var(--text-secondary)',
                    }}>
                        <Calendar size={14} />
                        {delegation.deadline.toDate().toLocaleDateString()}
                        {isOverdue && <AlertCircle size={13} />}
                    </span>
                )}
            </div>

            {/* Description */}
            {delegation.description && (
                <div style={{
                    padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '12px',
                    marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)',
                }}>
                    {delegation.description}
                </div>
            )}

            {/* Progress bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Progress</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: progress === 100 ? '#8a9a5b' : 'var(--text-secondary)' }}>
                        {progress}%
                    </span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${progress}%`, borderRadius: '4px',
                        backgroundColor: progress === 100 ? '#8a9a5b' : 'var(--primary)',
                        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                </div>
            </div>

            {/* Subtasks checklist */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Subtasks ({delegation.subtasks.filter(s => s.isCompleted).length}/{delegation.subtasks.length})
                </h2>
                {delegation.subtasks.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subtasks added.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {delegation.subtasks.map((st) => (
                            <button
                                key={st.id}
                                onClick={() => toggleSubtask(st.id)}
                                disabled={updating || delegation.status === 'closed'}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem 1rem', backgroundColor: 'var(--card-bg)',
                                    borderRadius: '10px', border: '1px solid var(--border)',
                                    cursor: delegation.status === 'closed' ? 'default' : 'pointer',
                                    opacity: updating ? 0.6 : 1,
                                    transition: 'var(--transition-ease)',
                                    width: '100%', textAlign: 'left',
                                }}
                            >
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                                    border: st.isCompleted ? 'none' : '2px solid var(--border)',
                                    backgroundColor: st.isCompleted ? '#8a9a5b' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'var(--transition-ease)',
                                }}>
                                    {st.isCompleted && <CheckCircle2 size={14} color="#fff" />}
                                </div>
                                <span style={{
                                    fontSize: '0.9rem',
                                    textDecoration: st.isCompleted ? 'line-through' : 'none',
                                    opacity: st.isCompleted ? 0.5 : 1,
                                }}>
                                    {st.title}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Actions */}
            {delegation.status === 'active' && progress === 100 && (
                <button
                    id="move-to-review-btn"
                    onClick={moveToReview}
                    disabled={updating}
                    style={{
                        width: '100%', padding: '1rem', borderRadius: '12px',
                        backgroundColor: '#d1b894', color: '#1a1a1a', border: 'none',
                        fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
                        marginBottom: '1rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.5rem',
                        transition: 'var(--transition-ease)', opacity: updating ? 0.6 : 1,
                    }}
                >
                    <Eye size={18} />
                    All subtasks done — Move to Review
                </button>
            )}

            {delegation.status === 'review' && !showCloseForm && (
                <button
                    id="close-delegation-btn"
                    onClick={() => setShowCloseForm(true)}
                    disabled={updating}
                    style={{
                        width: '100%', padding: '1rem', borderRadius: '12px',
                        backgroundColor: '#8a9a5b', color: '#fff', border: 'none',
                        fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
                        marginBottom: '1rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.5rem',
                        transition: 'var(--transition-ease)', opacity: updating ? 0.6 : 1,
                    }}
                >
                    <CheckCircle2 size={18} />
                    Close Delegation
                </button>
            )}

            {showCloseForm && delegation.status === 'review' && (
                <div style={{
                    padding: '1.25rem', backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '12px', marginBottom: '1rem',
                }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Closing Notes
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Any follow-ups? Release comms needed? Talk to manager?
                    </p>
                    <textarea
                        id="closing-notes-input"
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        placeholder="e.g. Communicate release to stakeholders, update JIRA..."
                        rows={3}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '8px',
                            border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)',
                            fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical',
                            outline: 'none', marginBottom: '0.75rem',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={closeDelegation}
                            disabled={updating}
                            style={{
                                flex: 1, padding: '0.75rem', borderRadius: '8px',
                                backgroundColor: '#8a9a5b', color: '#fff', border: 'none',
                                fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
                                opacity: updating ? 0.5 : 1,
                            }}
                        >
                            Confirm Close
                        </button>
                        <button
                            onClick={() => setShowCloseForm(false)}
                            style={{
                                padding: '0.75rem 1rem', borderRadius: '8px',
                                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.9rem',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Closed: show closing notes */}
            {delegation.status === 'closed' && delegation.closingNotes && (
                <div style={{
                    padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '12px',
                    marginBottom: '1rem', borderLeft: '3px solid #8a9a5b',
                }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Closing Notes
                    </h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
                        {delegation.closingNotes}
                    </p>
                </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                {delegation.status !== 'closed' && (
                    <Link
                        href={`/delegations/edit?id=${delegation.id}`}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.6rem 1rem', borderRadius: '8px',
                            border: '1px solid var(--border)', color: 'var(--text-secondary)',
                            fontSize: '0.85rem', fontWeight: '500', textDecoration: 'none',
                        }}
                    >
                        <Pencil size={14} /> Edit
                    </Link>
                )}

                {delegation.status === 'closed' && (
                    <button
                        onClick={reopenDelegation}
                        disabled={updating}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.6rem 1rem', borderRadius: '8px',
                            border: '1px solid var(--border)', color: 'var(--text-secondary)',
                            fontSize: '0.85rem', fontWeight: '500', background: 'none', cursor: 'pointer',
                        }}
                    >
                        Reopen
                    </button>
                )}

                <button
                    onClick={handleDelete}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.6rem 1rem', borderRadius: '8px', marginLeft: 'auto',
                        border: '1px solid var(--border)', color: 'var(--destructive)',
                        fontSize: '0.85rem', fontWeight: '500', background: 'none', cursor: 'pointer',
                    }}
                >
                    <Trash2 size={14} /> Delete
                </button>
            </div>
        </div>
    );
}

export default function DelegationDetailPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <DelegationDetailContent />
        </Suspense>
    );
}
