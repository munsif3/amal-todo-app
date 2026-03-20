import { useState } from "react";
import { addEpic, EpicType, EpicTeam, EpicRole, EpicStatus } from "@/lib/firebase/cockpit";
import { X } from "lucide-react";

interface AddEpicPanelProps {
    sprintId: string;
    onClose: () => void;
}

export default function AddEpicPanel({ sprintId, onClose }: AddEpicPanelProps) {
    const [name, setName] = useState("");
    const [subTitle, setSubTitle] = useState("");
    const [type, setType] = useState<EpicType>("OPUS");
    const [team, setTeam] = useState<EpicTeam>("Flash");
    const [owner, setOwner] = useState("");
    const [myRole, setMyRole] = useState<EpicRole>("Informed");
    const [status, setStatus] = useState<EpicStatus>("green");
    const [blocker, setBlocker] = useState("");
    const [myAction, setMyAction] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await addEpic({
                name,
                subTitle,
                type,
                team,
                owner: owner || "Unassigned",
                myRole,
                status,
                blocker,
                myAction
            }, sprintId);
            onClose();
        } catch (error) {
            console.error("Error adding epic:", error);
            setIsSubmitting(false);
        }
    };

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
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Create New Epic</h3>
                <button 
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ fontSize: '1.5rem', fontWeight: '700', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', width: '100%', paddingBottom: '0.5rem' }}
                        placeholder="Epic Name *"
                        required
                        autoFocus
                    />
                    <input 
                        value={subTitle}
                        onChange={e => setSubTitle(e.target.value)}
                        style={{ fontSize: '1rem', color: 'var(--foreground)', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', width: '100%', paddingBottom: '0.5rem' }}
                        placeholder="Subtitle (optional)"
                    />
                </div>

                <div className="epic-detail-grid">
                    <label style={labelStyle}>Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} style={selectStyle}>
                        <option value="OPUS">OPUS</option>
                        <option value="OPS">OPS</option>
                    </select>

                    <label style={labelStyle}>Team</label>
                    <select value={team} onChange={e => setTeam(e.target.value as any)} style={selectStyle}>
                        <option value="Flash">Flash</option>
                        <option value="Magellan">Magellan</option>
                        <option value="Orion">Orion</option>
                    </select>

                    <label style={labelStyle}>Owner</label>
                    <input 
                        value={owner}
                        onChange={e => setOwner(e.target.value)}
                        style={inputStyle}
                        placeholder="Owner Name"
                    />

                    <label style={labelStyle}>My Role</label>
                    <select value={myRole} onChange={e => setMyRole(e.target.value as any)} style={selectStyle}>
                        <option value="Informed">Informed</option>
                        <option value="Unblock">Unblock</option>
                        <option value="Driver">Driver</option>
                    </select>

                    <label style={labelStyle}>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as any)} style={selectStyle}>
                        <option value="green">Green (On Track)</option>
                        <option value="amber">Amber (At Risk)</option>
                        <option value="red">Red (Blocked)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={labelStyle}>Blocker</label>
                    <textarea 
                        value={blocker}
                        onChange={e => setBlocker(e.target.value)}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="Current blockers..."
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={labelStyle}>My Action</label>
                    <textarea 
                        value={myAction}
                        onChange={e => setMyAction(e.target.value)}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="My next actions..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={!name.trim() || isSubmitting} style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: name.trim() && !isSubmitting ? 'pointer' : 'not-allowed', opacity: name.trim() && !isSubmitting ? 1 : 0.5 }}>
                        {isSubmitting ? 'Saving...' : 'Add Epic'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase'
};

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
