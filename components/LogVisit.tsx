"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function LogVisit() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname === "/") {
            fetch("/api/log-visit", { method: "POST" });
        }
    }, [pathname]);

    return null;
}