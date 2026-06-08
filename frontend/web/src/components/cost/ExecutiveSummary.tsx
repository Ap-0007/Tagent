"use client";

export function ExecutiveSummary() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Executive Summary</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a371f7]/15 text-[#a371f7] font-semibold">AI Generated</span>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed mb-3">
                Infrastructure spending remains healthy and within budget. AI has identified $6,420 in potential monthly savings across 14 optimization opportunities.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Overall Efficiency</p>
                    <p className="text-[16px] font-bold text-[#3fb950] font-mono">92%</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Cost Efficiency</p>
                    <p className="text-[16px] font-bold text-[#3fb950] font-mono">Low</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Budget Health</p>
                    <p className="text-[16px] font-bold text-[#3fb950] font-mono">Good</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Cost Trend</p>
                    <p className="text-[11px] font-semibold text-[#3fb950]">↘ vs last month</p>
                </div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#21262d]">
                <span className="text-[#8b949e]">Risk Level <span className="text-[#3fb950] font-semibold ml-1">+ 6.2%</span></span>
                <span className="text-[#3fb950] font-semibold">No critical issues</span>
            </div>
            <p className="text-[9px] text-[#6e7681] mt-2">Generated with 94% confidence. AI-powered analysis.</p>
        </div>
    );
}
