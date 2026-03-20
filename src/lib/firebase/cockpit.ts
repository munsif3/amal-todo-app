import {
    collection,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    FirestoreError,
    QuerySnapshot,
    DocumentSnapshot,
    updateDoc,
    serverTimestamp,
    addDoc
} from 'firebase/firestore';
import { db } from './client';

// --- Types ---

export interface Sprint {
    sprintId: string;
    startDate: Timestamp;
    endDate: Timestamp;
}

export type EpicType = 'OPS' | 'OPUS';
export type EpicTeam = 'Flash' | 'Magellan' | 'Orion';
export type EpicRole = 'Driver' | 'Unblock' | 'Informed';
export type EpicStatus = 'green' | 'amber' | 'red' | 'done';

export interface Epic {
    id: string;
    name: string;
    subTitle?: string;
    type: EpicType;
    team: EpicTeam;
    owner: string;
    myRole: EpicRole;
    status: EpicStatus;
    blocker?: string;
    myAction?: string;
    sprintId: string;
    isReleased?: boolean;
}

export interface Escalation {
    id: string;
    text: string;
    directedAt: 'Chamath' | 'Jonathan';
    sprintId: string;
    resolved: boolean;
    createdAt: Timestamp;
}

// --- Collections ---

const SPRINTS_COLLECTION = 'sprints';
const EPICS_COLLECTION = 'epics';
const ESCALATIONS_COLLECTION = 'escalations';

// --- Listeners ---

export function listenToCurrentSprint(
    onData: (data: Sprint | null) => void,
    onError?: (error: FirestoreError) => void
) {
    const sprintRef = doc(db, SPRINTS_COLLECTION, 'current');

    return onSnapshot(sprintRef, (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            onData({
                sprintId: data.sprintId,
                startDate: data.startDate,
                endDate: data.endDate
            });
        } else {
            onData(null);
        }
    }, onError);
}

export function listenToSprintEpics(
    sprintId: string,
    onData: (epics: Epic[]) => void,
    onError?: (error: FirestoreError) => void
) {
    const epicsRef = collection(db, EPICS_COLLECTION);
    const q = query(epicsRef, where("sprintId", "==", sprintId));

    return onSnapshot(q, (snapshot: QuerySnapshot) => {
        const epics: Epic[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                subTitle: data.subTitle,
                type: data.type as EpicType,
                team: data.team as EpicTeam,
                owner: data.owner,
                myRole: data.myRole as EpicRole,
                status: data.status as EpicStatus,
                blocker: data.blocker,
                myAction: data.myAction,
                sprintId: data.sprintId,
                isReleased: data.isReleased || false,
            };
        });
        onData(epics);
    }, onError);
}

export function listenToSprintEscalations(
    sprintId: string,
    onData: (escalations: Escalation[]) => void,
    onError?: (error: FirestoreError) => void
) {
    const escalationsRef = collection(db, ESCALATIONS_COLLECTION);
    const q = query(
        escalationsRef,
        where("sprintId", "==", sprintId),
        orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot: QuerySnapshot) => {
        const escalations: Escalation[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                text: data.text,
                directedAt: data.directedAt as 'Chamath' | 'Jonathan',
                sprintId: data.sprintId,
                resolved: data.resolved || false,
                createdAt: data.createdAt
            };
        });
        onData(escalations);
    }, onError);
}

// --- Writes ---

export async function updateEpic(epicId: string, data: Partial<Epic>) {
    const epicRef = doc(db, EPICS_COLLECTION, epicId);
    await updateDoc(epicRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export async function addEpic(epicData: Omit<Epic, 'id' | 'sprintId'>, sprintId: string) {
    const epicsRef = collection(db, EPICS_COLLECTION);
    await addDoc(epicsRef, {
        ...epicData,
        sprintId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

export async function addEscalation(text: string, directedAt: 'Chamath' | 'Jonathan', sprintId: string) {
    const escRef = collection(db, ESCALATIONS_COLLECTION);
    await addDoc(escRef, {
        text,
        directedAt,
        sprintId,
        resolved: false,
        createdAt: serverTimestamp()
    });
}

export async function resolveEscalation(escalationId: string) {
    const escRef = doc(db, ESCALATIONS_COLLECTION, escalationId);
    await updateDoc(escRef, {
        resolved: true
    });
}

export async function updateSprint(data: Partial<Sprint>) {
    const sprintRef = doc(db, SPRINTS_COLLECTION, 'current');
    await updateDoc(sprintRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
}
