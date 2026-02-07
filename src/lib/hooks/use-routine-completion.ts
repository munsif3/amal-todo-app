import { useState } from 'react';
import { Routine } from '@/types';
import { toggleRoutineCompletion } from '@/lib/firebase/routines';

export function useRoutineCompletion(user: any) {
    const todayStr = new Date().toISOString().split('T')[0];

    const isRoutineCompletedToday = (routine: Routine) => {
        if (!user) return false;
        return routine.completionLog?.[todayStr]?.[user.uid] || false;
    };

    const toggleCompletion = async (routine: Routine) => {
        if (!user) return;
        const isCompleted = isRoutineCompletedToday(routine);
        await toggleRoutineCompletion(routine.id, user.uid, todayStr, !isCompleted);
    };

    return {
        isRoutineCompletedToday,
        toggleCompletion,
        todayStr
    };
}
