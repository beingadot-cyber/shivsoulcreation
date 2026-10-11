"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Eye,
  EyeOff,
  Flower2,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  KeyRound,
  PartyPopper,
} from "lucide-react";

const MOBILE_RE = /^[6-9]\d{9}$/;
export const SESSION_EVENT = "ssc:session-changed";
export const AUTH_CLOSED_EVENT = "ssc:auth-closed";

export function openAuthModal(mode: "signup" | "login" = "login") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ssc:auth", { detail: mode }));
  }
}

type View = "signup" | "login" | "otp" | "forgot" | "reset";

function pwOk(pw: string) {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}

function strength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-gold", "bg-sage"];
  return { score, label: labels[score], color: colors[score] };
}

export default function AuthModal({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("signup");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  // signup state
  const [mobile, setMobile] = useState("");
  const [masked, setMasked] = useState(false);
  const [mobile2, setMobile2] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // login state
  const [lMobile, setLMobile] = useState("");
  const [lPw, setLPw] = useState("");
  const [showLPw, setShowLPw] = useState(false);

  // otp state
  const [otpPurpose, setOtpPurpose] = useState<"signup" | "register">("signup");
  const [otpMobile, setOtpMobile] = useState("");
  const [otpPassword, setOtpPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [resendIn, setResendIn] = useState(30);

  // forgot/reset state
  const [fpMobile, setFpMobile] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPw, setResetPw] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);

  const resetAll = useCallback((mode: "signup" | "login") => {
    setView(mode);
    setError("");
    setInfo("");
    setBusy(false);
    setMasked(false);
    setOtp("");
    setDevOtp("");
    setResendIn(30);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail === "signup" ? "signup" : "login";
      resetAll(mode);
      setOpen(true);
    };
    window.addEventListener("ssc:auth", handler);
    return () => window.removeEventListener("ssc:auth", handler);
  }, [resetAll]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new Event(AUTH_CLOSED_EVENT));
  }, []);

  const finish = useCallback(() => {
    window.dispatchEvent(new Event(SESSION_EVENT));
    router.refresh();
    onSuccess?.();
    close();
  }, [router, onSuccess, close]);

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  /* ---------------- Signup ---------------- */
  const mobileValid = MOBILE_RE.test(mobile);
  const m2Match = mobile2.length === 10 && mobile2 === mobile;
  const pwValid = pwOk(pw);
  const pwMatch = pw2 === pw && pw2.length > 0;
  const canSignup = mobileValid && m2Match && pwValid && pwMatch;
  const pwStrength = strength(pw);

  async function handleSignup() {
    setBusy(true);
    setError("");
    const res = await post("/api/auth/signup", { mobile, password: pw });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOtpPurpose("signup");
    setOtpMobile(mobile);
    setOtpPassword(pw);
    setDevOtp(res.devOtp || "");
    setOtp("");
    setInfo("");
    setResendIn(30);
    setView("otp");
  }

  /* ---------------- Login ---------------- */
  const canLogin = MOBILE_RE.test(lMobile) && lPw.length > 0;

  async function handleLogin() {
    setBusy(true);
    setError("");
    const res = await post("/api/auth/login", { mobile: lMobile, password: lPw });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.status === "logged-in") {
      finish();
      return;
    }
    // New customer → automatic registration with OTP
    setOtpPurpose("register");
    setOtpMobile(lMobile);
    setOtpPassword(lPw);
    setDevOtp(res.devOtp || "");
    setOtp("");
    setInfo(
      "This number is new here — we'll create your account after a quick OTP verification."
    );
    setResendIn(30);
    setView("otp");
  }

  /* ---------------- OTP ---------------- */
  async function handleVerifyOtp() {
    setBusy(true);
    setError("");
    const res = await post("/api/auth/verify-otp", {
      mobile: otpMobile,
      otp,
      purpose: otpPurpose,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    finish();
  }

  async function handleResend() {
    setError("");
    const res = await post("/api/auth/resend-otp", {
      mobile: otpMobile,
      purpose: otpPurpose,
      password: otpPassword,
    });
    if (res.error) {
      setError(res.error);
      if (res.waitSeconds) setResendIn(res.waitSeconds);
      return;
    }
    setDevOtp(res.devOtp || "");
    setResendIn(30);
  }

  /* ---------------- Forgot / Reset ---------------- */
  const canForgot = MOBILE_RE.test(fpMobile);

  async function handleForgot() {
    setBusy(true);
    setError("");
    const res = await post("/api/auth/forgot", { mobile: fpMobile });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDevOtp(res.devOtp || "");
    setResetOtp("");
    setResetPw("");
    setResendIn(30);
    setView("reset");
  }

  const canReset = resetOtp.length === 6 && pwOk(resetPw);

  async function handleReset() {
    setBusy(true);
    setError("");
    const res = await post("/api/auth/reset", {
      mobile: fpMobile,
      otp: resetOtp,
      password: resetPw,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    finish();
  }

  async function handleResendReset() {
    setError("");
    const res = await post("/api/auth/forgot", { mobile: fpMobile });
    if (res.error) {
      setError(res.error);
      if (res.waitSeconds) setResendIn(res.waitSeconds);
      return;
    }
    setDevOtp(res.devOtp || "");
    setResendIn(30);
  }

  if (!open) return null;

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 10);
  const preventPaste = (e: React.ClipboardEvent) => e.preventDefault();

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-plum/50 backdrop-blur-[2px] transition-opacity" onClick={close} />
      <div className="relative z-10 max-h-[94dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white shadow-2xl sm:mx-4 sm:max-w-md sm:rounded-3xl">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blush text-rosedeep transition hover:bg-blushdeep"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-8 sm:p-8">
          {/* Brand header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blush text-rose">
              <Flower2 className="h-6 w-6" strokeWidth={1.6} />
            </span>
            {view === "signup" && (
              <>
                <h2 className="font-display text-xl font-semibold text-plum">
                  Welcome to Shiv Soul Creations!
                </h2>
                <p className="mt-1 text-sm text-plumsoft">
                  Create your account to explore our collection.
                </p>
              </>
            )}
            {view === "login" && (
              <>
                <h2 className="font-display text-xl font-semibold text-plum">Welcome back</h2>
                <p className="mt-1 text-sm text-plumsoft">
                  Log in with your mobile number to continue.
                </p>
              </>
            )}
            {view === "otp" && (
              <>
                <h2 className="font-display text-xl font-semibold text-plum">Verify your number</h2>
                <p className="mt-1 text-sm text-plumsoft">
                  Enter the 6-digit OTP sent to +91 {otpMobile}
                </p>
              </>
            )}
            {view === "forgot" && (
              <>
                <h2 className="font-display text-xl font-semibold text-plum">Forgot password</h2>
                <p className="mt-1 text-sm text-plumsoft">
                  We&apos;ll send an OTP to your registered mobile number.
                </p>
              </>
            )}
            {view === "reset" && (
              <>
                <h2 className="font-display text-xl font-semibold text-plum">Reset password</h2>
                <p className="mt-1 text-sm text-plumsoft">
                  Enter the OTP sent to +91 {fpMobile} and choose a new password.
                </p>
              </>
            )}
          </div>

          {info && (
            <div className="mb-4 rounded-xl bg-blush px-4 py-3 text-xs font-semibold text-rosedeep">
              {info}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}
          {devOtp && (view === "otp" || view === "reset") && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-gold/30 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                Demo mode: your OTP is <span className="font-mono text-sm font-bold tracking-widest">{devOtp}</span>
                <span className="block font-medium opacity-80">(Sent via SMS in production)</span>
              </span>
            </div>
          )}

          {/* ---------------- SIGNUP VIEW ---------------- */}
          {view === "signup" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSignup) handleSignup();
              }}
              autoComplete="off"
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="su-mobile">Mobile Number</label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-plumsoft">+91</span>
                  <input
                    id="su-mobile"
                    className="input pl-12 font-mono tracking-wider"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="10-digit mobile number"
                    value={masked ? "•".repeat(mobile.length) : mobile}
                    onFocus={() => setMasked(false)}
                    onChange={(e) => {
                      const v = onlyDigits(e.target.value.replace(/•/g, ""));
                      if (!masked) setMobile(v);
                    }}
                    onPaste={preventPaste}
                    onCopy={preventPaste}
                    autoComplete="off"
                    maxLength={10}
                  />
                </div>
                {mobile.length === 10 && !mobileValid && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">Enter a valid 10-digit mobile number.</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="su-mobile2">Confirm Mobile Number</label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-plumsoft">+91</span>
                  <input
                    id="su-mobile2"
                    className="input pl-12 font-mono tracking-wider"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Re-enter mobile number"
                    value={mobile2}
                    onFocus={() => mobile.length > 0 && setMasked(true)}
                    onChange={(e) => setMobile2(onlyDigits(e.target.value))}
                    onPaste={preventPaste}
                    autoComplete="off"
                    maxLength={10}
                  />
                </div>
                {mobile2.length === 10 && mobile2 !== mobile && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">Mobile numbers do not match.</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="su-pw">Create Password</label>
                <div className="relative">
                  <input
                    id="su-pw"
                    className="input pr-11"
                    type={showPw ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-plumsoft transition hover:text-plum"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pw.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < pwStrength.score ? pwStrength.color : "bg-plum/10"}`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-plumsoft">
                      Strength: {pwStrength.label} · Use 8+ characters with letters & numbers
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label" htmlFor="su-pw2">Confirm Password</label>
                <div className="relative">
                  <input
                    id="su-pw2"
                    className="input pr-11"
                    type={showPw2 ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showPw2 ? "Hide password" : "Show password"}
                    onClick={() => setShowPw2((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-plumsoft transition hover:text-plum"
                  >
                    {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pw2.length > 0 && pw2 !== pw && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">Passwords do not match.</p>
                )}
              </div>

              {/* Sign Up button only appears when every condition passes */}
              {canSignup && (
                <button type="submit" disabled={busy} className="btn-dark w-full py-3 text-base">
                  {busy ? "Sending OTP…" : "Sign Up"}
                </button>
              )}

              <p className="pt-1 text-center text-sm text-plumsoft">
                Already an old user?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetAll("login");
                  }}
                  className="cursor-pointer font-bold text-rose underline-offset-2 hover:underline"
                >
                  Log in here.
                </button>
              </p>
            </form>
          )}

          {/* ---------------- LOGIN VIEW ---------------- */}
          {view === "login" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canLogin) handleLogin();
              }}
              autoComplete="off"
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="li-mobile">Mobile Number</label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-plumsoft">+91</span>
                  <input
                    id="li-mobile"
                    className="input pl-12 font-mono tracking-wider"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="10-digit mobile number"
                    value={lMobile}
                    onChange={(e) => setLMobile(onlyDigits(e.target.value))}
                    autoComplete="off"
                    maxLength={10}
                  />
                </div>
                {lMobile.length === 10 && !MOBILE_RE.test(lMobile) && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">Enter a valid 10-digit mobile number.</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="li-pw">Password</label>
                <div className="relative">
                  <input
                    id="li-pw"
                    className="input pr-11"
                    type={showLPw ? "text" : "password"}
                    placeholder="Your password"
                    value={lPw}
                    onChange={(e) => setLPw(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showLPw ? "Hide password" : "Show password"}
                    onClick={() => setShowLPw((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-plumsoft transition hover:text-plum"
                  >
                    {showLPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={!canLogin || busy} className="btn-rose w-full py-3 text-base">
                {busy ? "Please wait…" : "Continue"}
              </button>
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setFpMobile(lMobile);
                    setView("forgot");
                  }}
                  className="cursor-pointer text-sm font-semibold text-rose underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              </p>
            </form>
          )}

          {/* ---------------- OTP VIEW ---------------- */}
          {view === "otp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (otp.length === 6) handleVerifyOtp();
              }}
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="otp">One-Time Password</label>
                <input
                  id="otp"
                  className="input text-center font-mono text-xl tracking-[0.5em]"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={otp.length !== 6 || busy} className="btn-dark w-full py-3 text-base">
                {busy ? "Verifying…" : otpPurpose === "register" ? "Verify & Create Account" : "Verify & Sign Up"}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setView(otpPurpose === "signup" ? "signup" : "login");
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 font-semibold text-plumsoft hover:text-plum"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {resendIn > 0 ? (
                  <span className="text-plumsoft">Resend OTP in {resendIn}s</span>
                ) : (
                  <button type="button" onClick={handleResend} className="cursor-pointer font-bold text-rose hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ---------------- FORGOT VIEW ---------------- */}
          {view === "forgot" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canForgot) handleForgot();
              }}
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="fp-mobile">Registered Mobile Number</label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-plumsoft">+91</span>
                  <input
                    id="fp-mobile"
                    className="input pl-12 font-mono tracking-wider"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="10-digit mobile number"
                    value={fpMobile}
                    onChange={(e) => setFpMobile(onlyDigits(e.target.value))}
                    maxLength={10}
                  />
                </div>
              </div>
              <button type="submit" disabled={!canForgot || busy} className="btn-rose w-full py-3 text-base">
                <Smartphone className="h-4 w-4" /> {busy ? "Sending…" : "Send OTP"}
              </button>
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setView("login");
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-plumsoft hover:text-plum"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </button>
              </p>
            </form>
          )}

          {/* ---------------- RESET VIEW ---------------- */}
          {view === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canReset) handleReset();
              }}
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="r-otp">One-Time Password</label>
                <input
                  id="r-otp"
                  className="input text-center font-mono text-xl tracking-[0.5em]"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
                <p className="mt-1.5 text-right">
                  {resendIn > 0 ? (
                    <span className="text-xs text-plumsoft">Resend OTP in {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResendReset} className="cursor-pointer text-xs font-bold text-rose hover:underline">
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
              <div>
                <label className="label" htmlFor="r-pw">New Password</label>
                <div className="relative">
                  <input
                    id="r-pw"
                    className="input pr-11"
                    type={showResetPw ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={resetPw}
                    onChange={(e) => setResetPw(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showResetPw ? "Hide password" : "Show password"}
                    onClick={() => setShowResetPw((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-plumsoft transition hover:text-plum"
                  >
                    {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetPw.length > 0 && !pwOk(resetPw) && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">
                    Use at least 8 characters with letters and numbers.
                  </p>
                )}
              </div>
              <button type="submit" disabled={!canReset || busy} className="btn-dark w-full py-3 text-base">
                <KeyRound className="h-4 w-4" /> {busy ? "Resetting…" : "Reset Password & Log In"}
              </button>
            </form>
          )}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-plumsoft/80">
            <PartyPopper className="h-3.5 w-3.5" /> Handcrafted with love in India
          </p>
        </div>
      </div>
    </div>
  );
}
