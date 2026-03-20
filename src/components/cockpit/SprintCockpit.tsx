"use client";

import { useEffect, useState } from "react";
import CockpitSkeleton from "./CockpitSkeleton";
import CockpitHeader from "./CockpitHeader";
import SummaryBar from "./SummaryBar";
import FilterTabs, { FilterValue } from "./FilterTabs";
import EpicTable from "./EpicTable";
import TeamPulse from "./TeamPulse";
import NeedsFromLeadership from "./NeedsFromLeadership";
import UpdateGenerator from "./UpdateGenerator";
import AddEpicPanel from "./AddEpicPanel";
import EpicDetailPanel from "./EpicDetailPanel";
import TodaysWorkTasks from "./TodaysWorkTasks";
import { 
    Sprint, Epic, Escalation
} from "@/lib/firebase/cockpit";
import { useCockpitData } from "@/lib/hooks/useCockpitData";

export default function SprintCockpit() {
    const { user, sprint, epics, activeEscalations, epicTaskProgress, loading, error } = useCockpitData();

    const [currentFilter, setCurrentFilter] = useState<FilterValue>('All');
    const [showGenerator, setShowGenerator] = useState(false);
    const [showAddEpic, setShowAddEpic] = useState(false);
    const [editingEpic, setEditingEpic] = useState<Epic | null>(null);

    const handleGenerateUpdate = () => {
        setShowGenerator(true);
    };

    if (error) {
        return <div style={{ padding: '2rem', color: 'var(--destructive)' }}>Error loading sprint data: {error.message}</div>;
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                <CockpitSkeleton />
            </div>
        );
    }

    if (!sprint) {
        return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No active sprint found.</div>;
    }

    // Filter Logic
    const filteredEpics = epics.filter(epic => {
        if (currentFilter === 'All') return true;
        if (currentFilter === 'OPUS') return epic.type === 'OPUS';
        if (currentFilter === 'OPS') return epic.type === 'OPS';
        if (currentFilter === 'Flash') return epic.team === 'Flash';
        if (currentFilter === 'Magellan') return epic.team === 'Magellan';
        if (currentFilter === 'Orion') return epic.team === 'Orion';
        if (currentFilter === 'Needs me') {
            return epic.myRole === 'Driver' || epic.myRole === 'Unblock' || epic.status === 'red';
        }
        return true;
    });



    return (
        <div style={{ paddingBottom: '6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <CockpitHeader 
                    sprint={sprint} 
                    epics={epics}
                    onGenerateUpdate={handleGenerateUpdate} 
                />
                
                <SummaryBar epics={epics} />
                
                <FilterTabs 
                    currentFilter={currentFilter} 
                    onFilterChange={setCurrentFilter} 
                />
                
                <EpicTable 
                    epics={filteredEpics} 
                    onRowClick={setEditingEpic}
                    onAddEpicClick={() => setShowAddEpic(true)}
                    epicTaskProgress={epicTaskProgress}
                />
                
                <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem', borderTop: '1px solid var(--border)' }}>
                    <TeamPulse epics={epics} />
                    <NeedsFromLeadership escalations={activeEscalations} sprintId={sprint.sprintId} />
                </div>
            </div>
            
            {showGenerator && (
                <UpdateGenerator 
                    sprint={sprint} 
                    epics={epics} 
                    escalations={activeEscalations} 
                    onClose={() => setShowGenerator(false)} 
                />
            )}

            {showAddEpic && (
                <AddEpicPanel 
                    sprintId={sprint.sprintId}
                    onClose={() => setShowAddEpic(false)}
                />
            )}

            {editingEpic && (
                <EpicDetailPanel
                    epic={editingEpic}
                    onClose={() => setEditingEpic(null)}
                />
            )}
        </div>
    );
}
