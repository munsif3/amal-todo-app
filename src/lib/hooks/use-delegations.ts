import { useState, useEffect, useRef } from 'react';
import { subscribeToDelegations, subscribeToClosedDelegations } from '@/lib/firebase/delegations';
import { Delegation } from '@/types';
import { User } from 'firebase/auth';

/** Computes percent of completed subtasks (0–100). Returns 0 when there are no subtasks. */
export function getDelegationProgress(delegation: Delegation): number {
    if (!delegation.subtasks || delegation.subtasks.length === 0) return 0;
    const done = delegation.subtasks.filter(s => s.isCompleted).length;
    return Math.round((done / delegation.subtasks.length) * 100);
}

export function useDelegations(user: User | null | undefined) {
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [loading, setLoading] = useState(true);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (user) {
            let activeData: Delegation[] = [];
            let closedData: Delegation[] = [];
            loadedRef.current = false;

            const updateState = () => {
                const combined = [...activeData, ...closedData];
                combined.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
                setDelegations(combined);

                if (!loadedRef.current) {
                    loadedRef.current = true;
                    setLoading(false);
                }
            };

            const unsubActive = subscribeToDelegations(user.uid, (items) => {
                activeData = items;
                updateState();
            });

            const unsubClosed = subscribeToClosedDelegations(user.uid, 30, (items) => {
                closedData = items;
                updateState();
            });

            return () => {
                unsubActive();
                unsubClosed();
            };
        } else {
            setDelegations([]);
            setLoading(false);
        }
    }, [user]);

    const activeDelegations = delegations.filter(d => d.status === 'active');
    const reviewDelegations = delegations.filter(d => d.status === 'review');
    const closedDelegations = delegations.filter(d => d.status === 'closed');

    return {
        delegations,
        activeDelegations,
        reviewDelegations,
        closedDelegations,
        loading,
        getDelegationProgress,
    };
}
