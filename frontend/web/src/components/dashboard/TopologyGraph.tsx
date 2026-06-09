"use client";

import { useMemo, useState } from "react";
import { type ClusterState } from "@/lib/api";

interface TopoNode {
    id: string;
    label: string;
    sublabel?: string;
    x: number;
    y: number;
    status: "healthy" | "warning" | "critical" | "unknown";
    pods: number;
    type: "service" | "database" | "gateway" | "queue" | "storage";
}

interface TopoEdge {
    from: string;
    to: string;
    protocol: "HTTP" | "gRPC" | "TCP" | "Kafka" | "Redis";
}

const statusColors: Record<string, string> = {
    healthy: "#10b981",
    warning: "#f59e0b",
    critical: "#ef4444",
    unknown: "#64748b",
};

const protocolColors: Record<string, string> = {
    HTTP: "#10b981",
    gRPC: "#8b5cf6",
    TCP: "#06b6d4",
    Kafka: "#a855f7",
    Redis: "#f59e0b",
};

// Hexagon path for node shape
function hexPath(cx: number, cy: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M${pts.join("L")}Z`;
}

interface TopologyGraphProps {
    clusterState: ClusterState | null;
}

export function TopologyGraph({ clusterState }: TopologyGraphProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"traffic" | "health" | "labels">("traffic");

    const { nodes, edges } = useMemo(() => {
        if (clusterState?.deployments?.length) {
            return buildFromClusterState(clusterState);
        }
        return getDemoTopology();
    }, [clusterState]);

    return (
        <div className="relative w-full h-full min-h-[480px]">
            {/* Top Controls */}
            <div className="absolute top-4 left-5 z-10 flex items-center gap-3">
                <div className="flex items-center gap-1 bg-navy-800/80 backdrop-blur-sm rounded-lg border border-[rgba(59,130,246,0.12)] px-2 py-1">
                    <span className="text-2xs text-slate-500 mr-1">All Layers</span>
                    <span className="text-2xs text-slate-600">▾</span>
                </div>
                <div className="flex items-center bg-navy-800/80 backdrop-blur-sm rounded-lg border border-[rgba(59,130,246,0.12)] p-0.5">
                    {(["traffic", "health", "labels"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 rounded-md text-2xs font-medium transition-all ${viewMode === mode
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* View mode (top right) */}
            <div className="absolute top-4 right-5 z-10 flex items-center gap-2">
                <span className="text-2xs text-slate-500">View:</span>
                <span className="text-2xs text-slate-200 font-medium">Dynamic</span>
                <span className="text-2xs text-slate-600 ml-1">▾</span>
                <button className="ml-2 text-slate-500 hover:text-slate-300 text-xs">⋯</button>
            </div>

            {/* Legend (left side) */}
            <div className="absolute top-16 left-5 z-10 space-y-3">
                <div className="space-y-1.5">
                    {[
                        { color: "#10b981", label: "Healthy" },
                        { color: "#f59e0b", label: "Warning" },
                        { color: "#ef4444", label: "Critical" },
                        { color: "#64748b", label: "Unknown" },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="text-2xs text-slate-400">{item.label}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-[rgba(59,130,246,0.08)] pt-2 space-y-1.5">
                    {[
                        { color: "#10b981", label: "HTTP", dash: false },
                        { color: "#8b5cf6", label: "gRPC", dash: true },
                        { color: "#06b6d4", label: "TCP", dash: false },
                        { color: "#a855f7", label: "Kafka", dash: true },
                        { color: "#f59e0b", label: "Redis", dash: true },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <svg width="14" height="4">
                                <line
                                    x1="0" y1="2" x2="14" y2="2"
                                    stroke={item.color}
                                    strokeWidth="1.5"
                                    strokeDasharray={item.dash ? "3 2" : "none"}
                                />
                            </svg>
                            <span className="text-2xs text-slate-400">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right side controls */}
            <div className="absolute top-16 right-5 z-10 flex flex-col gap-1.5">
                {["+", "−", "⤢", "🔒", "3D"].map((icon, i) => (
                    <button
                        key={i}
                        className="w-7 h-7 rounded-md bg-navy-800/80 backdrop-blur-sm border border-[rgba(59,130,246,0.12)] flex items-center justify-center text-2xs text-slate-400 hover:text-slate-200 hover:border-blue-500/30 transition-colors"
                    >
                        {icon}
                    </button>
                ))}
            </div>

            {/* SVG Canvas */}
            <svg viewBox="0 0 900 560" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    {/* Glow filters for each status */}
                    <filter id="glow-node-green" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#10b981" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-node-amber" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#f59e0b" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-node-red" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feFlood floodColor="#ef4444" floodOpacity="0.6" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-node-blue" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#3b82f6" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>

                    {/* Background particle glow */}
                    <radialGradient id="particle-glow">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Background particles */}
                {Array.from({ length: 40 }).map((_, i) => (
                    <circle
                        key={`particle-${i}`}
                        cx={80 + Math.random() * 740}
                        cy={40 + Math.random() * 480}
                        r={Math.random() * 1.5 + 0.5}
                        fill="#3b82f6"
                        opacity={Math.random() * 0.3 + 0.1}
                    >
                        <animate
                            attributeName="opacity"
                            values={`${Math.random() * 0.2 + 0.05};${Math.random() * 0.4 + 0.2};${Math.random() * 0.2 + 0.05}`}
                            dur={`${2 + Math.random() * 3}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                ))}

                {/* Edges with protocol colors and curves */}
                {edges.map((edge, i) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const color = protocolColors[edge.protocol] || "#3b82f6";
                    const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
                    const opacity = isHighlighted ? 0.8 : 0.25;

                    // Curved path
                    const mx = (fromNode.x + toNode.x) / 2;
                    const my = (fromNode.y + toNode.y) / 2;
                    const dx = toNode.x - fromNode.x;
                    const dy = toNode.y - fromNode.y;
                    const offset = (i % 3 - 1) * 20;
                    const cx = mx - dy * 0.15 + offset;
                    const cy = my + dx * 0.15;
                    const pathD = `M${fromNode.x},${fromNode.y} Q${cx},${cy} ${toNode.x},${toNode.y}`;

                    return (
                        <g key={`edge-${i}`}>
                            <path
                                d={pathD}
                                fill="none"
                                stroke={color}
                                strokeWidth={isHighlighted ? 2 : 1}
                                strokeOpacity={opacity}
                                strokeDasharray={edge.protocol === "gRPC" || edge.protocol === "Kafka" || edge.protocol === "Redis" ? "5 4" : "none"}
                            />
                            {/* Animated traffic dot */}
                            {isHighlighted && (
                                <circle r="2.5" fill={color} opacity="0.9">
                                    <animateMotion dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" path={pathD} />
                                </circle>
                            )}
                        </g>
                    );
                })}

                {/* Nodes - Hexagonal with cube icon */}
                {nodes.map((node) => {
                    const color = statusColors[node.status];
                    const isHovered = hoveredNode === node.id;
                    const size = isHovered ? 26 : 23;
                    const glowId = node.status === "healthy" ? "url(#glow-node-green)"
                        : node.status === "warning" ? "url(#glow-node-amber)"
                            : node.status === "critical" ? "url(#glow-node-red)"
                                : "none";

                    return (
                        <g
                            key={node.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Outer glow hexagon */}
                            <path
                                d={hexPath(node.x, node.y, size + 4)}
                                fill="none"
                                stroke={color}
                                strokeWidth="1"
                                strokeOpacity={isHovered ? 0.6 : 0.2}
                                filter={isHovered ? glowId : "none"}
                                className="transition-all duration-300"
                            />

                            {/* Main hexagon */}
                            <path
                                d={hexPath(node.x, node.y, size)}
                                fill={`${color}15`}
                                stroke={color}
                                strokeWidth={isHovered ? 2 : 1.5}
                                strokeOpacity={isHovered ? 1 : 0.7}
                                className="transition-all duration-300"
                            />

                            {/* Inner hexagon */}
                            <path
                                d={hexPath(node.x, node.y, size - 6)}
                                fill="rgba(10,17,40,0.9)"
                                stroke={color}
                                strokeWidth="0.5"
                                strokeOpacity="0.3"
                            />

                            {/* Cube icon (3D box) */}
                            <g transform={`translate(${node.x - 7},${node.y - 8})`}>
                                {/* Top face */}
                                <path d="M7,0 L14,4 L7,8 L0,4 Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.5" strokeOpacity="0.8" />
                                {/* Left face */}
                                <path d="M0,4 L7,8 L7,14 L0,10 Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="0.5" strokeOpacity="0.6" />
                                {/* Right face */}
                                <path d="M14,4 L7,8 L7,14 L14,10 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.5" strokeOpacity="0.6" />
                            </g>

                            {/* Warning icon for critical */}
                            {node.status === "critical" && (
                                <text
                                    x={node.x}
                                    y={node.y + 2}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#ef4444"
                                    fontWeight="bold"
                                >
                                    ⚠
                                </text>
                            )}

                            {/* Label */}
                            <text
                                x={node.x}
                                y={node.y + size + 14}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#e2e8f0"
                                fontFamily="var(--font-sans)"
                                fontWeight="500"
                            >
                                {node.label}
                            </text>

                            {/* Sublabel (pods or type) */}
                            <text
                                x={node.x}
                                y={node.y + size + 26}
                                textAnchor="middle"
                                fontSize="9"
                                fill="#64748b"
                                fontFamily="var(--font-mono)"
                            >
                                {node.sublabel || `${node.pods} pods`}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Bottom telemetry bar */}
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                <div className="flex items-center gap-6 text-2xs font-mono">
                    <span className="text-slate-500">Traffic <span className="text-slate-200 font-medium">—</span></span>
                    <MiniSparkSvg color="#10b981" />
                    <span className="text-slate-500">Requests <span className="text-slate-200 font-medium">—</span></span>
                    <MiniSparkSvg color="#3b82f6" />
                    <span className="text-red-400 font-medium">Errors <span>—</span></span>
                    <MiniSparkSvg color="#ef4444" />
                    <span className="text-slate-500">P95 Latency <span className="text-amber-400 font-medium">—</span></span>
                    <MiniSparkSvg color="#f59e0b" />
                </div>
            </div>
        </div>
    );
}

function MiniSparkSvg({ color }: { color: string }) {
    const points = Array.from({ length: 12 }, (_, i) => {
        const x = i * 4;
        const y = 6 + Math.sin(i * 0.8 + Math.random()) * 4;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width="44" height="14" className="inline-block ml-1">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
    );
}

function buildFromClusterState(clusterState: ClusterState): { nodes: TopoNode[]; edges: TopoEdge[] } {
    const deployments = clusterState.deployments.slice(0, 14);
    const nodes: TopoNode[] = deployments.map((d: any, i: number) => {
        // Layout in a hierarchical grid
        const rows = [1, 3, 4, 3, 4]; // nodes per row
        let row = 0, col = 0, count = 0;
        for (let r = 0; r < rows.length; r++) {
            if (i < count + rows[r]) {
                row = r;
                col = i - count;
                break;
            }
            count += rows[r];
        }
        const rowWidth = rows[row] * 180;
        const startX = (900 - rowWidth) / 2 + 90;
        const x = startX + col * 180;
        const y = 60 + row * 110;

        const healthy = d.ready === d.replicas;
        const type: TopoNode["type"] = d.name.includes("db") || d.name.includes("postgres") || d.name.includes("redis") ? "database"
            : d.name.includes("gateway") || d.name.includes("ingress") ? "gateway"
                : d.name.includes("kafka") || d.name.includes("queue") ? "queue"
                    : d.name.includes("s3") || d.name.includes("storage") || d.name.includes("bucket") ? "storage"
                        : "service";

        return {
            id: d.name,
            label: d.name,
            x,
            y,
            status: healthy ? "healthy" : d.ready === 0 ? "critical" : "warning",
            pods: d.replicas || 0,
            type,
        };
    });

    const edges: TopoEdge[] = [];
    for (let i = 1; i < nodes.length; i++) {
        const protocols: TopoEdge["protocol"][] = ["HTTP", "gRPC", "TCP", "Kafka", "Redis"];
        edges.push({
            from: nodes[Math.max(0, i - Math.ceil(Math.random() * 3))].id,
            to: nodes[i].id,
            protocol: protocols[i % protocols.length],
        });
    }

    return { nodes, edges };
}

function getDemoTopology(): { nodes: TopoNode[]; edges: TopoEdge[] } {
    const nodes: TopoNode[] = [
        // Row 1 - Ingress
        { id: "ingress", label: "Ingress", x: 450, y: 55, status: "healthy", pods: 3, type: "gateway" },
        // Row 2 - Frontend + Gateway + Auth
        { id: "web-ui", label: "Web UI", x: 250, y: 155, status: "healthy", pods: 6, type: "service" },
        { id: "api-gateway", label: "API Gateway", x: 450, y: 155, status: "healthy", pods: 8, type: "gateway" },
        { id: "auth-service", label: "Auth Service", x: 650, y: 155, status: "healthy", pods: 4, type: "service" },
        // Row 3 - Core services
        { id: "order-service", label: "Order Service", x: 170, y: 275, status: "healthy", pods: 10, type: "service" },
        { id: "user-service", label: "User Service", x: 330, y: 275, status: "healthy", pods: 6, type: "service" },
        { id: "payment-service", label: "Payment Service", x: 500, y: 275, status: "critical", pods: 6, type: "service" },
        { id: "notification", label: "Notification", x: 670, y: 275, status: "healthy", pods: 4, type: "service" },
        // Row 4 - Secondary services
        { id: "inventory", label: "Inventory", x: 280, y: 385, status: "healthy", pods: 8, type: "service" },
        { id: "analytics", label: "Analytics", x: 620, y: 385, status: "healthy", pods: 4, type: "service" },
        // Row 5 - Data layer
        { id: "postgresql", label: "PostgreSQL", x: 180, y: 490, status: "healthy", pods: 3, type: "database", sublabel: "Primary" },
        { id: "redis", label: "Redis Cluster", x: 360, y: 490, status: "healthy", pods: 3, type: "database", sublabel: "3 nodes" },
        { id: "kafka", label: "Kafka", x: 540, y: 490, status: "healthy", pods: 3, type: "queue", sublabel: "3 nodes" },
        { id: "s3", label: "S3 Bucket", x: 710, y: 490, status: "healthy", pods: 0, type: "storage", sublabel: "Object Store" },
    ];

    const edges: TopoEdge[] = [
        // Ingress to tier 2
        { from: "ingress", to: "web-ui", protocol: "HTTP" },
        { from: "ingress", to: "api-gateway", protocol: "HTTP" },
        { from: "ingress", to: "auth-service", protocol: "HTTP" },
        // Gateway to services
        { from: "api-gateway", to: "order-service", protocol: "gRPC" },
        { from: "api-gateway", to: "user-service", protocol: "gRPC" },
        { from: "api-gateway", to: "payment-service", protocol: "gRPC" },
        { from: "api-gateway", to: "notification", protocol: "gRPC" },
        // Service to service
        { from: "order-service", to: "payment-service", protocol: "gRPC" },
        { from: "order-service", to: "inventory", protocol: "gRPC" },
        { from: "user-service", to: "notification", protocol: "gRPC" },
        // Services to data
        { from: "order-service", to: "postgresql", protocol: "TCP" },
        { from: "payment-service", to: "postgresql", protocol: "TCP" },
        { from: "user-service", to: "redis", protocol: "Redis" },
        { from: "inventory", to: "redis", protocol: "Redis" },
        { from: "notification", to: "kafka", protocol: "Kafka" },
        { from: "analytics", to: "kafka", protocol: "Kafka" },
        { from: "analytics", to: "s3", protocol: "HTTP" },
        { from: "payment-service", to: "redis", protocol: "Redis" },
    ];

    return { nodes, edges };
}
