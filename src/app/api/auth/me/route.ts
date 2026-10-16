import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  if (!s || s.userType !== "customer") {
    return NextResponse.json({ customer: null });
  }
  return NextResponse.json({
    customer: {
      id: s.customer.id,
      mobileNumber: s.customer.mobileNumber,
      createdAt: s.customer.createdAt,
      lastLogin: s.customer.lastLogin,
    },
  });
}
