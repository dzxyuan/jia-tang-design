import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, isPasswordConfigured } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authed: isAuthorized(request),
    configured: isPasswordConfigured(),
  });
}
