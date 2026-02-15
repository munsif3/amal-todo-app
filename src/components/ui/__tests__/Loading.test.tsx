import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading Component', () => {
    it('should render successfully', () => {
        const { container } = render(<Loading />);
        expect(container).toBeInTheDocument();
    });

    it('should display the loading spinner', () => {
        // Since Loader2 is an SVG, we can check if an SVG is present or check for the class
        const { container } = render(<Loading />);
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('should apply full-screen styles by default', () => {
        const { container } = render(<Loading />);
        // The outer div has styles applied directly
        const outerDiv = container.firstChild as HTMLElement;
        expect(outerDiv.style.height).toBe('100vh');
    });

    it('should apply inline styles when fullScreen is false', () => {
        const { container } = render(<Loading fullScreen={false} />);
        const outerDiv = container.firstChild as HTMLElement;
        expect(outerDiv.style.height).toBe('100%');
        expect(outerDiv.style.minHeight).toBe('100px');
    });
});
