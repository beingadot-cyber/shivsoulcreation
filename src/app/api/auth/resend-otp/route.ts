import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/db-setup";
import { issueOtp, type OtpPurpose } from "@/lib/otp";
import { isValidMobile } from "@/lib/auth";

// Re-issue an OTP. For signup/register the pending password hash is kept by
// issuing with the latest pending record's hash (handled via 'reset' style).
// We simply re-issue for 'reset'; for signup/register the client re-submits
// the original form, so this endpoint only serves 'reset' resends.
export async function POST(req: Request) {
  try {
    await ensureDb();
    const { mobile, purpose, password } = await req.json();
    if (!isValidMobile(mobile || "")) {
      return NextResponse.json({ error: "Invalid mobile number." }, { status: 400 });
    }
    const p: OtpPurpose = purpose === "signup" || purpose === "register" ? purpose : "reset";
    let pendingHash: string | undefined;
    if ((p === "signup" || p === "register") && password) {
      // Lazy import to keep hashing server-side only.
      const { hashPassword } = await import("@/lib/crypto");
      pendingHash = hashPassword(password);
    }
    const issued = await issueOtp(mobile, p, pendingHash);
    if (!issued.ok) {
      return NextResponse.json({ error: issued.error, waitSeconds: issued.waitSeconds }, { status: 429 });
    }
    return NextResponse.json({ ok: true, devOtp: issued.devOtp });
  } catch (e) {
    console.error("resend-otp", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
