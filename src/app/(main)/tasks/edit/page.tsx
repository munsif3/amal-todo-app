"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getTask, updateTask, deleteTask } from "@/lib/firebase/tasks";
import { Task } from "@/types";
import { ArrowLeft } from "lucide-react";
import TaskForm from "@/components/tasks/TaskForm";
import Loader from "@/components/ui/Loading";

function EditTaskContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    // const id = "debug";
    const { user } = useAuth();
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        if (!id) {
            router.push("/today");
            return;
        }

        const loadTask = async () => {
            const fetchedTask = await getTask(id);
            if (!fetchedTask) {
                router.push("/today");
                return;
            }
            // Basic permission check
            if (fetchedTask.ownerId !== user.uid) {
                router.push("/today");
                return;
            }
            setTask(fetchedTask);
            setLoading(false);
        };

        loadTask();
    }, [id, user, router]);

    const handleSubmit = async (data: Partial<Task>) => {
        if (!user || !id) return;
        setSubmitting(true);
        try {
            await updateTask(id, data);
            router.push("/today");
        } catch (error) {
            console.error("Error updating task:", error);
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !id || !task) return;

        if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
            setSubmitting(true);
            try {
                await deleteTask(id);
                router.push("/today");
            } catch (error) {
                console.error("Error deleting task:", error);
                alert("Failed to delete task.");
                setSubmitting(false);
            }
        }
    };




    if (loading) return <Loader fullScreen={false} className="py-8" />;
    if (!task) return null;

    return (
        <div style={{ paddingTop: '1rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Edit Action</h2>
            </header>

            {user && (
                <TaskForm
                    userId={user.uid}
                    initialData={task}
                    onSubmit={handleSubmit}
                    onDelete={handleDelete}
                    submitLabel="Save Changes"
                    isSubmitting={submitting}
                />
            )}
        </div>
    );
}

export default function EditTaskPage() {
    return (
        <Suspense fallback={<Loader fullScreen={false} className="py-8" />}>
            <EditTaskContent />
        </Suspense>
    );
}
