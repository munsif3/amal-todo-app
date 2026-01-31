import React from 'react';

export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
            backgroundColor: 'var(--background)'
        }}>
            <div className="animate-pulse" style={{ opacity: 0.5 }}>Amal...</div>
        </div>
    );
}
