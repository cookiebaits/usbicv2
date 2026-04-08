export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import IPLog from "@/models/IPLog";
import { getIPInfo } from "@/lib/ipInfo";

const getClientIp = (req: NextRequest): string => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "Unknown";
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const ip = process.env.NODE_ENV === "development" ? "8.8.8.8" : getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "";
    const { country, isVpn } = await getIPInfo(ip);

    IPLog.create({ ip, location: country, vpnProxy: isVpn, type: 'visit', userAgent });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Log visit error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
