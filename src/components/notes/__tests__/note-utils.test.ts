import { describe, it, expect } from 'vitest';
import { parseChecklist, serializeChecklist, ChecklistItem } from '../note-utils';

describe('note-utils', () => {
    describe('parseChecklist', () => {
        it('should return an empty array for empty input', () => {
            expect(parseChecklist('')).toEqual([]);
        });

        it('should parse unchecked items correctly', () => {
            const input = '- [ ] Buy milk';
            const result = parseChecklist(input);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                text: 'Buy milk',
                checked: false
            });
            expect(result[0].id).toBeDefined();
        });

        it('should parse checked items correctly', () => {
            const input = '- [x] Walk the dog';
            const result = parseChecklist(input);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                text: 'Walk the dog',
                checked: true
            });
        });

        it('should handle mixed content', () => {
            const input = '- [ ] First item\n- [x] Second item\nThird item (plain)';
            const result = parseChecklist(input);
            expect(result).toHaveLength(3);
            expect(result[0].checked).toBe(false);
            expect(result[1].checked).toBe(true);
            expect(result[2].checked).toBe(false); // Plain text treated as unchecked
            expect(result[2].text).toBe('Third item (plain)');
        });
    });

    describe('serializeChecklist', () => {
        it('should convert items back to string format', () => {
            const items: ChecklistItem[] = [
                { id: '1', text: 'Item 1', checked: false },
                { id: '2', text: 'Item 2', checked: true }
            ];
            const result = serializeChecklist(items);
            expect(result).toBe('- [ ] Item 1\n- [x] Item 2');
        });
    });
});
