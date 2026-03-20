import { useState } from "react";
import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { Account, Meeting, UpdateMeetingInput } from "@/types";
import { Input, Button } from "@/components/ui/Form";
import AreaSelector from "@/components/ui/AreaSelector";
import RichTextArea from "@/components/ui/RichTextArea";
import { Video } from "lucide-react";
import { useWarnIfUnsavedChanges } from "@/lib/hooks/use-warn-if-unsaved";
import { createMeeting, updateMeeting } from "@/lib/firebase/meetings";
import { toLocalDatetimeString } from "@/lib/utils/date-helpers";

// --- Types ---
export interface MeetingFormData {
    title: string;
    accountId: string;
    meetingTimeStr: string;
    description: string;
}

export interface MeetingFormPresenterProps {
    initialData?: Partial<Meeting>;
    accounts: Account[];
    defaultTimeStr?: string;
    isSubmitting: boolean;
    onSubmit: (data: MeetingFormData) => void;
    onClose: () => void;
}

// --- DUMB PRESENTER ---
export function MeetingFormPresenter({
    initialData,
    accounts,
    defaultTimeStr,
    isSubmitting,
    onSubmit,
    onClose
}: MeetingFormPresenterProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [description, setDescription] = useState(initialData?.notes?.before || "");

    const [meetingTimeStr, setMeetingTimeStr] = useState(() => {
        if (initialData?.startTime) {
            return toLocalDatetimeString(initialData.startTime.toDate());
        }
        return defaultTimeStr || "";
    });

    const hasUnsavedChanges = title.trim().length > 0 || description.trim().length > 0;
    useWarnIfUnsavedChanges(hasUnsavedChanges);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title, accountId, meetingTimeStr, description
        });
    };

    const handleClose = () => {
        if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideIn 0.3s ease' }}>
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Input
                    placeholder="Meeting subject..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus={!initialData?.id}
                    required
                    style={{ fontSize: '1.5rem', padding: '0.5rem 0', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, background: 'transparent' }}
                />
            </div>

            {/* Start Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ opacity: 0.5 }}><Video size={18} /></span>
                <Input
                    type="datetime-local"
                    value={meetingTimeStr}
                    onChange={(e) => setMeetingTimeStr(e.target.value)}
                    placeholder="Start Time"
                    style={{ flex: 1 }}
                />
            </div>

            {/* Area Selector */}
            <AreaSelector accounts={accounts} selectedAccountId={accountId} onSelect={setAccountId} label="Assign Area" />

            {/* Description/Agenda */}
            <RichTextArea
                value={description}
                onChange={setDescription}
                placeholder="Meeting agenda/notes... (supports **markdown**)"
                minHeight="120px"
            />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" disabled={!title || isSubmitting} isLoading={isSubmitting} style={{ flex: 1 }}>
                    {initialData?.id ? "Save Changes" : "Create Meeting"}
                </Button>
            </div>
        </form>
    );
}

// --- SMART CONTAINER ---
interface MeetingFormProps {
    user: User;
    itemId?: string;
    initialData?: Partial<Meeting>;
    accounts: Account[];
    defaultTimeStr?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MeetingForm({
    user,
    itemId,
    initialData,
    accounts,
    defaultTimeStr,
    onClose,
    onSuccess
}: MeetingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: MeetingFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                title: data.title,
                accountId: data.accountId || null,
                startTime: data.meetingTimeStr ? Timestamp.fromDate(new Date(data.meetingTimeStr)) : Timestamp.now(),
            };

            if (itemId) {
                const updateData: Partial<UpdateMeetingInput> = {
                    title: payload.title,
                    accountId: payload.accountId,
                    startTime: payload.startTime
                };
                if (data.description !== initialData?.notes?.before) {
                    updateData.notes = {
                        before: data.description,
                        during: initialData?.notes?.during || '',
                        after: initialData?.notes?.after || ''
                    };
                }
                await updateMeeting(itemId, updateData);
            } else {
                await createMeeting(user.uid, { 
                    ...payload, 
                    notes: { before: data.description, during: "", after: "" },
                    prepTaskIds: [], 
                    checklist: [] 
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving meeting:", error);
            alert("Failed to save meeting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MeetingFormPresenter
            initialData={initialData}
            accounts={accounts}
            defaultTimeStr={defaultTimeStr}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}
