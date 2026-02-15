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
            <input value={title} readOnly />
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

describe('NoteEditor Component', () => {
    const mockActions = {
        save: vi.fn(),
        remove: vi.fn(),
        isSaving: false,
        canSave: true,
        lastSavedAt: null,
        isDirty: false,
        error: null,
        dismissError: vi.fn(),
    };

    const mockMetadata = {
        title: 'Test Note',
        setTitle: vi.fn(),
        accountId: 'acc-1',
        setAccountId: vi.fn(),
        isPinned: false,
        setIsPinned: vi.fn(),
        accounts: [],
    };

    const mockModeState = {
        mode: 'text',
        setMode: vi.fn(),
    };

    const mockContentState = {
        content: '',
        setContent: vi.fn(),
    };

    const mockChecklistState = {
        items: [],
        addItem: vi.fn(),
        updateItem: vi.fn(),
        toggleItem: vi.fn(),
        deleteItem: vi.fn(),
        reorderItems: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNoteEditorHook.useNoteEditor as any).mockReturnValue({
            metadata: mockMetadata,
            modeState: mockModeState,
            contentState: mockContentState,
            checklistState: mockChecklistState,
            actions: mockActions,
        });
    });

    it('should render successfully', () => {
        render(<NoteEditor />);
        expect(screen.getByTestId('note-toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('note-header')).toBeInTheDocument();
        expect(screen.getByTestId('text-editor')).toBeInTheDocument();
    });

    it('should switch to checklist editor when mode is checklist', () => {
        (useNoteEditorHook.useNoteEditor as any).mockReturnValue({
            ...useNoteEditorHook.useNoteEditor({}),
            modeState: { ...mockModeState, mode: 'checklist' },
        });

        render(<NoteEditor />);
        expect(screen.getByTestId('checklist-editor')).toBeInTheDocument();
        expect(screen.queryByTestId('text-editor')).not.toBeInTheDocument();
    });

    it('should call save action when save button is clicked', () => {
        render(<NoteEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(mockActions.save).toHaveBeenCalled();
    });

    it('should display error banner when error is present', () => {
        (useNoteEditorHook.useNoteEditor as any).mockReturnValue({
            ...useNoteEditorHook.useNoteEditor({}),
            actions: { ...mockActions, error: 'Failed to save' },
        });

        render(<NoteEditor />);
        expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });
});
