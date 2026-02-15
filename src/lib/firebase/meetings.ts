import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./client";
import { Meeting, CreateMeetingInput, UpdateMeetingInput } from "@/types";
import { genericConverter } from "./converters";

const MEETINGS_COLLECTION = "meetings";
const meetingConverter = genericConverter<Meeting>();

export function subscribeToMeetings(userId: string, callback: (meetings: Meeting[]) => void) {
    const q = query(
        collection(db, MEETINGS_COLLECTION).withConverter(meetingConverter),
        where("ownerId", "==", userId),
        orderBy("startTime", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const meetings = snapshot.docs.map((doc) => doc.data());
        callback(meetings);
    });
}

export async function getMeeting(meetingId: string) {
    const docRef = doc(db, MEETINGS_COLLECTION, meetingId).withConverter(meetingConverter);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

export async function createMeeting(userId: string, meetingData: CreateMeetingInput) {
    const newMeeting = {
        ...meetingData,
        ownerId: userId,
        startTime: meetingData.startTime || Timestamp.now(),
        notes: meetingData.notes || { before: '', during: '', after: '' },
        prepTaskIds: meetingData.prepTaskIds || [],
        checklist: meetingData.checklist || [],
        isCompleted: false,
        updatedAt: serverTimestamp(),
    };

    return addDoc(collection(db, MEETINGS_COLLECTION), newMeeting);
}

export async function updateMeeting(meetingId: string, data: UpdateMeetingInput) {
    const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId);
    return updateDoc(meetingRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export async function toggleMeetingCompletion(meetingId: string, isCompleted: boolean) {
    const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId);
    return updateDoc(meetingRef, {
        isCompleted,
        updatedAt: serverTimestamp()
    });
}

export async function deleteMeeting(meetingId: string) {
    const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId);
    return deleteDoc(meetingRef);
}
