"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Define the shape of the context
interface TwoFALogoContextType {
    twofaLogoUrl: string | null;
    setLogoUrl: (url: string | null) => void;
}

// Create the context with a default value
const TwoFALogoContext = createContext<TwoFALogoContextType | undefined>(undefined);

// Logo Provider component
export const TwoFALogoProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [twofaLogoUrl, setLogoUrl] = useState<string | null>(null);

    // Fetch logo settings from API
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/home");
                if (response.ok) {
                    const data = await response.json();
                    setLogoUrl(data.twofaLogoUrl || "/zelle-logo.svg");
                } else {
                    console.error("Failed to fetch settings");
                    setLogoUrl("/zelle-logo.svg"); // Fallback logo
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                setLogoUrl("/zelle-logo.svg"); // Fallback logo
            }
        };
        fetchSettings();
    }, []);

    return (
        <TwoFALogoContext.Provider value={{ twofaLogoUrl, setLogoUrl }}>
            {children}
        </TwoFALogoContext.Provider>
    );
};

// Custom hook to use the LogoContext
export const useTwoFALogo = () => {
    const context = useContext(TwoFALogoContext);
    if (!context) {
        throw new Error("useTwoFALogo must be used within a TwoFALogoProvider");
    }
    return context;
};