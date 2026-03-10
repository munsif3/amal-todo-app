"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import UniversalItemForm from "@/components/universal/UniversalItemForm";
import Loader from "@/components/ui/Loading";

function NewItemContent() {
    const router = useRouter();

    const handleClose = () => {
        router.back();
    };

    const handleSuccess = () => {
        router.push("/today");
    };

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Item</h2>
            </header>

            {/* UniversalItemForm reads ?mode= internally via useSearchParams */}
            <UniversalItemForm
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}

export default function NewItemPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <NewItemContent />
        </Suspense>
    );
}

