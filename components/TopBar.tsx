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
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                } else {
                    console.error("Failed to fetch settings");
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const topBarElement = document.getElementById("top-bar");
        if (topBarElement) {
            const height = topBarElement.getBoundingClientRect().height;
            setTopBarHeight(height);
        }
    }, [settings]);

    if (
        pathname === "/" ||
        pathname === "/admin/login" ||
        pathname === "/admin/forgot-password"
    ) {
        return <>{children}</>;
    }

    if (!isAdmin && !isDashboard) {
        return <>{children}</>;
    }

    return (
        <TopBarContext.Provider value={{ topBarHeight }}>
            <div
                id="top-bar"
                className="fixed top-0 left-0 w-full shadow-md bg-barColor backdrop-blur-lg p-4 z-50"
            >
                <div className="w-[1260px] m-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {settings?.logoUrl ? (
                            <img
                                src={settings.logoUrl}
                                alt="Site Logo"
                                style={{
                                    width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : "auto",
                                    height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : "32px",
                                    filter: "brightness(100%)",
                                }}
                            />
                        ) : (
                            <div style={{ height: "32px" }}></div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        className="text-black hover:bg-primary-100 text-sm"
                        onClick={handleLogout}
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