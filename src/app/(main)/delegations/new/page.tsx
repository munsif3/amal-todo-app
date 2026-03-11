"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { createDelegation } from "@/lib/firebase/delegations";
import DelegationForm from "@/components/delegations/DelegationForm";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function NewDelegationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: any) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const docRef = await createDelegation(user.uid, data);
            router.push(`/delegations/view?id=${docRef.id}`);
        } catch (err) {
            console.error("Failed to create delegation:", err);
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Delegation</h2>
            </header>

            {user && (
                <DelegationForm
                    userId={user.uid}
                    onSubmit={handleSubmit}
                    submitLabel="Create Delegation"
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
