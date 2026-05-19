"use client";

import { useEffect, useState, useCallback } from "react";
import { tagentWS, type WSEvent, type EventType } from "./websocket";

/**
 * Hook to subscribe to real-time WebSocket events from Tagent.
 * 
 * Usage:
 *   const { events, connected } = useTagentWS("incident");
 *   // events = array of incident events received in real-time
 */
export function useTagentWS(filterType?: EventType) {
    const [events, setEvents] = useState<WSEvent[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        tagentWS.connect();

        const unsubscribe = tagentWS.subscribe((event) => {
            if (event.type === "connected") {
                setConnected(true);
                return;
            }
            if (!filterType || event.type === filterType) {
                setEvents((prev) => [event, ...prev].slice(0, 100)); // keep last 100
            }
        });

        // Check connection status
        const interval = setInterval(() => {
            setConnected(tagentWS.isConnected());
        }, 2000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [filterType]);

    const clear = useCallback(() => setEvents([]), []);

    return { events, connected, clear };
}
