import { FileText, ListChecks } from "lucide-react";
import styles from "./NoteEditor.module.css";
import { Account } from "@/types";
import AreaSelector from "@/components/ui/AreaSelector";

interface NoteHeaderProps {
    title: string;
    setTitle: (s: string) => void;
    accountId: string;
    setAccountId: (s: string) => void;
    isPinned: boolean;
    setIsPinned: (b: boolean) => void;
    accounts: Account[];
    mode: 'text' | 'checklist';
    setMode: (m: 'text' | 'checklist') => void;
}

export function NoteHeader({
    title, setTitle,
    accountId, setAccountId,
    isPinned, setIsPinned,
    accounts,
    mode = 'text', setMode
}: NoteHeaderProps) {
    return (
        <>
            <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.titleInput}
            />

            <div className={styles.controlsRow}>
                <AreaSelector
                    accounts={accounts}
                    selectedAccountId={accountId}
                    onSelect={(id) => setAccountId(id)}
                    showLabel={false}
                    style={{ marginBottom: 0 }}
                    key="account-selector"
                />

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                    />
                    Pin to top
                </label>

                <div className={styles.modeToggleGroup}>
                    <ModeButton
                        isActive={mode === 'text'}
                        onClick={() => setMode('text')}
                        icon={<FileText size={16} />}
                        label="Text"
                    />
                    <ModeButton
                        isActive={mode === 'checklist'}
                        onClick={() => setMode('checklist')}
                        icon={<ListChecks size={16} />}
                        label="List"
                    />
                </div>
            </div>
        </>
    );
}

function ModeButton({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`${styles.modeButton} ${isActive ? styles.modeButtonActive : ''}`}
        >
            {icon} {label}
        </button>
    );
}
