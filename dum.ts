For the past 2 days, I am facing a major inconsistency issue in my project. It works well in local environment but don't when I deploy using vercel on sub domain: usbicv2.vercel.app. The project has site settings page in admin panel from where admin can change logo, theme, logo dimensions etc. The issue occurring is that in the deployed website, when I change logo dimensions from admin panel, I can see updated dimensions in database but the logo in TopBar still show up with old dimensions but the logo on home (app.js) page is shown with the updated dimensions. If admin change site colors then he see updated colors applied in website but on site settings he still sees the old colors mentioned although new colors are applied throughout. Then admin change contact number from general settings and on changing contact, the old theme applied back out of nowhere. If it can be the issue with cache then I will suggest to remove complete cache from my code but doesn't seem to be the issue with cache because even after 12 hours I still see the same issues and even after clearing cache of my browser or opening in different browsers, I still see same logo with old dimensions in TopBar but logo with new dimensions in app.js home page. But it all works well in local environment. When I run code locally and do any change then everything works well. Below I am sharing all components/files code which may be helpful for you in identifying the issues or problems causing this.



layout.tsx:
import type { Metadata } from "next";
import { LogoProvider } from "@/app/logoContext";
import { ZelleLogoProvider } from "./zellLogoContext";
import "./globals.css";
import { LogVisit } from "@/components/LogVisit";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Free International Banking",
  description: "Developed by Venhash Solutions",
};

async function fetchSettings() {
  try {
    const response = await fetch(`${process.env.hostName}/api/home`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSettings();

  return (
    <html lang="en">
      <body>
        <ZelleLogoProvider>
          <LogoProvider>
            <LogVisit />
            <TopBar settings={settings}>
              {children}
            </TopBar>
          </LogoProvider>
        </ZelleLogoProvider>
      </body>
    </html>
  );
}




TopBar.tsx:
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { TopBarContext } from '../app/TopBarContext';

interface TopBarProps {
    settings: any;
    children: React.ReactNode;
}

export default function TopBar({ settings, children }: TopBarProps) {
    const pathname = usePathname();
    const [topBarHeight, setTopBarHeight] = useState<number>(0);

    const isAdmin = pathname.startsWith("/admin");
    const isDashboard = pathname.startsWith("/dashboard");

    const handleLogout = () => {
        logout(isAdmin ? "admin" : "user");
    };

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





Settings.ts:
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  privacyPolicy: string;
  termsOfService: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  zelleLogoUrl?: string;
  zelleLogoWidth?: number;
  zelleLogoHeight?: number;
  checkingIcon?: string;
  savingsIcon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  siteName: { type: String, required: true },
  supportEmail: { type: String, required: true },
  supportPhone: { type: String, required: true },
  instagramUrl: { type: String, required: false },
  twitterUrl: { type: String, required: false },
  facebookUrl: { type: String, required: false },
  privacyPolicy: { type: String, required: true },
  termsOfService: { type: String, required: true },
  primaryColor: { type: String, required: false },
  secondaryColor: { type: String, required: false },
  logoUrl: { type: String, required: false },
  logoWidth: { type: Number, required: false },
  logoHeight: { type: Number, required: false },
  zelleLogoUrl: { type: String, required: false },
  zelleLogoWidth: { type: Number, required: false },
  zelleLogoHeight: { type: Number, required: false },
  checkingIcon: { type: String, required: false },
  savingsIcon: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);







Same part of code from app/page.tsx:
export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  const { logoUrl } = useLogo();

  // Fetch settings for logo and social media URLs
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

  // Fetch colors from the new endpoint and set CSS variables
  useEffect(() => {
    fetchColors();
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      <style jsx global>{`
        ${enhancedStyles}
      `}</style>
      <header className="sticky top-0 z-50 shadow-sm bg-barColor backdrop-blur-lg">
        <div className="container m-auto flex p-4 items-center px-2 sm:px-4 lg:px-6">
          <div className="flex items-center">
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Site Logo"
                style={{
                  width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : 'auto',
                  height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : '32px',
                  filter: 'brightness(100%)'
                }}
              />
            )}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-white/80 text-primary-600 hover:bg-primary-600 hover:text-white"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"><Link href="/register">Register</Link></Button>
          </div>
        </div>
      </header>




app/api/admin/settings/route.ts:
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    await mongoose.connect(process.env.MONGODB_URI!);

    const settings = await Settings.findOne().lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const response = NextResponse.json(settings);
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const data = await request.json();

    if (!data.siteName || !data.supportEmail || !data.supportPhone || !data.privacyPolicy || !data.termsOfService) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        siteName: data.siteName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        instagramUrl: data.instagramUrl || '',
        twitterUrl: data.twitterUrl || '',
        facebookUrl: data.facebookUrl || '',
        privacyPolicy: data.privacyPolicy,
        termsOfService: data.termsOfService,
        primaryColor: data.primaryColor || '#5f6cd3',
        secondaryColor: data.secondaryColor || '#9c65d2',
        logoUrl: data.logoUrl || '',
        logoWidth: data.logoWidth,
        logoHeight: data.logoHeight,
        zelleLogoUrl: data.zelleLogoUrl || '',
        zelleLogoWidth: data.zelleLogoWidth,
        zelleLogoHeight: data.zelleLogoHeight,
        checkingIcon: data.checkingIcon || '',
        savingsIcon: data.savingsIcon || ''
      },
      { upsert: true, new: true }
    );

    const response = NextResponse.json({ message: 'Settings updated successfully', settings });
    response.headers.set('Cache-Control', 'public, max-age=1, s-maxage=1, stale-while-revalidate=1');
    return response;
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}





app/api/home/route.ts:
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings, { ISettings } from '@/models/Settings';

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Fetch settings with lean() and select all needed fields, including dimensions
    const settings = (await Settings.findOne()
      .select('logoUrl logoWidth logoHeight facebookUrl twitterUrl instagramUrl zelleLogoUrl zelleLogoWidth zelleLogoHeight')
      .lean()) as unknown as ISettings;
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Destructure the properties with defaults for dimensions
    const {
      logoUrl,
      logoWidth = 0,
      logoHeight = 0,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      zelleLogoUrl,
      zelleLogoWidth = 0,
      zelleLogoHeight = 0,
    } = settings;
    
    const response = NextResponse.json({
      logoUrl,
      logoWidth,
      logoHeight,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      zelleLogoUrl,
      zelleLogoWidth,
      zelleLogoHeight,
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=1, s-maxage=1, stale-while-revalidate=1');
    return response;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}





app/admin/settings/page.tsx:
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Globe, Loader2, Palette, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Color from 'color';
import imageCompression from 'browser-image-compression';

export default function AdminSettingsPage() {
  const router = useRouter();

  // Authentication and loading states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Consolidated settings state with logo dimensions
  const [settings, setSettings] = useState({
    siteName: "Zelle Banking",
    supportEmail: "support@zellebank.example.com",
    supportPhone: "1-800-555-1234",
    instagramUrl: "https://instagram.com",
    twitterUrl: "https://twitter.com",
    facebookUrl: "https://facebook.com",
    privacyPolicy: "",
    termsOfService: "",
    primaryColor: "#5f6cd3",
    secondaryColor: "#9c65d2",
    logoUrl: "/zelle-logo.svg",
    logoWidth: 0,
    logoHeight: 0,
    zelleLogoUrl: "/zelle-logo.svg",
    zelleLogoWidth: 0,
    zelleLogoHeight: 0,
    checkingIcon: "square",
    savingsIcon: "circle",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null);

  // Fetch settings and colors
  useEffect(() => {
    const checkAuthAndFetchSettings = async () => {
      try {
        const authResponse = await fetch("/api/admin/check-auth", {
          method: "GET",
          credentials: "include",
        });

        if (!authResponse.ok) {
          router.push("/admin/login");
          return;
        }

        setIsAuthenticated(true);

        const settingsResponse = await fetch("/api/admin/settings", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!settingsResponse.ok) {
          if (settingsResponse.status === 401) {
            setError("Unauthorized access. Please log in again.");
            router.push("/admin/login");
            return;
          } else if (settingsResponse.status === 404) {
            setError("Settings not found. Using default values. Save to create settings.");
            return;
          }
          throw new Error(`HTTP error! Status: ${settingsResponse.status}`);
        }

        const data = await settingsResponse.json();
        setSettings({
          siteName: data.siteName || "Zelle Banking",
          supportEmail: data.supportEmail || "support@zellebank.example.com",
          supportPhone: data.supportPhone || "1-800-555-1234",
          instagramUrl: data.instagramUrl || "https://instagram.com",
          twitterUrl: data.twitterUrl || "https://twitter.com",
          facebookUrl: data.facebookUrl || "https://facebook.com",
          privacyPolicy: data.privacyPolicy || "",
          termsOfService: data.termsOfService || "",
          primaryColor: data.primaryColor || "#5f6cd3",
          secondaryColor: data.secondaryColor || "#9c65d2",
          logoUrl: data.logoUrl || "/zelle-logo.svg",
          logoWidth: data.logoWidth || 0,
          logoHeight: data.logoHeight || 0,
          zelleLogoUrl: data.zelleLogoUrl || "/zelle-logo.svg",
          zelleLogoWidth: data.zelleLogoWidth || 0,
          zelleLogoHeight: data.zelleLogoHeight || 0,
          checkingIcon: data.checkingIcon || "square",
          savingsIcon: data.savingsIcon || "circle",
        });

        // Fetch colors from API
        const colorsResponse = await fetch('/api/colors');
        if (colorsResponse.ok) {
          const colorsData = await colorsResponse.json();
          setColors(colorsData);

          const primary = Color(colorsData.primaryColor || "#5f6cd3");
          // const secondary = Color(colorsData.secondaryColor || "#9c65d2");

          const generateShades = (color: typeof Color.prototype) => ({
            50: color.mix(Color('white'), 0.9).hex(),
            100: color.mix(Color('white'), 0.8).hex(),
            200: color.mix(Color('white'), 0.6).hex(),
            300: color.mix(Color('white'), 0.4).hex(),
            400: color.mix(Color('white'), 0.2).hex(),
            500: color.hex(),
            600: color.mix(Color('black'), 0.1).hex(),
            700: color.mix(Color('black'), 0.2).hex(),
            800: color.mix(Color('black'), 0.3).hex(),
            900: color.mix(Color('black'), 0.4).hex(),
          })
          const primaryShades = generateShades(primary);
          // const secondaryShades = generateShades(secondary);

          Object.entries(primaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(`--primary-${shade}`, color);
          });

          // Object.entries(secondaryShades).forEach(([shade, color]) => {
          //   document.documentElement.style.setProperty(`--secondary-${shade}`, color);
          // });
        } else {
          console.error('Failed to fetch colors');
        }
      } catch (error: any) {
        console.error("Error fetching settings or colors:", error);
        if (!error.message.includes("Unauthorized")) {
          setError("Failed to load settings from the server. Using default values.");
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuthAndFetchSettings();
  }, [router]);

  // Handlers for form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    if (['logoWidth', 'logoHeight', 'zelleLogoWidth', 'zelleLogoHeight'].includes(name)) {
      parsedValue = value ? parseInt(value, 10) : 0;
    }
    setSettings({ ...settings, [name]: parsedValue });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "zelleLogoUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const img = new Image();
          img.onload = () => {
            const width = img.width;
            const height = img.height;
            setSettings({
              ...settings,
              [field]: dataUrl,
              [field.replace('Url', 'Width')]: width,
              [field.replace('Url', 'Height')]: height,
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression error:', error);
        setError("Failed to compress image. Please try again.");
      }
    }
  };

  const handleSelect = (name: string, value: string) => {
    setSettings({ ...settings, [name]: value });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized. Redirecting to login...");
          router.push("/admin/login");
          return;
        }
        throw new Error(`Failed to save settings. Status: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data.settings);
      setSuccess("Settings saved successfully. Changes may take up to 1 minute to reflect across the site.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will handle redirect to /admin/login
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="p-6 max-w-5xl mx-auto">
        <Button variant="outline" size="sm" asChild className="mb-4 bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300">
          <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
          Admin Settings
        </h1>

        {success && (
          <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2 mt-6 bg-primary-100">
            <TabsTrigger
              value="general"
            >
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
            >
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary-900">General Settings</CardTitle>
                <CardDescription className="text-primary-600">
                  Configure basic site settings and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-primary-800">
                      Site Name
                    </Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={settings.siteName}
                      onChange={handleChange}
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail" className="text-primary-800">
                      Support Email
                    </Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={handleChange}
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone" className="text-primary-800">
                      Support Phone
                    </Label>
                    <Input
                      id="supportPhone"
                      name="supportPhone"
                      value={settings.supportPhone}
                      onChange={handleChange}
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-900">Social Media Links</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl" className="text-primary-800">
                        Instagram URL
                      </Label>
                      <Input
                        id="instagramUrl"
                        name="instagramUrl"
                        type="url"
                        value={settings.instagramUrl}
                        onChange={handleChange}
                        placeholder="https://instagram.com/yourprofile"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl" className="text-primary-800">
                        Twitter URL
                      </Label>
                      <Input
                        id="twitterUrl"
                        name="twitterUrl"
                        type="url"
                        value={settings.twitterUrl}
                        onChange={handleChange}
                        placeholder="https://twitter.com/yourprofile"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl" className="text-primary-800">
                        Facebook URL
                      </Label>
                      <Input
                        id="facebookUrl"
                        name="facebookUrl"
                        type="url"
                        value={settings.facebookUrl}
                        onChange={handleChange}
                        placeholder="https://facebook.com/yourprofile"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-900">Legal Information</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="privacyPolicy" className="text-primary-800">
                        Privacy Policy
                      </Label>
                      <Textarea
                        id="privacyPolicy"
                        name="privacyPolicy"
                        value={settings.privacyPolicy}
                        onChange={handleChange}
                        placeholder="Enter your privacy policy here..."
                        rows={6}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termsOfService" className="text-primary-800">
                        Terms of Service
                      </Label>
                      <Textarea
                        id="termsOfService"
                        name="termsOfService"
                        value={settings.termsOfService}
                        onChange={handleChange}
                        placeholder="Enter your terms of service here..."
                        rows={6}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary-900">Appearance Settings</CardTitle>
                <CardDescription className="text-primary-600">
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-primary-800">
                    Background & Font
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 p-1 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={handleChange}
                      name="primaryColor"
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="text-primary-800">
                    Top Bar
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 p-1 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      name="secondaryColor"
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary-800">Site Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, "logoUrl")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("logoUpload")?.click()}
                        className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </Button>
                    </div>
                    {settings.logoUrl && (
                      <img
                        src={settings.logoUrl}
                        alt="Logo preview"
                        style={{
                          width: settings.logoWidth > 0 ? `${settings.logoWidth}px` : '100px',
                          height: settings.logoHeight > 0 ? `${settings.logoHeight}px` : 'auto',
                        }}
                        className="rounded"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoWidth" className="text-primary-800">Width (px)</Label>
                      <Input
                        id="logoWidth"
                        name="logoWidth"
                        type="number"
                        value={settings.logoWidth || ''}
                        onChange={handleChange}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoHeight" className="text-primary-800">Height (px)</Label>
                      <Input
                        id="logoHeight"
                        name="logoHeight"
                        type="number"
                        value={settings.logoHeight || ''}
                        onChange={handleChange}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary-800">Zelle Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="zelleLogoUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, "zelleLogoUrl")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("zelleLogoUpload")?.click()}
                        className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Zelle Logo
                      </Button>
                    </div>
                    {settings.zelleLogoUrl && (
                      <img
                        src={settings.zelleLogoUrl}
                        alt="Zelle Logo preview"
                        style={{
                          width: settings.zelleLogoWidth > 0 ? `${settings.zelleLogoWidth}px` : '100px',
                          height: settings.zelleLogoHeight > 0 ? `${settings.zelleLogoHeight}px` : 'auto',
                        }}
                        className="rounded"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zelleLogoWidth" className="text-primary-800">Width (px)</Label>
                      <Input
                        id="zelleLogoWidth"
                        name="zelleLogoWidth"
                        type="number"
                        value={settings.zelleLogoWidth || ''}
                        onChange={handleChange}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zelleLogoHeight" className="text-primary-800">Height (px)</Label>
                      <Input
                        id="zelleLogoHeight"
                        name="zelleLogoHeight"
                        type="number"
                        value={settings.zelleLogoHeight || ''}
                        onChange={handleChange}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <Label className="text-primary-800">Account Icons</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkingIcon" className="text-primary-800">
                        Checking Account Icon
                      </Label>
                      <Select
                        value={settings.checkingIcon}
                        onValueChange={(value) => handleSelect("checkingIcon", value)}
                      >
                        <SelectTrigger
                          id="checkingIcon"
                          className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        >
                          <SelectValue placeholder="Select icon shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savingsIcon" className="text-primary-800">
                        Savings Account Icon
                      </Label>
                      <Select
                        value={settings.savingsIcon}
                        onValueChange={(value) => handleSelect("savingsIcon", value)}
                      >
                        <SelectTrigger
                          id="savingsIcon"
                          className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        >
                          <SelectValue placeholder="Select icon shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div> */}
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm">
                    <p className="font-medium">Preview</p>
                    <div className="mt-2 flex justify-center">
                      <div className="border rounded-md p-4 bg-background">
                        <div className="flex items-center gap-2 mb-4">
                          <img
                            src={settings.logoUrl || "/placeholder.svg"}
                            alt="Logo"
                            className="h-8 w-auto"
                            loading="lazy"
                          />
                          <span className="font-bold">{settings.siteName}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button style={{ backgroundColor: settings.primaryColor, color: '#ffffff' }}>
                            Primary Button
                          </Button>
                          <div className="flex items-center gap-2">
                            <div style={{ backgroundColor: settings.secondaryColor, width: '20px', height: '20px', borderRadius: '4px' }}></div>
                            <span className="text-sm text-gray-600">Secondary Color</span>
                          </div>
                          {/* <Button variant="outline">Secondary Button</Button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}