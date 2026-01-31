"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getTask, updateTask } from "@/lib/firebase/tasks";
import { Task } from "@/types";
import { X } from "lucide-react";
import TaskForm from "@/components/tasks/TaskForm";

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

    if (loading) return <div style={{ paddingTop: '2rem', opacity: 0.5 }}>Loading...</div>;
    if (!task) return null;

    return (
        <div style={{ paddingTop: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Edit Action</h2>
                <button onClick={() => router.back()} style={{ opacity: 0.5 }}><X /></button>
            </header>

            {user && (
                <TaskForm
                    userId={user.uid}
                    initialData={task}
                    onSubmit={handleSubmit}
                    submitLabel="Save Changes"
                    isSubmitting={submitting}
                />
            )}
        </div>
    );
}

export default function EditTaskPage() {
    return (
        <Suspense fallback={<div style={{ paddingTop: '2rem', opacity: 0.5 }}>Loading...</div>}>
            <EditTaskContent />
        </Suspense>
    );
}
