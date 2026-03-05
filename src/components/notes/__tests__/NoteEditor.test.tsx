import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteEditor from '../NoteEditor';
import * as useNoteEditorHook from '../useNoteEditor';

// Mock dependencies
vi.mock('../../../lib/firebase/client', () => ({
    auth: {},
    db: {},
    app: {},
}));
vi.mock('../useNoteEditor');
vi.mock('react-to-print', () => ({
    useReactToPrint: () => vi.fn(),
}));
vi.mock('next/navigation', () => ({
    useRouter: () => ({ back: vi.fn() }),
}));

// Mock child components to simplify testing
vi.mock('../NoteToolbar', () => ({
    NoteToolbar: ({ onSave, isSaving, error }: any) => (
        <div data-testid="note-toolbar">
            <button onClick={onSave} disabled={isSaving}>Save</button>
            {error && <div data-testid="error-banner">{error}</div>}
        </div>
    ),
}));
vi.mock('../NoteHeader', () => ({
    NoteHeader: ({ title, mode, setMode }: any) => (
        <div data-testid="note-header">
            <input value={title} readOnly data-testid="note-title-input" />
            <button onClick={() => setMode(mode === 'text' ? 'checklist' : 'text')}>
                Switch Mode
            </button>
        </div>
    ),
}));
vi.mock('../TextEditor', () => ({
    TextEditor: () => <div data-testid="text-editor">Text Editor</div>,
}));
vi.mock('../ChecklistEditor', () => ({
    ChecklistEditor: () => <div data-testid="checklist-editor">Checklist Editor</div>,
}));

/** A complete, valid mock return value for useNoteEditor */
const buildMockHookReturn = (overrides: Record<string, unknown> = {}) => ({
    metadata: {
        title: 'Test Note',
        setTitle: vi.fn(),
        accountId: 'acc-1',
        setAccountId: vi.fn(),
        isPinned: false,
        setIsPinned: vi.fn(),
        accounts: [],
        ...((overrides.metadata as object) ?? {}),
    },
    modeState: {
        mode: 'text',
        setMode: vi.fn(),
        ...((overrides.modeState as object) ?? {}),
    },
    contentState: {
        content: '',
        setContent: vi.fn(),
        ...((overrides.contentState as object) ?? {}),
    },
    checklistState: {
        items: [],
        addItem: vi.fn(),
        updateItem: vi.fn(),
        toggleItem: vi.fn(),
        deleteItem: vi.fn(),
        reorderItems: vi.fn(),
        ...((overrides.checklistState as object) ?? {}),
    },
    actions: {
        save: vi.fn(),
        remove: vi.fn(),
        isSaving: false,
        canSave: true,
        lastSavedAt: null,
        isDirty: false,
        error: null,
        dismissError: vi.fn(),
        ...((overrides.actions as object) ?? {}),
    },
});

describe('NoteEditor Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useNoteEditorHook.useNoteEditor as ReturnType<typeof vi.fn>).mockReturnValue(
            buildMockHookReturn()
        );
    });

    it('renders the toolbar and header in text mode', () => {
        render(<NoteEditor />);
        expect(screen.getByTestId('note-toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('note-header')).toBeInTheDocument();
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
        expect(screen.queryByTestId('checklist-editor')).not.toBeInTheDocument();
    });

    it('renders ChecklistEditor when mode is checklist', () => {
        (useNoteEditorHook.useNoteEditor as ReturnType<typeof vi.fn>).mockReturnValue(
            buildMockHookReturn({ modeState: { mode: 'checklist', setMode: vi.fn() } })
        );

        render(<NoteEditor />);
        expect(screen.getByTestId('checklist-editor')).toBeInTheDocument();
        expect(screen.queryByTestId('text-editor')).not.toBeInTheDocument();
    });

    it('calls save action when save button is clicked', () => {
        const saveFn = vi.fn();
        (useNoteEditorHook.useNoteEditor as ReturnType<typeof vi.fn>).mockReturnValue(
            buildMockHookReturn({ actions: { save: saveFn, isSaving: false, canSave: true, lastSavedAt: null, isDirty: false, error: null, dismissError: vi.fn(), remove: vi.fn() } })
        );

        render(<NoteEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('shows error banner when error is present', () => {
        (useNoteEditorHook.useNoteEditor as ReturnType<typeof vi.fn>).mockReturnValue(
            buildMockHookReturn({ actions: { save: vi.fn(), remove: vi.fn(), isSaving: false, canSave: true, lastSavedAt: null, isDirty: false, error: 'Failed to save', dismissError: vi.fn() } })
        );

        render(<NoteEditor />);
        // The error banner is rendered inline in NoteEditor (not via NoteToolbar mock)
        expect(screen.getByText('Failed to save')).toBeInTheDocument();
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('disables the save button while saving', () => {
        (useNoteEditorHook.useNoteEditor as ReturnType<typeof vi.fn>).mockReturnValue(
            buildMockHookReturn({ actions: { save: vi.fn(), remove: vi.fn(), isSaving: true, canSave: false, lastSavedAt: null, isDirty: true, error: null, dismissError: vi.fn() } })
        );

        render(<NoteEditor />);
        expect(screen.getByText('Save')).toBeDisabled();
    });

    it('renders the note title in the header input', () => {
        (useNoteEditorHook.useNoteEditor as ReturnType<typeof vi.fn>).mockReturnValue(
            buildMockHookReturn({ metadata: { title: 'My Special Note', setTitle: vi.fn(), accountId: '', setAccountId: vi.fn(), isPinned: false, setIsPinned: vi.fn(), accounts: [] } })
        );

        render(<NoteEditor />);
        expect(screen.getByDisplayValue('My Special Note')).toBeInTheDocument();
    });
});
