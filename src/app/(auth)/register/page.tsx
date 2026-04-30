"use client";

import { useState, useEffect } from "react";
import {
  Loader2, CheckCircle, ChevronRight, ChevronLeft,
  User, Lock, Dumbbell, CreditCard, ShieldCheck, Hash, Phone, Building2, Copy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PasswordInput from "@/components/ui/PasswordInput";

const INPUT = "w-full px-3.5 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition";
const LABEL = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

const STEPS = [
  { title: "Personal Info", icon: User },
  { title: "Password",      icon: Lock },
  { title: "Choose Plan",   icon: Dumbbell },
  { title: "Payment",       icon: CreditCard },
];

const CYCLE_LABELS: Record<string, string> = {
  DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly",
};
const CYCLE_PER: Record<string, string> = {
  DAILY: "/day", WEEKLY: "/week", MONTHLY: "/month", YEARLY: "/year",
};
interface PaymentSettings {
  paymentPhone: string | null;
  paymentAccountName: string | null;
  paymentAccountNumber: string | null;
  paymentBankName: string | null;
  paymentType: string | null;
  paymentInstructions: string | null;
}

interface Plan {
  id: string; name: string; description: string | null; isActive: boolean;
  price: number; dailyPrice: number | null; weeklyPrice: number | null;
  monthlyPrice: number | null; yearlyPrice: number | null; billingCycle: string; planType: string;
}

function getPlanCycles(plan: Plan): { cycle: string; price: number }[] {
  const result: { cycle: string; price: number }[] = [];
  if (plan.dailyPrice)   result.push({ cycle: "DAILY",   price: Number(plan.dailyPrice) });
  if (plan.weeklyPrice)  result.push({ cycle: "WEEKLY",  price: Number(plan.weeklyPrice) });
  if (plan.monthlyPrice) result.push({ cycle: "MONTHLY", price: Number(plan.monthlyPrice) });
  if (plan.yearlyPrice)  result.push({ cycle: "YEARLY",  price: Number(plan.yearlyPrice) });
  if (result.length === 0) result.push({ cycle: plan.billingCycle, price: Number(plan.price) });
  return result;
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", address: "",
    emergencyName: "", emergencyPhone: "",
    password: "", confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/plans")
      .then(r => r.json())
      .then((data: any) => {
        const arr = Array.isArray(data) ? data : (data.plans ?? []);
        setPlans(arr.filter((p: Plan) => p.isActive !== false));
      })
      .catch(() => {});
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: any) => setPaymentSettings(data))
      .catch(() => {});
  }, []);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function set(field: string, value: any) {
    setForm(p => ({ ...p, [field]: value }));
    setError("");
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const availableCycles = selectedPlan ? getPlanCycles(selectedPlan) : [];
  const selectedCyclePrice = availableCycles.find(c => c.cycle === selectedCycle)?.price ?? 0;

  function next() {
    setError("");
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.email) { setError("Please fill in all required fields."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Please enter a valid email address."); return; }
    }
    if (step === 1) {
      if (!form.password) { setError("Please enter a password."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    }
    if (step === 2) {
      if (!selectedPlanId) { setError("Please select a membership plan to continue."); return; }
      if (!selectedCycle)  { setError("Please select a billing frequency."); return; }
    }
    setStep(s => s + 1);
  }

  function back() { setError(""); setStep(s => s - 1); }

  function selectPlan(planId: string) {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const cycles = getPlanCycles(plan);
      setSelectedCycle(cycles[0]?.cycle ?? "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!waiverAccepted) { setError("You must accept the liability waiver to continue."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/members/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        waiverAccepted,
        planId: selectedPlanId || undefined,
        billingCycle: selectedCycle || undefined,
        transactionId: transactionId || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error ?? "Registration failed. Please try again.");
    else setSuccess(true);
  }

  return (
    <div className="relative min-h-screen w-screen overflow-y-auto">

      {/* ── Video background ── */}
      <video
        className="fixed inset-0 w-full h-full object-cover -z-10"
        src="/gym-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Fallback gradient shown behind video and when video fails to load */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 -z-20" />
      {/* Dark overlay on top of video */}
      <div className="fixed inset-0 bg-black/60 -z-10" />

      {/* ── Content ── */}
      <div className="flex flex-col items-center justify-start min-h-screen py-10 px-4">

        {success ? (
          <div className="w-full max-w-md text-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 space-y-5">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Registration Submitted!</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  Your account is <span className="text-orange-400 font-semibold">pending approval</span> by the gym admin.
                  {selectedPlan && (
                    <> An invoice for <span className="text-white font-medium">{selectedPlan.name}</span> has been created — complete payment at the gym.</>
                  )}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-left space-y-2 text-sm">
                <p className="text-gray-400">✓ Account created for <span className="text-white font-medium">{form.email}</span></p>
                <p className="text-gray-400">✓ Waiver signed digitally</p>
                {selectedPlan && (
                  <p className="text-gray-400">✓ Plan: <span className="text-white">{selectedPlan.name} — {CYCLE_LABELS[selectedCycle]}</span></p>
                )}
                <p className="text-gray-400">⏳ Awaiting admin approval</p>
              </div>

              {/* Transaction ID — non-deletable confirmation block */}
              {transactionId && (
                <div className="bg-orange-500/10 border-2 border-orange-400/40 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2">Payment Reference — Do Not Lose</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Transaction ID</p>
                      <p className="text-base font-mono font-bold text-white">{transactionId}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-orange-300/70 mt-3 leading-relaxed">
                    📸 Screenshot this page. Your transaction ID is your proof of payment and will be verified at the front desk when you visit the gym.
                  </p>
                </div>
              )}

              <Link href="/login" className="block w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition text-center">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 border-2 border-orange-400/70 shadow-xl shadow-orange-500/20 overflow-hidden bg-gray-800">
                <Image src="/gym-logo.png" alt="Gym" width={64} height={64} className="object-cover w-full h-full" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-wide">CREATE YOUR ACCOUNT</h1>
              <p className="text-orange-400 text-xs font-semibold tracking-widest uppercase mt-1">Member Registration</p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-1.5 mb-6 overflow-x-auto pb-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      done ? "bg-green-500/20 text-green-400" :
                      active ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-400/40" :
                      "bg-white/5 text-gray-500"
                    }`}>
                      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{s.title}</span>
                      <span className="sm:hidden">{i + 1}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`w-4 h-px flex-shrink-0 ${done ? "bg-green-500/40" : "bg-white/10"}`} />}
                  </div>
                );
              })}
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
              {error && (
                <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* ── Step 0: Personal Info ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="mb-1">
                    <p className="text-sm font-semibold text-white">Personal Information</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tell us about yourself</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={LABEL}>First Name <span className="text-orange-400">*</span></label>
                      <input value={form.firstName} onChange={e => set("firstName", e.target.value)} className={INPUT} placeholder="John" /></div>
                    <div><label className={LABEL}>Last Name <span className="text-orange-400">*</span></label>
                      <input value={form.lastName} onChange={e => set("lastName", e.target.value)} className={INPUT} placeholder="Doe" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={LABEL}>Email <span className="text-orange-400">*</span></label>
                      <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={INPUT} placeholder="john@example.com" /></div>
                    <div><label className={LABEL}>Phone</label>
                      <input value={form.phone} onChange={e => set("phone", e.target.value)} className={INPUT} placeholder="+1 234 567 8900" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={LABEL}>Date of Birth</label>
                      <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} className={INPUT} /></div>
                    <div><label className={LABEL}>Gender</label>
                      <select value={form.gender} onChange={e => set("gender", e.target.value)} className={INPUT + " [&>option]:bg-gray-900"}>
                        <option value="">Select gender</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select></div>
                  </div>
                  <div><label className={LABEL}>Address</label>
                    <input value={form.address} onChange={e => set("address", e.target.value)} className={INPUT} placeholder="123 Main St, City" /></div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Emergency Contact</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className={LABEL}>Full Name</label>
                        <input value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)} className={INPUT} placeholder="Jane Doe" /></div>
                      <div><label className={LABEL}>Phone</label>
                        <input value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)} className={INPUT} placeholder="+1 234 567 8900" /></div>
                    </div>
                  </div>
                  <button type="button" onClick={next} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── Step 1: Password ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="mb-1">
                    <p className="text-sm font-semibold text-white">Account Security</p>
                    <p className="text-xs text-gray-500 mt-0.5">Set a strong password for your account</p>
                  </div>
                  <div>
                    <label className={LABEL}>Password <span className="text-orange-400">*</span></label>
                    <PasswordInput value={form.password} onChange={e => set("password", e.target.value)} className={INPUT} iconClassName="text-white/50 hover:text-white/90" placeholder="Min. 8 characters" />
                    {form.password.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= i*3
                              ? i<=1?"bg-red-500":i<=2?"bg-yellow-500":i<=3?"bg-blue-500":"bg-green-500"
                              : "bg-white/10"
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>Confirm Password <span className="text-orange-400">*</span></label>
                    <PasswordInput value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} className={INPUT} iconClassName="text-white/50 hover:text-white/90" placeholder="Repeat your password" />
                    {form.confirmPassword.length > 0 && (
                      <p className={`text-xs mt-1.5 ${form.password === form.confirmPassword ? "text-green-400" : "text-red-400"}`}>
                        {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={back} className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button type="button" onClick={next} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Choose Plan ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="mb-1">
                    <p className="text-sm font-semibold text-white">Choose Your Membership</p>
                    <p className="text-xs text-gray-500 mt-0.5">Select a plan and how often you want to be billed</p>
                  </div>

                  {plans.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No plans available. Contact the gym.</p>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {plans.map(plan => {
                        const cycles = getPlanCycles(plan);
                        const isSelected = selectedPlanId === plan.id;
                        return (
                          <div key={plan.id} onClick={() => selectPlan(plan.id)}
                            className={`rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${
                              isSelected ? "border-orange-400 bg-orange-500/10" : "border-white/15 bg-white/5 hover:border-white/30"
                            }`}>
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-white">{plan.name}</p>
                                  {plan.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{plan.description}</p>}
                                </div>
                                {isSelected && <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />}
                              </div>

                              {isSelected && cycles.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                                  {cycles.map(({ cycle, price }) => (
                                    <button key={cycle} type="button"
                                      onClick={() => setSelectedCycle(cycle)}
                                      className={`rounded-xl border-2 py-3 px-3 text-center transition-all ${
                                        selectedCycle === cycle
                                          ? "border-orange-400 bg-orange-500/20"
                                          : "border-white/20 bg-white/5 hover:border-white/40"
                                      }`}>
                                      <p className="text-sm font-bold text-white">{price.toLocaleString()}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{CYCLE_LABELS[cycle]}{CYCLE_PER[cycle]}</p>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {!isSelected && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {cycles.map(({ cycle, price }) => (
                                    <span key={cycle} className="text-xs text-gray-400 bg-white/5 rounded-lg px-2 py-0.5">
                                      {price.toLocaleString()}{CYCLE_PER[cycle]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={back} className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button type="button" onClick={next} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Payment + Waiver ── */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="mb-1">
                    <p className="text-sm font-semibold text-white">Payment &amp; Confirmation</p>
                    <p className="text-xs text-gray-500 mt-0.5">Make your payment using the details below, then enter your transaction ID</p>
                  </div>

                  {/* Order summary */}
                  {selectedPlan && (
                    <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Summary</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{selectedPlan.name}</p>
                          <p className="text-xs text-gray-400">{CYCLE_LABELS[selectedCycle]} billing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-orange-400">{selectedCyclePrice.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500">{CYCLE_PER[selectedCycle]}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment details from admin settings */}
                  {paymentSettings && (paymentSettings.paymentPhone || paymentSettings.paymentAccountNumber) ? (
                    <div className="rounded-2xl border border-orange-400/30 bg-orange-500/5 overflow-hidden">
                      <div className="px-4 py-3 bg-orange-500/10 border-b border-orange-400/20">
                        <p className="text-xs font-bold text-orange-300 uppercase tracking-wider">Payment Details</p>
                      </div>
                      <div className="p-4 space-y-3">
                        {paymentSettings.paymentPhone && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-orange-400" />
                              <span className="text-xs text-gray-400">MoMo Number</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{paymentSettings.paymentPhone}</span>
                              <button type="button" onClick={() => copyToClipboard(paymentSettings.paymentPhone!, "phone")}
                                className="text-gray-500 hover:text-orange-400 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {copied === "phone" && <span className="text-[10px] text-orange-400">Copied!</span>}
                            </div>
                          </div>
                        )}
                        {paymentSettings.paymentAccountName && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Account Name</span>
                            <span className="text-sm font-semibold text-white">{paymentSettings.paymentAccountName}</span>
                          </div>
                        )}
                        {paymentSettings.paymentBankName && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-orange-400" />
                              <span className="text-xs text-gray-400">Bank</span>
                            </div>
                            <span className="text-sm font-semibold text-white">{paymentSettings.paymentBankName}</span>
                          </div>
                        )}
                        {paymentSettings.paymentAccountNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Account Number</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-white">{paymentSettings.paymentAccountNumber}</span>
                              <button type="button" onClick={() => copyToClipboard(paymentSettings.paymentAccountNumber!, "acc")}
                                className="text-gray-500 hover:text-orange-400 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {copied === "acc" && <span className="text-[10px] text-orange-400">Copied!</span>}
                            </div>
                          </div>
                        )}
                        {paymentSettings.paymentInstructions && (
                          <p className="text-xs text-orange-200/70 border-t border-orange-400/20 pt-3 mt-1 leading-relaxed">
                            {paymentSettings.paymentInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-sm text-gray-400">Payment details not configured yet.</p>
                      <p className="text-xs text-gray-500 mt-1">Please contact the gym directly to arrange payment.</p>
                    </div>
                  )}

                  {/* Transaction ID */}
                  <div>
                    <label className={LABEL}>Transaction ID <span className="text-orange-400">*</span></label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        className={INPUT + " pl-9"}
                        placeholder="Enter your payment transaction ID"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">This is shown on your payment receipt or confirmation SMS. Keep it as proof of payment.</p>
                  </div>

                  {/* Waiver */}
                  <div>
                    <p className={LABEL}>Liability Waiver</p>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 max-h-36 overflow-y-auto text-xs text-gray-400 leading-relaxed space-y-2 mb-3">
                      <p className="font-semibold text-gray-300">Assumption of Risk &amp; Release of Liability</p>
                      <p>I understand that participation in gym activities involves inherent risks of injury, including serious injury or death. I voluntarily assume all such risks and agree to release and hold harmless the gym, its owners, officers, employees, trainers, and agents from any and all liability, claims, or causes of action arising from my participation in gym activities or use of gym facilities.</p>
                      <p>I confirm that I am in good physical health and will consult a physician before beginning any exercise program if I have health concerns. I agree to follow all gym rules and use equipment properly. This waiver is binding upon myself and my heirs, executors, and assigns.</p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        waiverAccepted ? "bg-orange-500 border-orange-500" : "border-white/30 group-hover:border-orange-400/50"
                      }`} onClick={() => setWaiverAccepted(!waiverAccepted)}>
                        {waiverAccepted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-gray-300 select-none" onClick={() => setWaiverAccepted(!waiverAccepted)}>
                        I have read and agree to the liability waiver above. <span className="text-orange-400">*</span>
                      </span>
                    </label>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-300/80 leading-relaxed">
                      Your account will be <strong className="text-orange-300">reviewed and activated by the gym admin</strong> after your payment is confirmed. You will receive a message when approved.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={back} className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button type="submit" disabled={loading || !waiverAccepted || !transactionId.trim()}
                      className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {loading ? "Submitting…" : "Complete Registration"}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
