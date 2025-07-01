import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IPLog from "@/models/IPLog";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface IJwtPayload {
    role: string;
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

        const { id } = params;
        await IPLog.findByIdAndDelete(id);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting IP log:", error);
        return NextResponse.json({ error: "Failed to delete IP log" }, { status: 500 });
    }
}