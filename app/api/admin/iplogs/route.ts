import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IPLog from "@/models/IPLog";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface IJwtPayload {
    role: string;
}

interface IPLogDocument {
    _id: mongoose.Types.ObjectId;
    ip: string;
    location: string;
    date: Date;
    vpnProxy: boolean;
    type: "registration" | "visit";
    userId?: mongoose.Types.ObjectId;
    userAgent: string;
}

export async function GET(req: NextRequest) {
    await dbConnect();
    const token = req.cookies.get("adminToken")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
        if (decoded.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const logs = await IPLog.find().sort({ date: -1 }).lean<IPLogDocument[]>();
        const processedLogs = logs.map((log) => ({
            id: log._id.toString(),
            ip: log.ip,
            location: log.location,
            date: log.date.toISOString(),
            vpnProxy: log.vpnProxy,
            type: log.type,
            userAgent: log.userAgent,
        }));

        return NextResponse.json({ logs: processedLogs }, { status: 200 });
    } catch (error) {
        console.error("Error fetching IP logs:", error);
        return NextResponse.json({ error: "Failed to fetch IP logs" }, { status: 500 });
    }
}



export async function DELETE(req: NextRequest) {
    await dbConnect();
    const token = req.cookies.get("adminToken")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
        if (decoded.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await IPLog.deleteMany({});
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting all IP logs:", error);
        return NextResponse.json({ error: "Failed to delete all IP logs" }, { status: 500 });
    }
}