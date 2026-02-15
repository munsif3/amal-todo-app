"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
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
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>New Item</h2>
                <button onClick={handleClose} style={{ opacity: 0.5, padding: '0.5rem' }}>
                    <X />
                </button>
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
