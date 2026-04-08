"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { TopBarContext } from '../app/TopBarContext';

interface TopBarProps {
    children: React.ReactNode;
}

export default function TopBar({ children }: TopBarProps) {
    const pathname = usePathname();
    const [topBarHeight, setTopBarHeight] = useState<number>(0);
    const [settings, setSettings] = useState<any>(null);

    const isAdmin = pathname.startsWith("/admin");
    const isDashboard = pathname.startsWith("/dashboard");

    const handleLogout = () => {
        logout(isAdmin ? "admin" : "user");
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/home");
                if (response.ok) setSettings(await response.json());
            } catch {}
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const topBarElement = document.getElementById("top-bar");
        if (topBarElement) {
            setTopBarHeight(topBarElement.getBoundingClientRect().height);
        }
    }, [settings]);

    if (pathname === "/" || pathname === "/admin/login" || pathname === "/admin/forgot-password") {
        return <>{children}</>;
    }

    if (!isAdmin && !isDashboard) {
        return <>{children}</>;
    }

    return (
        <TopBarContext.Provider value={{ topBarHeight }}>
            <div
                id="top-bar"
                className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 z-50"
                data-testid="top-bar"
            >
                <div className="max-w-[1300px] mx-auto flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => pathname.includes("admin") ? window.location.href = '/admin/dashboard' : window.location.href = '/dashboard'}
                        data-testid="topbar-logo"
                    >
                        {settings?.logoUrl ? (
                            <img
                                src={settings.logoUrl}
                                alt="Site Logo"
                                style={{
                                    width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : "auto",
                                    height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : "28px",
                                }}
                            />
                        ) : (
                            <div style={{ height: "28px" }}></div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full text-sm font-medium"
                        onClick={handleLogout}
                        data-testid="topbar-logout-btn"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
            <div style={{ paddingTop: `${topBarHeight}px` }}>
                {children}
            </div>
        </TopBarContext.Provider>
    );
}
