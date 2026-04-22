import React from 'react';
import useIDEStore from '../store/useIDEStore';

const BrutalistTitle = ({
    superTitle = "ReragoAliNa",
    mainTitle = "MRSM",
    subTitleLine1 = "TOPOLOGY",
    subTitleLine2 = "ENGINE"
}) => {
    const theme = useIDEStore(state => state.theme);
    const isBrutalist = theme === 'brutalist';

    if (isBrutalist) {
        // Original Brutalist interlocking block style
        return (
            <div className="flex flex-col select-none relative group cursor-default">
                <div className="text-[10px] font-bold tracking-[0.3em] mb-0.5 uppercase pl-1 opacity-80 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-2)' }}>
                    {superTitle}
                </div>
                <div className="flex items-end">
                    <div className="text-5xl font-black leading-[0.85] tracking-tighter" style={{ color: 'var(--color-text-1)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {mainTitle}
                    </div>
                    <div className="ml-1.5 px-2 py-1.5 flex flex-col justify-center translate-y-[2px]" style={{ background: 'var(--color-text-1)', color: 'var(--color-bg)' }}>
                        <span className="font-black text-[9px] leading-tight tracking-[0.2em] uppercase">{subTitleLine1}</span>
                        <span className="font-black text-[9px] leading-tight tracking-[0.2em] uppercase">{subTitleLine2}</span>
                    </div>
                </div>
                <div className="h-[2px] w-full mt-2 relative" style={{ background: 'var(--color-border)' }}>
                    <div className="absolute left-0 top-0 h-full w-1/3" style={{ background: 'var(--color-text-1)' }}></div>
                    <div className="absolute right-0 -top-1 h-1 w-1" style={{ background: 'var(--color-text-1)' }}></div>
                </div>
            </div>
        );
    }

    // Minimalist Swiss typographic lockup
    return (
        <div className="flex flex-col select-none cursor-default">
            <div className="text-[9px] font-medium tracking-[0.25em] mb-1 uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                {superTitle}
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold leading-none tracking-tight" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}>
                    {mainTitle}
                </span>
                <div className="flex flex-col">
                    <span className="text-[9px] font-semibold tracking-[0.2em] uppercase leading-tight" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-3)' }}>{subTitleLine1}</span>
                    <span className="text-[9px] font-semibold tracking-[0.2em] uppercase leading-tight" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-3)' }}>{subTitleLine2}</span>
                </div>
            </div>
            <div className="h-px w-full mt-3 relative" style={{ background: 'var(--color-border)' }}>
                <div className="absolute left-0 top-0 h-full w-8" style={{ background: 'var(--color-primary)' }}></div>
            </div>
        </div>
    );
};

export default BrutalistTitle;
