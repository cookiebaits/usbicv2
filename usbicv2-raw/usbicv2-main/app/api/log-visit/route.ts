import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IPLog from "@/models/IPLog";
import { getIPInfo } from "@/lib/ipInfo";

const getClientIp = (req: NextRequest): string => {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const ips = forwardedFor.split(",").map(ip => ip.trim());
        return ips[0];
    }
    const realIp = req.headers.get("x-real-ip");
    return realIp || "Unknown";
};

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const ip = process.env.NODE_ENV === "development" ? "8.8.8.8" : getClientIp(req);
        const userAgent = req.headers.get("user-agent") || "";
        const { country, isVpn } = await getIPInfo(ip);

        // if (country !== "US" || (country === "US" && isVpn)) {
            const logData = {
                ip,
                location: country,
                date: new Date(),
                vpnProxy: isVpn,
                type: 'visit',
                userId: null,
                userAgent,
            };
            const log = new IPLog(logData);
            await log.save();
        // }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error logging visit:", error);
        return NextResponse.json({ error: "Failed to log visit" }, { status: 500 });
    }
}