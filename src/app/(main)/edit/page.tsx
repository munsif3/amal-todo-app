"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, X } from "lucide-react";
import UniversalItemForm from "@/components/universal/UniversalItemForm";
import { getTask, deleteTask } from "@/lib/firebase/tasks";
import { getRoutine, deleteRoutine } from "@/lib/firebase/routines";
import { getMeeting, deleteMeeting } from "@/lib/firebase/meetings";
import { getNote, deleteNote } from "@/lib/firebase/notes";
import Loader from "@/components/ui/Loading";

function EditItemContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get('type') as string;
    const id = searchParams.get('id') as string;

    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleDelete = async () => {
        if (!id || !type) return;
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        const title = data?.title || typeName;
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            if (type === 'task') await deleteTask(id);
            else if (type === 'routine') await deleteRoutine(id);
            else if (type === 'meeting') await deleteMeeting(id);
            else if (type === 'note') await deleteNote(id);
            router.back();
        } catch (e) {
            console.error("Failed to delete item", e);
            setIsDeleting(false);
        }
    };

    if (loading) return <Loader fullScreen={false} className="py-8" />;

    return (
        <div style={{ paddingTop: '1rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title={`Delete this ${type}`}
                        style={{
                            opacity: isDeleting ? 0.5 : 0.6,
                            padding: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: isDeleting ? 'wait' : 'pointer',
                            color: 'var(--destructive)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = isDeleting ? '0.5' : '0.6')}
                    >
                        <Trash2 size={20} />
                    </button>
                    <button onClick={handleClose} style={{ opacity: 0.5, padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
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
