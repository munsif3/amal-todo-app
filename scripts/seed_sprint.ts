import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    console.log("Seeding sprint data...");

    const sprintId = "S-26";
    const today = new Date();
    // 2 days ago
    const start = new Date(today);
    start.setDate(today.getDate() - 1);
    // 8 days from now
    const end = new Date(today);
    end.setDate(today.getDate() + 8);

    // 1. Set current sprint
    await setDoc(doc(db, "sprints", "current"), {
        sprintId,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end)
    });
    console.log("Created sprints/current");

    // 2. Add some test epics
    const epicsRef = collection(db, "epics");
    const testEpics = [
        {
            name: "Buy American filter",
            subTitle: "Catalog search page",
            type: "OPUS",
            team: "Flash",
            owner: "Arkam",
            myRole: "Unblock",
            status: "amber",
            blocker: "—",
            myAction: "Review gate mid-sprint",
            sprintId
        },
        {
            name: "Sysco Commerce #1",
            subTitle: "Platform API dependency",
            type: "OPUS",
            team: "Flash",
            owner: "Sadeep",
            myRole: "Unblock",
            status: "amber",
            blocker: "Platform API not confirmed",
            myAction: "Escalate to Platform EM",
            sprintId
        },
        {
            name: "Sysco Commerce #2",
            type: "OPUS",
            team: "Flash",
            owner: "Sachini",
            myRole: "Informed",
            status: "green",
            sprintId
        },
        {
            name: "Sysco Commerce #3",
            type: "OPUS",
            team: "Flash",
            owner: "Buwaneka",
            myRole: "Informed",
            status: "green",
            sprintId
        },
        {
            name: "Sysco Commerce #4",
            type: "OPUS",
            team: "Orion",
            owner: "Prasad",
            myRole: "Informed",
            status: "green",
            sprintId
        },
        {
            name: "GRS Multi-market",
            subTitle: "Staging deployed",
            type: "OPS",
            team: "Flash",
            owner: "Jose",
            myRole: "Informed",
            status: "green",
            blocker: "—",
            myAction: "Confirm prod date",
            sprintId
        },
        {
            name: "Open feature wrapper",
            subTitle: "Migration",
            type: "OPS",
            team: "Flash",
            owner: "Sadeep",
            myRole: "Driver",
            status: "red",
            blocker: "Scope decision needed",
            myAction: "Raise with Jonathan",
            sprintId
        },
        {
            name: "Magellan epic",
            subTitle: "Assign epic name",
            type: "OPUS",
            team: "Magellan",
            owner: "Vinay",
            myRole: "Informed",
            status: "amber",
            blocker: "Pending Vinay update",
            myAction: "Chase Vinay by Wed",
            sprintId
        }
    ];

    for (const epic of testEpics) {
        await addDoc(epicsRef, epic);
    }
    console.log(`Created ${testEpics.length} test epics`);

    // 3. Add escalations
    const escalationsRef = collection(db, "escalations");
    const testEscalations = [
        {
            text: "Scope decision on Open Feature Wrapper migration — unblocking Sadeep",
            directedAt: "Jonathan",
            sprintId,
            createdAt: Timestamp.now()
        },
        {
            text: "Confirm Platform team API timeline for Sysco Commerce #1",
            directedAt: "Chamath",
            sprintId,
            createdAt: Timestamp.fromDate(new Date(Date.now() + 1000)) // ensure order
        }
    ];

    for (const esc of testEscalations) {
        await addDoc(escalationsRef, esc);
    }
    console.log(`Created ${testEscalations.length} test escalations`);

    console.log("Seeding complete! You can exit the script now.");
    process.exit(0);
}

seed().catch(console.error);
