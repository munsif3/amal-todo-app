import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { 
    Sprint, Epic, Escalation,
    listenToCurrentSprint, listenToSprintEpics, listenToSprintEscalations 
} from "@/lib/firebase/cockpit";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export function useCockpitData() {
    const { user } = useAuth();
    
    const [sprint, setSprint] = useState<Sprint | null>(null);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [escalations, setEscalations] = useState<Escalation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [epicTaskProgress, setEpicTaskProgress] = useState<Record<string, { done: number; total: number }>>({}); 

    // 1. Fetch current sprint
    useEffect(() => {
        const unsubscribeSprint = listenToCurrentSprint(
            (sprintData) => {
                setSprint(sprintData);
                if (!sprintData) {
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Sprint listen error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribeSprint();
    }, []);

    // 2. Fetch epics & escalations for the sprint
    useEffect(() => {
        if (!sprint?.sprintId) return;

        const unsubscribeEpics = listenToSprintEpics(
            sprint.sprintId,
            (epicsData) => {
                setEpics(epicsData);
                setLoading(false);
            },
            (err) => console.error("Epics listen error:", err)
        );

        const unsubscribeEscalations = listenToSprintEscalations(
            sprint.sprintId,
            (escData) => setEscalations(escData),
            (err) => console.error("Escalations error:", err)
        );

        return () => {
            unsubscribeEpics();
            unsubscribeEscalations();
        };
    }, [sprint?.sprintId]);

    // 3. Roll up task progress for Epics
    useEffect(() => {
        if (!user) return;
        const epicIds = epics.map(e => e.id).filter(Boolean);
        if (epicIds.length === 0) {
            setEpicTaskProgress({});
            return;
        }

        const q = query(
            collection(db, 'tasks'),
            where('ownerId', '==', user.uid),
            where('epicId', 'in', epicIds)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const progress: Record<string, { done: number; total: number }> = {};
            epicIds.forEach(id => { progress[id] = { done: 0, total: 0 }; });

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const eid = data.epicId as string;
                if (progress[eid]) {
                    progress[eid].total++;
                    if (data.status === 'done') progress[eid].done++;
                }
            });
            setEpicTaskProgress(progress);
        });

        return () => unsub();
    }, [user, epics]);

    // Active escalations only for Need From Leadership view
    const activeEscalations = escalations.filter(e => !e.resolved);

    return {
        user,
        sprint,
        epics,
        activeEscalations,
        epicTaskProgress,
        loading,
        error
    };
}
