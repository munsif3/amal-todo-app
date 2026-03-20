import { Epic, updateEpic, EpicRole, EpicStatus } from "@/lib/firebase/cockpit";
import { ArrowUpRight, CheckCircle2, Rocket } from "lucide-react";
import ActivityRing from "@/components/ui/ActivityRing";

interface EpicTableProps {
    epics: Epic[];
    onRowClick: (epic: Epic) => void;
    onAddEpicClick: () => void;
    epicTaskProgress?: Record<string, { done: number; total: number }>;
}

export default function EpicTable({ epics, onRowClick, onAddEpicClick, epicTaskProgress }: EpicTableProps) {
    const handleStatusCycle = (e: React.MouseEvent, epic: Epic) => {
        e.stopPropagation();
        const nextStatus: Record<EpicStatus, EpicStatus> = {
            'green': 'amber',
            'amber': 'red',
            'red': 'green',
            'done': 'green'
        };
        updateEpic(epic.id, { status: nextStatus[epic.status] });
    };

    const handleRoleCycle = (e: React.MouseEvent, epic: Epic) => {
        e.stopPropagation();
        const nextRole: Record<EpicRole, EpicRole> = {
            'Driver': 'Unblock',
            'Unblock': 'Informed',
            'Informed': 'Driver'
        };
        updateEpic(epic.id, { myRole: nextRole[epic.myRole] });
    };

    const handleBlockedEdit = (e: React.MouseEvent, epic: Epic) => {
        e.stopPropagation();
        const value = prompt("Update Blocker:", epic.blocker || "");
        if (value !== null && value !== epic.blocker) {
            updateEpic(epic.id, { blocker: value });
        }
    };

    const handleActionEdit = (e: React.MouseEvent, epic: Epic) => {
        e.stopPropagation();
        const value = prompt("Update My Action:", epic.myAction || "");
        if (value !== null && value !== epic.myAction) {
            updateEpic(epic.id, { myAction: value });
        }
    };

    const handleOwnerEdit = (e: React.MouseEvent, epic: Epic) => {
        e.stopPropagation();
        const value = prompt("Update Owner:", epic.owner || "");
        if (value !== null && value !== epic.owner && value.trim() !== '') {
            updateEpic(epic.id, { owner: value.trim() });
        }
    };
    return (
        <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                EPIC OVERVIEW
            </h2>
            
            <div className="desktop-only" style={{ width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={thStyle}>Epic</th>
                            <th className="desktop-only" style={thStyle}>Type</th>
                            <th className="desktop-only" style={thStyle}>Team</th>
                            <th style={thStyle}>Owner</th>
                            <th style={thStyle}>My role</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                            <th style={thStyle}>Progress</th>
                            <th className="desktop-only" style={thStyle}>Blocker</th>
                            <th className="desktop-only" style={thStyle}>My action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...epics].sort((a,b) => (a.status === 'done' === (b.status === 'done')) ? 0 : a.status === 'done' ? 1 : -1).map(epic => (
                            <tr 
                                key={epic.id} 
                                className="epic-tr" 
                                onClick={() => onRowClick(epic)}
                                style={{ 
                                    borderBottom: '1px solid rgba(128,128,128,0.1)', 
                                    cursor: 'pointer',
                                    opacity: epic.status === 'done' ? 0.6 : 1,
                                    textDecoration: epic.status === 'done' ? 'line-through' : 'none'
                                }}
                            >
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--foreground)' }}>
                                            {epic.name}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button 
                                                title={epic.status === 'done' ? "Reopen Epic" : "Mark as Completed"}
                                                onClick={(e) => { e.stopPropagation(); updateEpic(epic.id, { status: epic.status === 'done' ? 'green' : 'done' }); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', borderRadius: '4px', color: epic.status === 'done' ? '#10b981' : 'var(--text-muted)' }}
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <button 
                                                title={epic.isReleased ? "Unmark Released" : "Mark as Released to Prod"}
                                                onClick={(e) => { e.stopPropagation(); updateEpic(epic.id, { isReleased: !epic.isReleased }); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', borderRadius: '4px', color: epic.isReleased ? '#3b82f6' : 'var(--text-muted)' }}
                                            >
                                                <Rocket size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {epic.subTitle && (
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{epic.subTitle}</div>
                                    )}
                                </td>
                                <td className="desktop-only" style={tdStyle}>
                                    <span style={{ 
                                        padding: '0.25rem 0.6rem', 
                                        borderRadius: '9999px', 
                                        fontSize: '0.6875rem', 
                                        fontWeight: '600', 
                                        ...(epic.type === 'OPUS' 
                                            ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.2)' } 
                                            : { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.2)' })
                                    }}>
                                        {epic.type}
                                    </span>
                                </td>
                                <td className="desktop-only" style={tdStyle}>
                                    <span style={{ 
                                        padding: '0.25rem 0.6rem', 
                                        borderRadius: '9999px', 
                                        fontSize: '0.6875rem', 
                                        fontWeight: '600', 
                                        ...getTeamStyle(epic.team)
                                    }}>
                                        {epic.team}
                                    </span>
                                </td>
                                <td 
                                    style={{ ...tdStyle, fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)' }}
                                    onClick={(e) => handleOwnerEdit(e, epic)}
                                >
                                    <span style={{ borderBottom: '1px dotted var(--border)' }}>{epic.owner}</span>
                                </td>
                                <td style={tdStyle} onClick={(e) => handleRoleCycle(e, epic)}>
                                    <span style={{ ...getRoleStyle(epic.myRole), cursor: 'pointer', padding: '0.2rem 0.5rem', margin: '-0.2rem -0.5rem', borderRadius: '4px' }}>
                                        {epic.myRole}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => handleStatusCycle(e, epic)}>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%',
                                        boxShadow: '0 0 0 2px var(--background)',
                                        backgroundColor: getStatusColor(epic.status),
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s ease',
                                    }} 
                                    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.8)')}
                                    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    />
                                </td>
                                <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {(() => {
                                        const prog = epicTaskProgress?.[epic.id];
                                        if (!prog || prog.total === 0) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>;
                                        const pct = Math.round((prog.done / prog.total) * 100);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <ActivityRing progress={pct} size={24} strokeWidth={3} color={pct === 100 ? '#10b981' : 'var(--primary)'} />
                                                <span style={{ fontWeight: '600', color: pct === 100 ? '#10b981' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{prog.done}/{prog.total}</span>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td 
                                    className="desktop-only"
                                    style={{ ...tdStyle, fontSize: '0.8125rem', color: epic.status === 'red' ? 'var(--destructive)' : 'var(--text-secondary)', fontWeight: epic.status === 'red' ? '500' : 'normal' }}
                                    onClick={(e) => handleBlockedEdit(e, epic)}
                                >
                                    <span style={{ borderBottom: '1px dotted var(--border)' }}>{epic.blocker || '—'}</span>
                                </td>
                                <td 
                                    className="desktop-only"
                                    style={{ ...tdStyle, fontSize: '0.8125rem', color: (epic.myRole === 'Driver' || epic.status === 'red') ? 'var(--destructive)' : 'var(--text-secondary)', fontWeight: (epic.myRole === 'Driver' || epic.status === 'red') ? '500' : 'normal' }}
                                    onClick={(e) => handleActionEdit(e, epic)}
                                >
                                    <span style={{ borderBottom: '1px dotted var(--border)' }}>{epic.myAction || '—'}</span>
                                </td>
                            </tr>
                        ))}
                        
                        <tr style={{ borderTop: '1px dashed var(--border)', cursor: 'pointer' }} onClick={onAddEpicClick}>
                            <td colSpan={9} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                                    + add epic <ArrowUpRight size={14} />
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '1rem' }}>
                {[...epics].sort((a,b) => (a.status === 'done' === (b.status === 'done')) ? 0 : a.status === 'done' ? 1 : -1).map(epic => {
                    const prog = epicTaskProgress?.[epic.id];
                    const pct = prog && prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : null;
                    
                    return (
                        <div 
                            key={`mobile-epic-${epic.id}`} 
                            onClick={() => onRowClick(epic)}
                            style={{ 
                                backgroundColor: 'var(--card-bg)', 
                                borderRadius: '12px', 
                                padding: '1rem', 
                                border: '1px solid var(--border)', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.75rem',
                                opacity: epic.status === 'done' ? 0.6 : 1,
                                textDecoration: epic.status === 'done' ? 'line-through' : 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--foreground)', lineHeight: 1.2 }}>
                                    {epic.name}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button 
                                        title={epic.status === 'done' ? "Reopen Epic" : "Mark as Completed"}
                                        onClick={(e) => { e.stopPropagation(); updateEpic(epic.id, { status: epic.status === 'done' ? 'green' : 'done' }); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: epic.status === 'done' ? '#10b981' : 'var(--text-muted)' }}
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <button 
                                        title={epic.isReleased ? "Unmark Released" : "Mark as Released to Prod"}
                                        onClick={(e) => { e.stopPropagation(); updateEpic(epic.id, { isReleased: !epic.isReleased }); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: epic.isReleased ? '#3b82f6' : 'var(--text-muted)' }}
                                    >
                                        <Rocket size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            {epic.subTitle && (
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-0.25rem' }}>
                                    {epic.subTitle}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                <div 
                                    onClick={(e) => handleStatusCycle(e, epic)}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: '0.3rem', 
                                        padding: '0.2rem 0.6rem', paddingLeft: '0.3rem',
                                        borderRadius: '9999px', border: '1px solid var(--border)',
                                        fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'var(--bg-subtle)',
                                        textTransform: 'uppercase', cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor(epic.status) }} />
                                    {epic.status}
                                </div>

                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', ...(epic.type === 'OPUS' ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.2)' } : { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.2)' }) }}>
                                    {epic.type}
                                </span>
                                
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', ...getTeamStyle(epic.team) }}>
                                    {epic.team}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                                <div onClick={(e) => handleOwnerEdit(e, epic)} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Owner:</span>
                                    <span style={{ fontWeight: '500', borderBottom: '1px dotted var(--border)', color: 'var(--foreground)' }}>{epic.owner}</span>
                                </div>
                                <div onClick={(e) => handleRoleCycle(e, epic)} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                                    <span style={{ cursor: 'pointer', borderBottom: '1px dotted var(--border)', ...getRoleStyle(epic.myRole) }}>{epic.myRole}</span>
                                </div>
                            </div>

                            {/* Mobile Progress Bar underneath */}
                            <div style={{ marginTop: '0.25rem' }}>
                                {pct === null ? (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No linked tasks</div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ActivityRing progress={pct} size={28} strokeWidth={3} color={pct === 100 ? '#10b981' : 'var(--primary)'} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: pct === 100 ? '#10b981' : 'var(--text-secondary)' }}>
                                            {prog!.done}/{prog!.total}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                <button 
                    onClick={onAddEpicClick} 
                    style={{ 
                        width: '100%', padding: '1.25rem 1rem', 
                        backgroundColor: 'transparent', border: '1px dashed var(--border)', 
                        borderRadius: '12px', color: 'var(--text-secondary)', 
                        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        minHeight: '44px'
                    }}
                >
                    + Add New Epic <ArrowUpRight size={16} />
                </button>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.75rem 0.5rem',
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: 'var(--foreground)',
    whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
    padding: '1rem 0.5rem',
    verticalAlign: 'top'
};

function getTeamStyle(team: string): React.CSSProperties {
    switch (team) {
        case 'Flash': return { backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.2)' };
        case 'Magellan': return { backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#5eead4', border: '1px solid rgba(20, 184, 166, 0.2)' };
        case 'Orion': return { backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.2)' };
        default: return { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
    }
}

function getRoleStyle(role: string): React.CSSProperties {
    switch (role) {
        case 'Driver': return { color: 'var(--destructive)', fontWeight: '700', fontSize: '0.8125rem' };
        case 'Unblock': return { color: '#f59e0b', fontWeight: '700', fontSize: '0.8125rem' };
        case 'Informed': return { color: 'var(--text-secondary)', fontWeight: '400', fontSize: '0.8125rem' };
        default: return { color: 'var(--foreground)', fontSize: '0.8125rem' };
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'green': return '#10b981';
        case 'amber': return '#f59e0b';
        case 'red': return 'var(--destructive)';
        case 'done': return 'var(--text-muted)';
        default: return 'var(--text-secondary)';
    }
}
