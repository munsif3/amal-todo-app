"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import UniversalItemForm from "@/components/universal/UniversalItemForm";
import { Suspense } from "react";
import Loader from "@/components/ui/Loading";

function AddItemContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modeParam = searchParams.get('mode');

    // Map param to valid mode or default
    const validModes = ['TASK', 'ROUTINE', 'MEETING', 'NOTE'];
    const initialMode = (modeParam && validModes.includes(modeParam.toUpperCase()))
        ? modeParam.toUpperCase() as any
        : 'TASK';

    const handleClose = () => {
        router.back();
    };

    const handleSuccess = () => {
        router.back();
    };

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Item</h2>
            </header>

            <UniversalItemForm
                initialMode={initialMode}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}

export default function AddItemPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <AddItemContent />
        </Suspense>
    );
}
