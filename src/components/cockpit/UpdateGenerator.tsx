import { useState } from "react";
import { format as formatDate, addDays, differenceInCalendarDays } from "date-fns";
import { Check, Copy, X } from "lucide-react";
import { Sprint, Epic, Escalation } from "@/lib/firebase/cockpit";

interface UpdateGeneratorProps {
    sprint: Sprint;
    epics: Epic[];
    escalations: Escalation[];
    onClose: () => void;
}

export default function UpdateGenerator({ sprint, epics, escalations, onClose }: UpdateGeneratorProps) {
    const [copied, setCopied] = useState(false);
    
    const today = new Date();
    const formattedToday = formatDate(today, "d MMM yyyy");
    const nextUpdateDate = formatDate(addDays(today, 7), "d MMM yyyy");
    
    const startDate = sprint.startDate.toDate();
    let currentDay = differenceInCalendarDays(today, startDate) + 1;
    currentDay = Math.max(1, Math.min(10, currentDay));

    const greenCount = epics.filter(e => e.status === 'green').length;
    const amberCount = epics.filter(e => e.status === 'amber').length;
    const redCount = epics.filter(e => e.status === 'red').length;

    const opusEpics = epics.filter(e => e.type === 'OPUS');
    const opsEpics = epics.filter(e => e.type === 'OPS');

    const getStatusEmoji = (status: string) => {
        if (status === 'green') return '🟢';
        if (status === 'amber') return '🟡';
        return '🔴';
    };

    const formatEpicList = (epicList: Epic[]) => {
        if (epicList.length === 0) return "No epics in this category.\n";
        return epicList.map(epic => {
            const blockerText = (epic.blocker && epic.blocker !== '—') ? `. ${epic.blocker}` : '';
            return `${getStatusEmoji(epic.status)} ${epic.name} (${epic.team}) — ${epic.owner}${blockerText}`;
        }).join('\n');
    };

    const formatEscalations = () => {
        if (escalations.length === 0) return "No active escalations.\n";
        return escalations.map((esc, i) => `${i + 1}. ${esc.text} (${esc.directedAt})`).join('\n');
    };

    const updateText = `Subject: Search Teams — Sprint Status Update [${sprint.sprintId} | ${formattedToday}]

Hi Chamath, Jonathan,

Sprint ${sprint.sprintId} status — Day ${currentDay} of 10.
${greenCount} on track · ${amberCount} at risk · ${redCount} blocked

━━━━━━━━━━━━━━━━━━━━
OPUS — Product Delivery
━━━━━━━━━━━━━━━━━━━━
${formatEpicList(opusEpics)}

━━━━━━━━━━━━━━━━━━━━
OPS — Engineering Stability
━━━━━━━━━━━━━━━━━━━━
${formatEpicList(opsEpics)}

━━━━━━━━━━━━━━━━━━━━
Needs from you
━━━━━━━━━━━━━━━━━━━━
${formatEscalations()}

Next update: Friday ${nextUpdateDate}.

Thanks,
Munsif`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(updateText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
            overflow: 'hidden',
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem 1.25rem', 
                borderBottom: '1px solid var(--border)', 
                backgroundColor: 'var(--bg-subtle)' 
            }}>
                <h3 style={{ fontWeight: '600', color: 'var(--foreground)', margin: 0, fontSize: '1rem' }}>
                    Friday update generated
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                        onClick={handleCopy}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                            fontWeight: '500',
                            transition: 'var(--transition-ease)',
                            cursor: 'pointer',
                            border: 'none',
                            ...(copied 
                                ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' } 
                                : { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' })
                        }}
                    >
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy full text</>}
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '0.375rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'transparent',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'var(--transition-ease)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                            e.currentTarget.style.color = 'var(--foreground)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
            
            <div style={{ padding: '1.25rem', overflowY: 'auto', width: '100%', backgroundColor: 'var(--background)' }}>
                <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace', 
                    fontSize: '0.8125rem', 
                    lineHeight: 1.6, 
                    color: 'var(--text-secondary)', 
                    margin: 0 
                }}>
                    {updateText}
                </pre>
            </div>
        </div>
    );
}
