import { useState, useEffect } from "react";
import { Epic, updateEpic } from "@/lib/firebase/cockpit";
import { subscribeToEpicTasks } from "@/lib/firebase/tasks";
import { useAuth } from "@/lib/firebase/auth-context";
import { Task } from "@/types";
import { X, CheckCircle2 } from "lucide-react";

// --- Types ---
export interface EpicDetailPanelPresenterProps {
    epic: Epic;
    linkedTasks: Task[];
    onClose: () => void;
    onSaveField: (field: keyof Epic, value: any) => void;
}

// --- DUMB PRESENTER ---
export function EpicDetailPanelPresenter({ epic, linkedTasks, onClose, onSaveField }: EpicDetailPanelPresenterProps) {
    const [name, setName] = useState(epic.name);
    const [subTitle, setSubTitle] = useState(epic.subTitle || "");
    const [type, setType] = useState(epic.type);
    const [team, setTeam] = useState(epic.team);
    const [owner, setOwner] = useState(epic.owner);
    const [myRole, setMyRole] = useState(epic.myRole);
    const [status, setStatus] = useState(epic.status);
    const [blocker, setBlocker] = useState(epic.blocker || "");
    const [myAction, setMyAction] = useState(epic.myAction || "");

    useEffect(() => {
        setName(epic.name);
        setSubTitle(epic.subTitle || "");
        setType(epic.type);
        setTeam(epic.team);
        setOwner(epic.owner);
        setMyRole(epic.myRole);
        setStatus(epic.status);
        setBlocker(epic.blocker || "");
        setMyAction(epic.myAction || "");
    }, [epic]);

    const completedLinkedTasks = linkedTasks.filter(t => t.status === 'done').length;
    const totalLinkedTasks = linkedTasks.length;
    const progressPercent = totalLinkedTasks > 0 ? Math.round((completedLinkedTasks / totalLinkedTasks) * 100) : 0;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--background)',
            borderLeft: '1px solid var(--border)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out forwards'
        }}>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .epic-detail-grid {
                    display: grid;
                    grid-template-columns: 120px 1fr;
                    gap: 1rem;
                    align-items: center;
                }
                @media (max-width: 767px) {
                    .epic-detail-grid {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Epic Details</h3>
                <button 
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                >
                    <X size={20} />
                </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Header Editors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={() => onSaveField('name', name)}
                        style={{ fontSize: '1.5rem', fontWeight: '700', backgroundColor: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', width: '100%' }}
                        placeholder="Epic Name"
                    />
                    <input 
                        value={subTitle}
                        onChange={e => setSubTitle(e.target.value)}
                        onBlur={() => onSaveField('subTitle', subTitle)}
                        style={{ fontSize: '1rem', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                        placeholder="Subtitle (optional)"
                    />
                </div>

                <div className="epic-detail-grid">
                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Type</label>
                    <select 
                        value={type} 
                        onChange={e => { setType(e.target.value as any); onSaveField('type', e.target.value); }}
                        style={selectStyle}
                    >
                        <option value="OPUS">OPUS</option>
                        <option value="OPS">OPS</option>
                    </select>

                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Team</label>
                    <select 
                        value={team} 
                        onChange={e => { setTeam(e.target.value as any); onSaveField('team', e.target.value); }}
                        style={selectStyle}
                    >
                        <option value="Flash">Flash</option>
                        <option value="Magellan">Magellan</option>
                        <option value="Orion">Orion</option>
                    </select>

                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Owner</label>
                    <input 
                        value={owner}
                        onChange={e => setOwner(e.target.value)}
                        onBlur={() => onSaveField('owner', owner)}
                        style={inputStyle}
                        placeholder="Owner Name"
                    />

                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>My Role</label>
                    <select 
                        value={myRole} 
                        onChange={e => { setMyRole(e.target.value as any); onSaveField('myRole', e.target.value); }}
                        style={selectStyle}
                    >
                        <option value="Informed">Informed</option>
                        <option value="Unblock">Unblock</option>
                        <option value="Driver">Driver</option>
                    </select>

                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Status</label>
                    <select 
                        value={status} 
                        onChange={e => { setStatus(e.target.value as any); onSaveField('status', e.target.value); }}
                        style={selectStyle}
                    >
                        <option value="green">Green (On Track)</option>
                        <option value="amber">Amber (At Risk)</option>
                        <option value="red">Red (Blocked)</option>
                        <option value="done">Done (Completed)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Blocker</label>
                    <textarea 
                        value={blocker}
                        onChange={e => setBlocker(e.target.value)}
                        onBlur={() => onSaveField('blocker', blocker)}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="Current blockers..."
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>My Action</label>
                    <textarea 
                        value={myAction}
                        onChange={e => setMyAction(e.target.value)}
                        onBlur={() => onSaveField('myAction', myAction)}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="My next actions..."
                    />
                </div>

                {/* Linked Tasks Section (Phase 3 Auto-Rollup View) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                            Linked Tasks
                        </label>
                        {totalLinkedTasks > 0 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: progressPercent === 100 ? '#10b981' : 'var(--text-secondary)' }}>
                                {completedLinkedTasks}/{totalLinkedTasks} done
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {totalLinkedTasks > 0 && (
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                backgroundColor: progressPercent === 100 ? '#10b981' : 'var(--primary)',
                                transition: 'width 0.3s ease',
                                borderRadius: '3px'
                            }} />
                        </div>
                    )}

                    {totalLinkedTasks === 0 ? (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            No tasks linked to this epic yet. Assign tasks via the Task form.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {linkedTasks.map(task => (
                                <div key={task.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: 'var(--bg-subtle)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(128,128,128,0.05)'
                                }}>
                                    <CheckCircle2
                                        size={16}
                                        style={{
                                            flexShrink: 0,
                                            color: task.status === 'done' ? '#10b981' : 'var(--text-muted)',
                                            opacity: task.status === 'done' ? 1 : 0.4
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '0.8125rem',
                                        color: task.status === 'done' ? 'var(--text-secondary)' : 'var(--foreground)',
                                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                        fontWeight: '500',
                                        flex: 1,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {task.title}
                                    </span>
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        fontWeight: '600',
                                        padding: '0.125rem 0.4rem',
                                        borderRadius: '4px',
                                        backgroundColor: task.status === 'done' ? 'rgba(16,185,129,0.1)' : 'rgba(128,128,128,0.1)',
                                        color: task.status === 'done' ? '#10b981' : 'var(--text-muted)',
                                        flexShrink: 0,
                                        textTransform: 'uppercase'
                                    }}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SMART CONTAINER ---
interface EpicDetailPanelProps {
    epic: Epic;
    onClose: () => void;
}

export default function EpicDetailPanel({ epic, onClose }: EpicDetailPanelProps) {
    const { user } = useAuth();
    const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (!epic.id || !user) return;
        const unsub = subscribeToEpicTasks(user.uid, epic.id, (tasks) => {
            setLinkedTasks(tasks);
        });
        return () => unsub();
    }, [epic.id, user]);

    const handleSaveField = (field: keyof Epic, value: any) => {
        if (epic[field] !== value) {
            updateEpic(epic.id, { [field]: value });
        }
    };

    return <EpicDetailPanelPresenter epic={epic} linkedTasks={linkedTasks} onClose={onClose} onSaveField={handleSaveField} />;
}

const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit'
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer'
};
