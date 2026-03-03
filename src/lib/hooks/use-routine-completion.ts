import { Routine } from '@/types';
import { toggleRoutineCompletion } from '@/lib/firebase/routines';
import { User } from 'firebase/auth';

export function useRoutineCompletion(user: User | null) {
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
