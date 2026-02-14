"use client";

import React from 'react';

export const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div style={{ marginBottom: '1.5rem' }}>
        {label && <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', opacity: 0.7 }}>{label}</label>}
        <input
            {...props}
            style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'var(--transition-ease)',
                ...props.style
            }}
        />
    </div>
);

export const Textarea = ({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <div style={{ marginBottom: '1.5rem' }}>
        {label && <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', opacity: 0.7 }}>{label}</label>}
        <textarea
            {...props}
            style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                minHeight: '100px',
                resize: 'vertical',
                transition: 'var(--transition-ease)',
                ...props.style
            }}
        />
    </div>
);

export const Button = ({ children, variant = 'primary', isLoading = false, ...props }: { children: React.ReactNode, variant?: 'primary' | 'secondary', isLoading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        {...props}
        disabled={props.disabled || isLoading}
        style={{
            width: '100%',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'var(--transition-ease)',
            backgroundColor: variant === 'primary' ? 'var(--primary)' : 'transparent',
            color: variant === 'primary' ? 'var(--primary-foreground)' : 'var(--primary)',
            border: variant === 'secondary' ? '1px solid var(--primary)' : 'none',
            cursor: (props.disabled || isLoading) ? 'not-allowed' : 'pointer',
            opacity: (props.disabled || isLoading) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            ...props.style
        }}
    >
        {isLoading && (
            <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid currentColor',
                borderRightColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
        )}
        {children}
        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}} />
    </button>
);
