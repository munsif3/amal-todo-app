import { useState } from "react";
import { Escalation, addEscalation, resolveEscalation } from "@/lib/firebase/cockpit";
import { ArrowUpRight, X } from "lucide-react";

interface NeedsFromLeadershipProps {
    escalations: Escalation[];
    sprintId: string;
}

export default function NeedsFromLeadership({ escalations, sprintId }: NeedsFromLeadershipProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [text, setText] = useState("");
    const [directedAt, setDirectedAt] = useState<'Chamath' | 'Jonathan'>('Chamath');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setIsSubmitting(true);
        try {
            await addEscalation(text, directedAt, sprintId);
            setText("");
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding escalation:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            await resolveEscalation(id);
        } catch (error) {
            console.error("Error resolving escalation:", error);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Needs from Chamath / Jonathan
            </h2>
            
            <div style={{ width: '100%' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {escalations.length === 0 ? (
                        <li style={{ padding: '1rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No current escalations for leadership.
                        </li>
                    ) : (
                        escalations.map((esc, index) => (
                            <li key={esc.id} className="mobile-col" style={{ 
                                padding: '1rem 0', 
                                paddingRight: '0.5rem', 
                                display: 'flex', 
                                gap: '1rem', 
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(128,128,128,0.1)' 
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500', width: '1.5rem', flexShrink: 0, marginTop: '0.1rem' }}>
                                        {index + 1}.
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', flex: 1, lineHeight: 1.4 }}>
                                        {esc.text}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '600', backgroundColor: 'var(--bg-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                                        {esc.directedAt}
                                    </span>
                                    <button 
                                        onClick={() => handleResolve(esc.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}
                                        title="Mark as resolved"
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                    
                    {isAdding ? (
                        <li style={{ padding: '1rem 0', borderTop: '1px dashed var(--border)', marginTop: escalations.length > 0 ? '0' : '1rem' }}>
                            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                                <input 
                                    autoFocus
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="What do you need?"
                                    style={{ flex: 1, padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none' }}
                                />
                                <select 
                                    value={directedAt}
                                    onChange={e => setDirectedAt(e.target.value as any)}
                                    style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="Chamath">Chamath</option>
                                    <option value="Jonathan">Jonathan</option>
                                </select>
                                <button 
                                    type="submit" 
                                    disabled={!text.trim() || isSubmitting}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: '600', cursor: text.trim() && !isSubmitting ? 'pointer' : 'not-allowed', opacity: text.trim() && !isSubmitting ? 1 : 0.5 }}
                                >
                                    Add
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsAdding(false)}
                                    style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={16} />
                                </button>
                            </form>
                        </li>
                    ) : (
                        <li style={{ 
                            padding: '1rem 0', 
                            borderTop: '1px dashed var(--border)', 
                            marginTop: escalations.length > 0 ? '0' : '1rem', 
                            cursor: 'pointer', 
                            color: 'var(--text-secondary)', 
                            transition: 'color 0.2s ease' 
                        }}
                        onClick={() => setIsAdding(true)}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: '500' }}>
                                + add escalation <ArrowUpRight size={14} />
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
