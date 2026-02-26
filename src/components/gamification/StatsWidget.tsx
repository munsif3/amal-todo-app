"use client";

import { useEffect, useState } from "react";
import { UserStats } from "@/types";
import { db } from "@/lib/firebase/client";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { initializeUserStats } from "@/lib/firebase/user_stats";
import { Flame, Star } from "lucide-react";

interface StatsWidgetProps {
    userId: string;
}

export default function StatsWidget({ userId }: StatsWidgetProps) {
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        if (!userId) return;

        let unsubscribe: (() => void) | undefined;

        const setupListener = async () => {
            const statsRef = doc(db, "user_stats", userId);

            try {
                // Ensure the document exists before listening, to prevent permission errors
                // if Firestore rules are strict about reading non-existent docs.
                const snap = await getDoc(statsRef);
                if (!snap.exists()) {
                    await initializeUserStats(userId);
                }

                unsubscribe = onSnapshot(statsRef, (doc) => {
                    if (doc.exists()) {
                        setStats(doc.data() as UserStats);
                    }
                }, (error) => {
                    if (error.code !== 'permission-denied') {
                        console.error("Error listening to user stats:", error);
                    }
                });
            } catch (err: any) {
                if (err.code !== 'permission-denied') {
                    console.error("Failed to initialize stats listener:", err);
                }
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userId]);

    if (!stats) return null;

    return (
        <div className="mobile-no-margin-x mobile-card-padding" style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.75rem 1rem',
            margin: '0 1rem 1rem 1rem',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                <Flame size={18} color="var(--destructive, #ef4444)" style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.4))' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>{stats.currentStreak}</span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, fontWeight: '600' }}>Streak</span>
                </div>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                <Star size={18} color="var(--warning, #eab308)" style={{ filter: 'drop-shadow(0 0 4px rgba(234,179,8,0.4))' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1 }}>{stats.karma}</span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, fontWeight: '600' }}>Karma</span>
                </div>
            </div>
        </div>
    );
}
