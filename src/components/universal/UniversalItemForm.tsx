"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeToAccounts } from "@/lib/firebase/accounts";
import { subscribeToUserProfile } from "@/lib/firebase/user_profile";
import { listenToCurrentSprint, listenToSprintEpics, Epic as CockpitEpic } from "@/lib/firebase/cockpit";
import { Account, UserProfile } from "@/types";

import TaskForm from "./forms/TaskForm";
import RoutineForm from "./forms/RoutineForm";
import MeetingForm from "./forms/MeetingForm";
import DelegationForm from "./forms/DelegationForm";
import NoteForm from "./forms/NoteForm";
import { buildDefaultDatetimeString } from "@/lib/utils/date-helpers";

type CaptureMode = 'TASK' | 'ROUTINE' | 'MEETING' | 'NOTE' | 'DELEGATION';

interface UniversalItemFormProps {
    onClose?: () => void;
    onSuccess?: () => void;
    initialMode?: CaptureMode;
    initialData?: any;
    itemId?: string;
}

function UniversalItemFormInner({
    onClose = () => {},
    onSuccess = () => {},
    initialMode = 'TASK',
    initialData,
    itemId
}: UniversalItemFormProps) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    
    // Determine mode routing
    const [mode, setMode] = useState<CaptureMode>(() => {
        if (!itemId) {
            const qMode = searchParams?.get('mode') as CaptureMode;
            if (qMode && ['TASK', 'ROUTINE', 'MEETING', 'NOTE', 'DELEGATION'].includes(qMode)) return qMode;
        }
        return initialMode;
    });

    // Shared Data Fetching (Smart Container level)
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [availableEpics, setAvailableEpics] = useState<CockpitEpic[]>([]);
    const [defaultTimeStr, setDefaultTimeStr] = useState("09:30");
    const [defaultDeadlineStr, setDefaultDeadlineStr] = useState(() => buildDefaultDatetimeString(0, '09:30'));

    // Subscriptions
    useEffect(() => {
        if (user) {
            return subscribeToAccounts(user.uid, setAccounts);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        return subscribeToUserProfile(user.uid, (profile) => {
            setUserProfile(profile);
            if (profile && !itemId) {
                const dt = profile.preferences?.defaultTaskTime || '09:30';
                const timeStr = dt.includes('T') ? dt.split('T')[1].slice(0, 5) : dt;
                setDefaultTimeStr(timeStr);
                setDefaultDeadlineStr(buildDefaultDatetimeString(0, timeStr));
            }
        });
    }, [user, itemId]);

    useEffect(() => {
        const unsubSprint = listenToCurrentSprint((sprint) => {
            if (!sprint) {
                setAvailableEpics([]);
                return;
            }
            const unsubEpics = listenToSprintEpics(sprint.sprintId, setAvailableEpics);
            (unsubSprint as any).__innerUnsub = unsubEpics;
        });
        return () => {
            unsubSprint();
            if ((unsubSprint as any).__innerUnsub) (unsubSprint as any).__innerUnsub();
        };
    }, []);

    if (!user) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
            
            {/* Mode Selection (Radio Buttons — new items only) */}
            {!itemId && (
                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0', opacity: 0.9 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'TASK'}
                            onChange={() => setMode('TASK')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>One-off</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'ROUTINE'}
                            onChange={() => setMode('ROUTINE')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Routine</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'MEETING'}
                            onChange={() => setMode('MEETING')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Meeting</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
                        <input
                            type="radio"
                            name="itemMode"
                            checked={mode === 'DELEGATION'}
                            onChange={() => setMode('DELEGATION')}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Delegation</span>
                    </label>
                </div>
            )}

            {/* Sub-form Routing */}
            {mode === 'TASK' && (
                <TaskForm 
                    user={user} itemId={itemId} initialData={initialData} 
                    accounts={accounts} availableEpics={availableEpics} defaultDeadlineStr={defaultDeadlineStr}
                    onClose={onClose} onSuccess={onSuccess} 
                />
            )}
            
            {mode === 'ROUTINE' && (
                <RoutineForm 
                    user={user} itemId={itemId} initialData={initialData} 
                    accounts={accounts} defaultTime={defaultTimeStr}
                    onClose={onClose} onSuccess={onSuccess} 
                />
            )}

            {mode === 'MEETING' && (
                <MeetingForm 
                    user={user} itemId={itemId} initialData={initialData} 
                    accounts={accounts} defaultTimeStr={defaultDeadlineStr}
                    onClose={onClose} onSuccess={onSuccess} 
                />
            )}

            {mode === 'DELEGATION' && (
                <DelegationForm 
                    user={user} itemId={itemId} initialData={initialData} 
                    accounts={accounts} defaultDeadlineStr={defaultDeadlineStr}
                    onClose={onClose} onSuccess={onSuccess} 
                />
            )}

            {mode === 'NOTE' && (
                <NoteForm 
                    user={user} itemId={itemId} initialData={initialData} 
                    accounts={accounts}
                    onClose={onClose} onSuccess={onSuccess} 
                />
            )}
        </div>
    );
}

export default function UniversalItemForm(props: UniversalItemFormProps) {
    return (
        <Suspense fallback={null}>
            <UniversalItemFormInner {...props} />
        </Suspense>
    );
}
