"use client";

import { useEffect, useRef, useState } from "react";

interface DropdownProps {
    label: string;
    value?: string;
    options: { value: string; label: string }[];
    onChange?: (value: string) => void;
    width?: number;
}

export function Dropdown({ label, value, options, onChange, width = 160 }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const display = value ? (options.find(o => o.value === value)?.label ?? label) : label;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors whitespace-nowrap"
            >
                {display}
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div
                    className="absolute top-full mt-1 right-0 z-30 rounded-md bg-[#161b22] border border-[#30363d] shadow-[0_8px_24px_rgba(0,0,0,0.5)] py-1"
                    style={{ minWidth: width }}
                >
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onChange?.(opt.value);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11.5px] flex items-center justify-between hover:bg-[#21262d] transition-colors ${value === opt.value ? "text-[#58a6ff]" : "text-[#e6edf3]"
                                }`}
                        >
                            <span>{opt.label}</span>
                            {value === opt.value && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

interface MultiSelectDropdownProps {
    label: string;
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    width?: number;
}

export function MultiSelectDropdown({ label, options, selected, onChange, width = 180 }: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const toggle = (v: string) => {
        if (selected.includes(v)) onChange(selected.filter(s => s !== v));
        else onChange([...selected, v]);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors whitespace-nowrap"
            >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                {label}
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div
                    className="absolute top-full mt-1 right-0 z-30 rounded-md bg-[#161b22] border border-[#30363d] shadow-[0_8px_24px_rgba(0,0,0,0.5)] py-1"
                    style={{ minWidth: width }}
                >
                    {options.map(opt => {
                        const isSelected = selected.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                onClick={() => toggle(opt.value)}
                                className="w-full text-left px-3 py-1.5 text-[11.5px] text-[#e6edf3] flex items-center gap-2 hover:bg-[#21262d] transition-colors"
                            >
                                <span
                                    className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-[#1f6feb] border-[#1f6feb]" : "border-[#484f58]"
                                        }`}
                                >
                                    {isSelected && (
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </span>
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
