import { useState, useRef, useEffect } from "react";
import { format as formatDate, differenceInCalendarDays, nextThursday, addDays } from "date-fns";
import { ArrowUpRight, MoreHorizontal, Edit2, Calendar, Plus } from "lucide-react";
import { Sprint, updateSprint, Epic, updateEpic } from "@/lib/firebase/cockpit";
import { Timestamp } from "firebase/firestore";

interface CockpitHeaderProps {
    sprint: Sprint;
    epics: Epic[];
    onGenerateUpdate: () => void;
}

export default function CockpitHeader({ sprint, epics, onGenerateUpdate }: CockpitHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");

    const [isDatesOpen, setIsDatesOpen] = useState(false);
    const [datesStart, setDatesStart] = useState("");
    const [datesEnd, setDatesEnd] = useState("");

    const [isNewSprintOpen, setIsNewSprintOpen] = useState(false);
    const [newSprintData, setNewSprintData] = useState<{ id: string, start: Date, end: Date } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRenameSprintClick = () => {
        setIsMenuOpen(false);
        setRenameValue(sprint.sprintId);
        setIsRenameOpen(true);
    };

    const submitRename = async () => {
        const newId = renameValue.trim();
        if (newId && newId !== sprint.sprintId) {
            try {
                await updateSprint({ sprintId: newId });
                setIsRenameOpen(false);
            } catch (e) {
                console.error("Error updating sprint ID:", e);
                alert("Failed to update Sprint ID.");
            }
        } else {
            setIsRenameOpen(false);
        }
    };

    const handleUpdateDatesClick = () => {
        setIsMenuOpen(false);
        setDatesStart(formatDate(sprint.startDate.toDate(), "yyyy-MM-dd"));
        setDatesEnd(formatDate(sprint.endDate.toDate(), "yyyy-MM-dd"));
        setIsDatesOpen(true);
    };

    const submitUpdateDates = async () => {
        try {
            const d1 = new Date(datesStart);
            const d2 = new Date(datesEnd);
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                await updateSprint({
                    startDate: Timestamp.fromDate(d1),
                    endDate: Timestamp.fromDate(d2)
                });
                setIsDatesOpen(false);
            } else {
                alert("Invalid date format. Please use YYYY-MM-DD.");
            }
        } catch (e) {
            console.error("Error updating dates:", e);
            alert("Failed to update dates.");
        }
    };

    const handleNewSprintClick = () => {
        setIsMenuOpen(false);

        const now = new Date();
        const nextStart = nextThursday(now);
        const nextEnd = addDays(nextStart, 9);

        const currentNum = parseInt(sprint.sprintId.replace(/\D/g, '')) || 0;
        const newSprintId = `Sprint ${currentNum + 1}`;

        setNewSprintData({ id: newSprintId, start: nextStart, end: nextEnd });
        setIsNewSprintOpen(true);
    };

    const submitNewSprint = async () => {
        if (!newSprintData) return;
        try {
            await updateSprint({
                sprintId: newSprintData.id,
                startDate: Timestamp.fromDate(newSprintData.start),
                endDate: Timestamp.fromDate(newSprintData.end)
            });
            
            // Auto Rollover: Move any incomplete epic to the new sprint
            const incompleteEpics = epics.filter(e => e.status !== 'done');
            if (incompleteEpics.length > 0) {
                await Promise.all(incompleteEpics.map(e => updateEpic(e.id, { sprintId: newSprintData.id })));
            }
            
            setIsNewSprintOpen(false);
        } catch (e) {
            console.error('Error creating new sprint:', e);
            alert('Failed to create new sprint.');
        }
    };

    const today = new Date();
    const startDate = sprint.startDate.toDate();
    const endDate = sprint.endDate.toDate();

    // Day X of 10
    let currentDay = differenceInCalendarDays(today, startDate) + 1;
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
    currentDay = Math.max(1, Math.min(totalDays, currentDay));
    const dayProgress = Math.round((currentDay / totalDays) * 100);

    const formattedStart = formatDate(startDate, "d");
    const formattedEnd = formatDate(endDate, "d MMM");

    return (
        <div className="mobile-col" style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem', paddingRight: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
                        {sprint.sprintId}
                    </h1>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {formattedStart}&ndash;{formattedEnd}
                    </span>
                </div>

                {/* Sprint Day Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '280px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${dayProgress}%`,
                            height: '100%',
                            backgroundColor: dayProgress >= 80 ? '#f59e0b' : 'var(--primary)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Day {currentDay}/{totalDays}
                    </span>
                </div>
            </div>

            <div style={{ position: 'absolute', top: '-0.25rem', right: 0 }} ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ padding: '0.5rem', color: isMenuOpen ? 'var(--foreground)' : 'var(--text-muted)', cursor: 'pointer', background: isMenuOpen ? 'var(--bg-subtle)' : 'none', border: 'none', borderRadius: '8px', transition: 'all var(--transition-ease)' }} 
                        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--foreground)'; if (!isMenuOpen) e.currentTarget.style.background = 'var(--bg-subtle)'; }} 
                        onMouseOut={(e) => { if (!isMenuOpen) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; } }}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    
                    {isMenuOpen && (
                        <div style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            right: 0, 
                            marginTop: '0.5rem', 
                            backgroundColor: 'var(--card-bg)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                            minWidth: '200px', 
                            zIndex: 50,
                            overflow: 'hidden'
                        }}>
                            <button 
                                onClick={() => { setIsMenuOpen(false); onGenerateUpdate(); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '600', textAlign: 'left' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <ArrowUpRight size={16} />
                                <span>Generate update</span>
                            </button>
                            <button 
                                onClick={handleRenameSprintClick}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--foreground)', textAlign: 'left' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Edit2 size={16} color="var(--text-secondary)" />
                                <span>Rename sprint</span>
                            </button>
                            <button 
                                onClick={handleUpdateDatesClick}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--foreground)', textAlign: 'left' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Calendar size={16} color="var(--text-secondary)" />
                                <span>Change dates</span>
                            </button>
                            <button 
                                onClick={handleNewSprintClick}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--foreground)', textAlign: 'left' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Plus size={16} color="var(--text-secondary)" />
                                <span>New sprint</span>
                            </button>
                        </div>
                    )}
                </div>


            {/* Modals */}
            {isRenameOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsRenameOpen(false)}>
                    <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: 'var(--foreground)' }}>Rename Sprint</h2>
                        <input 
                            value={renameValue} 
                            onChange={e => setRenameValue(e.target.value)} 
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)', color: 'var(--foreground)', marginBottom: '1rem' }} 
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setIsRenameOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={submitRename} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: '500' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {isDatesOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsDatesOpen(false)}>
                    <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: 'var(--foreground)' }}>Change Dates</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Start Date</label>
                                <input type="date" value={datesStart} onChange={e => setDatesStart(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)', color: 'var(--foreground)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>End Date</label>
                                <input type="date" value={datesEnd} onChange={e => setDatesEnd(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)', color: 'var(--foreground)' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setIsDatesOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={submitUpdateDates} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: '500' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {isNewSprintOpen && newSprintData && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsNewSprintOpen(false)}>
                    <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--foreground)' }}>Create {newSprintData.id}?</h2>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>This will replace the current sprint across all areas of the cockpit.</p>
                        
                        <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Start</span>
                                <span style={{ color: 'var(--foreground)', fontWeight: '500' }}>{formatDate(newSprintData.start, 'EEE, d MMM yyyy')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>End</span>
                                <span style={{ color: 'var(--foreground)', fontWeight: '500' }}>{formatDate(newSprintData.end, 'EEE, d MMM yyyy')}</span>
                            </div>
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                (10 days, default cycle)
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setIsNewSprintOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={submitNewSprint} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', fontWeight: '500' }}>Create sprint</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
