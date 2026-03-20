import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Delegation } from "@/types";
import { subscribeToDelegations } from "@/lib/firebase/delegations";
import { format } from "date-fns";

// --- Types ---
export interface OverdueDelegationsPresenterProps {
    delegations: Delegation[];
    copiedId: string | null;
    onCopy: (delegation: Delegation) => void;
}

// --- DUMB PRESENTER ---
export function OverdueDelegationsPresenter({ delegations, copiedId, onCopy }: OverdueDelegationsPresenterProps) {
    return (
        <div style={{ width: '100%', marginTop: '3rem' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                OVERDUE DELEGATIONS
            </h2>
            
            {delegations.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    All delegations on track.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {delegations.map(del => {
                        const isOverdue = del.deadline && del.deadline.toDate() < new Date();
                        const subtaskCount = del.subtasks?.length || 0;
                        const completedCount = del.subtasks?.filter(s => s.isCompleted)?.length || 0;
                        const percent = subtaskCount === 0 ? 0 : Math.round((completedCount / subtaskCount) * 100);
                        const dueDateStr = del.deadline ? format(del.deadline.toDate(), 'dd MMM') : 'No date';
                        
                        return (
                            <div key={del.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--foreground)' }}>
                                        {del.assignee} <span style={{ fontWeight: 'normal' }}>· {del.title}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: isOverdue ? 'var(--destructive)' : 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        Due {dueDateStr}
                                    </div>
                                </div>
                                
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: isOverdue ? 'var(--destructive)' : 'var(--primary)' }} />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1, padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Hi {del.assignee}, checking in...
                                    </div>
                                    <button 
                                        onClick={() => onCopy(del)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' }}
                                    >
                                        {copiedId === del.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                        {copiedId === del.id ? 'Copied' : 'Follow up'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// --- SMART CONTAINER ---
interface OverdueDelegationsProps {
    userId: string;
}

export default function OverdueDelegations({ userId }: OverdueDelegationsProps) {
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = subscribeToDelegations(userId, (allDelegations) => {
            const now = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(now.getDate() + 3);

            const flagged = allDelegations.filter(d => {
                if (d.status === "closed") return false;
                
                const isOverdue = d.deadline && d.deadline.toDate() < now;
                if (isOverdue) return true;
                
                if (d.deadline) {
                    const dueDate = d.deadline.toDate();
                    const subtaskCount = d.subtasks?.length || 0;
                    const completedCount = d.subtasks?.filter(s => s.isCompleted)?.length || 0;
                    const percent = subtaskCount === 0 ? 0 : Math.round((completedCount / subtaskCount) * 100);

                    if (dueDate <= threeDaysFromNow && percent < 50) return true;
                }
                
                return false;
            });

            setDelegations(flagged);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleCopy = (delegation: Delegation) => {
        const text = `Hi ${delegation.assignee}, checking in on ${delegation.title} — can you give me a quick status update?`;
        navigator.clipboard.writeText(text);
        setCopiedId(delegation.id!);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) return null;

    return (
        <OverdueDelegationsPresenter 
            delegations={delegations}
            copiedId={copiedId}
            onCopy={handleCopy}
        />
    );
}
