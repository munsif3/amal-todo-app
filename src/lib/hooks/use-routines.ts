import { useState, useEffect } from 'react';
import { subscribeToRoutines } from "@/lib/firebase/routines";
import { Routine } from "@/types";
import { User } from 'firebase/auth';

export function useRoutines(user: User | null | undefined, searchQuery: string = "") {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);

    const todayDate = new Date();
    const currentDayIdx = todayDate.getDay(); // 0-6
    const currentMonthDay = todayDate.getDate(); // 1-31

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToRoutines(user.uid, (fetchedRoutines) => {
                setRoutines(fetchedRoutines);
                if (loading) setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setRoutines([]);
            setLoading(false);
        }
    }, [user]);

    const filterItem = (text: string) => text.toLowerCase().includes(searchQuery.toLowerCase());

    const todaysRoutines = routines.filter(r => {
        // Search filter
        if (!filterItem(r.title)) return false;

        // Monthly
        if (r.schedule === 'monthly') {
            return r.monthDay === currentMonthDay;
        }
        // Specific Days
        if (r.days && r.days.length > 0) {
            return r.days.includes(currentDayIdx);
        }
        // Legacy/Default Daily
        if (r.schedule === 'daily' || !r.schedule) return true;

        return true;
    });

    return {
        routines,
        todaysRoutines,
        loading
    };
}
