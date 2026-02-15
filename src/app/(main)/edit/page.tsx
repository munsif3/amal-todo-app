"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import UniversalItemForm from "@/components/universal/UniversalItemForm";
import { getTask } from "@/lib/firebase/tasks";
import { getRoutine } from "@/lib/firebase/routines";
import { getMeeting } from "@/lib/firebase/meetings";
import { getNote } from "@/lib/firebase/notes";
import Loader from "@/components/ui/Loading";

function EditItemContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get('type') as string;
    const id = searchParams.get('id') as string;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !type) return;

            let item = null;
            try {
                if (type === 'task') item = await getTask(id);
                else if (type === 'routine') item = await getRoutine(id);
                else if (type === 'meeting') item = await getMeeting(id);
                else if (type === 'note') item = await getNote(id);
            } catch (e) {
                console.error("Failed to fetch item", e);
            }

            if (item) {
                setData(item);
            }
            setLoading(false);
        };
        fetchData();
    }, [type, id]);

    const handleClose = () => {
        router.back();
    };

    const handleSuccess = () => {
        router.back();
    };

    if (loading) return <Loader fullScreen={false} className="py-8" />;

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                <button onClick={handleClose} style={{ opacity: 0.5, padding: '0.5rem' }}>
                    <X />
                </button>
            </header>

            {data && (
                <UniversalItemForm
                    initialMode={type.toUpperCase() as any}
                    initialData={data}
                    itemId={id}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

export default function EditItemPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <EditItemContent />
        </Suspense>
    );
}
