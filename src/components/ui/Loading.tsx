import { Loader2 } from 'lucide-react';


interface LoaderProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Loader({ fullScreen = true, size = 'md', className = '' }: LoaderProps) {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 48
    };

    const content = (
        <div className={`flex items-center justify-center ${className}`} style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: fullScreen ? '100vh' : '100%',
            width: '100%',
            minHeight: fullScreen ? undefined : '100px', // minimal height for inline use
            backgroundColor: fullScreen ? 'var(--background)' : 'transparent'
        }}>
            <Loader2
                className="animate-spin"
                size={sizeMap[size]}
                style={{
                    animation: 'spin 1s linear infinite',
                    color: 'var(--primary)',
                    opacity: 0.8
                }}
            />
            {/* Add keyframes for spin if not using a utility library that provides it globally */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );

    return content;
}
