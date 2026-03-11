"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getDelegation, updateDelegation, deleteDelegation } from "@/lib/firebase/delegations";
import DelegationForm from "@/components/delegations/DelegationForm";
import Loader from "@/components/ui/Loading";
import { ArrowLeft } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Delegation } from "@/types";

function EditDelegationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [delegation, setDelegation] = useState<Delegation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const delegationId = searchParams.get("id");

    useEffect(() => {
        if (delegationId) {
            getDelegation(delegationId).then((data) => {
                setDelegation(data);
                setLoading(false);
            });
        }
    }, [delegationId]);

    const handleSubmit = async (data: any) => {
        if (!delegationId) return;
        setIsSubmitting(true);
        try {
            await updateDelegation(delegationId, data);
            router.push(`/delegations/view?id=${delegationId}`);
        } catch (err) {
            console.error("Failed to update delegation:", err);
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!delegationId) return;
        if (confirm("Delete this delegation permanently?")) {
            await deleteDelegation(delegationId);
            router.push("/delegations");
        }
    };

    if (loading) return <Loader fullScreen={false} className="py-8" />;
    if (!delegation) {
        return <p style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Delegation not found.</p>;
    }

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Edit Delegation</h2>
            </header>

            {user && (
                <DelegationForm
                    userId={user.uid}
                    initialData={delegation}
                    onSubmit={handleSubmit}
                    onDelete={handleDelete}
                    submitLabel="Save Changes"
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}

export default function EditDelegationPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <EditDelegationContent />
        </Suspense>
    );
}
