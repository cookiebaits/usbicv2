"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Color from "color";
import {
    ArrowLeft,
    Calendar,
    Search,
    Globe,
    MoreHorizontal,
    Loader2,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchColors, formatDateTime } from "@/lib/utils";
import { UAParser } from "ua-parser-js";

interface Colors {
    primaryColor: string;
    secondaryColor: string;
}

interface IPLog {
    id: string;
    ip: string;
    location: string;
    date: string;
    vpnProxy: boolean;
    type: "registration" | "visit";
    userAgent: string;
}

export default function AdminIPLogsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [countryFilter, setCountryFilter] = useState<string>("all");
    const [vpnFilter, setVpnFilter] = useState<string>("all");
    const [logs, setLogs] = useState<IPLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [colors, setColors] = useState<Colors | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [deletingAll, setDeletingAll] = useState(false);

    useEffect(() => {
        fetchColors();
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/admin/iplogs", { credentials: "include" });
                if (!response.ok) {
                    const errorText = await response.text();
                    if (response.status === 401) {
                        setError("Unauthorized: Please log in again");
                        router.push("/admin/login");
                        return;
                    } else if (response.status === 403) {
                        setError("Forbidden: Admin access required");
                        return;
                    }
                    throw new Error(`Failed to fetch IP logs: ${errorText}`);
                }
                const data = await response.json();
                setLogs(data.logs);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [router]);

    const deleteLog = async (id: string) => {
        setDeleting(id);
        try {
            const response = await fetch(`/api/admin/iplogs/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to delete log");
            }
            setLogs(logs.filter(log => log.id !== id));
        } catch (error) {
            console.error("Error deleting log:", error);
            setError("Failed to delete log");
        } finally {
            setDeleting(null);
        }
    };

    const deleteAllLogs = async () => {
        if (confirm("Are you sure you want to delete all logs? This action cannot be undone.")) {
            setDeletingAll(true);
            try {
                const response = await fetch("/api/admin/iplogs", {
                    method: "DELETE",
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error("Failed to delete all logs");
                }
                setLogs([]);
            } catch (error) {
                console.error("Error deleting all logs:", error);
                setError("Failed to delete all logs");
            } finally {
                setDeletingAll(false);
            }
        }
    };

    const filteredLogs = logs.filter((log) => {
        const matchesSearch = searchTerm
            ? log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.location.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        const matchesDate =
            (!dateRange.from || new Date(log.date) >= dateRange.from) &&
            (!dateRange.to || new Date(log.date) <= dateRange.to);
        const matchesType = typeFilter === "all" || log.type === typeFilter;
        const matchesCountry = countryFilter === "all" || log.location === countryFilter;
        const matchesVpn =
            vpnFilter === "all" || (vpnFilter === "yes" && log.vpnProxy) || (vpnFilter === "no" && !log.vpnProxy);
        return matchesSearch && matchesDate && matchesType && matchesCountry && matchesVpn;
    });

    const resetFilters = () => {
        setSearchTerm("");
        setDateRange({ from: undefined, to: undefined });
        setTypeFilter("all");
        setCountryFilter("all");
        setVpnFilter("all");
    };

    const getLogIcon = (type: string) => {
        return type === "registration" ? (
            <Globe className="h-5 w-5 text-blue-600" />
        ) : (
            <Globe className="h-5 w-5 text-green-600" />
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
            <div className="p-6 max-w-7xl mx-auto">
                <Button variant="outline" size="sm" asChild className="mb-4 bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300">
                    <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
                </Button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
                    IP Log Management
                </h1>
                {/* </h flagrance="div" className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50"> */}
                <div className="py-6 max-w-7xl mx-auto">
                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}
                    <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-primary-900">Filters</CardTitle>
                                    <CardDescription className="text-primary-600">Filter IP log history</CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-primary-700 hover:text-primary-900 hover:bg-primary-100"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search IP or country..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {dateRange.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                "Date Range"
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange.from}
                                            selected={dateRange}
                                            onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Log Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="registration">Registration</SelectItem>
                                        <SelectItem value="visit">Visit</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={countryFilter} onValueChange={setCountryFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Countries</SelectItem>
                                        {[...new Set(logs.map((log) => log.location))].sort().map((country) => (
                                            <SelectItem key={country} value={country}>
                                                {country}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* <Select value={vpnFilter} onValueChange={setVpnFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="VPN/Proxy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select> */}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-primary-900">IP Log History</CardTitle>
                                    <CardDescription className="text-primary-600">
                                        {filteredLogs.length} logs found
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={deleteAllLogs}
                                    disabled={deletingAll}
                                >
                                    {deletingAll ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Delete All Logs"
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-primary-50/50">
                                            <th className="text-left p-4 text-primary-800">IP Address</th>
                                            <th className="text-left p-4 text-primary-800">Location</th>
                                            <th className="text-left p-4 text-primary-800">Date</th>
                                            {/* <th className="text-left p-4 text-primary-800">VPN/Proxy</th> */}
                                            <th className="text-left p-4 text-primary-800">Type</th>
                                            <th className="text-left p-4 text-primary-800">Device/Browser</th>
                                            <th className="text-left p-4 text-primary-800">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary-100">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-primary-50/50 transition-colors">
                                                <td className="p-4 font-mono text-xs">{log.ip}</td>
                                                <td className="p-4">{log.location}</td>
                                                <td className="p-4 min-w-[120px]">{formatDateTime(log.date)}</td>
                                                {/* <td className="p-4">
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${log.vpnProxy
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-green-100 text-green-800"
                                                            }`}
                                                    >
                                                        {log.vpnProxy ? "Yes" : "No"}
                                                    </span>
                                                </td> */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
                                                            {getLogIcon(log.type)}
                                                        </div>
                                                        <div className="capitalize">{log.type}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {log.userAgent ? (
                                                        (() => {
                                                            const parser = new UAParser(log.userAgent);
                                                            const device = parser.getDevice();
                                                            const browser = parser.getBrowser();
                                                            return (
                                                                <div>
                                                                    <div>{device.vendor || ''} {device.model || ''}</div>
                                                                    <div>{browser.name || ''} {browser.version || ''}</div>
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteLog(log.id)}
                                                        disabled={deleting === log.id}
                                                    >
                                                        {deleting === log.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                                                    No logs found matching your filters
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}