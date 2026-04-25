"use client";

import { useState, useRef } from "react";
import {
  Save, Loader2, Building2, Users, Bell, CreditCard,
  Zap, Mail, Phone, MapPin, Globe, Clock, BadgePercent,
  AlarmClock, Shield, Eye, UserCog, QrCode, Trophy,
  GitBranch, ShoppingBag, DoorOpen, Video, ChevronRight,
  BellRing, MessageSquare, Send, Upload, Search,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

const GYM_TYPES = ["FITNESS", "MARTIAL_ARTS", "YOGA", "DANCE", "PILATES", "GYMNASTICS", "CROSSFIT", "CLUB"];
const CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN", "KES", "ZAR"];
const TIMEZONES = [
  "Africa/Abidjan","Africa/Accra","Africa/Addis_Ababa","Africa/Cairo","Africa/Casablanca",
  "Africa/Johannesburg","Africa/Lagos","Africa/Nairobi","America/Anchorage","America/Chicago",
  "America/Denver","America/Los_Angeles","America/New_York","America/Phoenix","America/Sao_Paulo",
  "America/Toronto","Asia/Colombo","Asia/Dubai","Asia/Hong_Kong","Asia/Istanbul","Asia/Jakarta",
  "Asia/Karachi","Asia/Kolkata","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Tokyo",
  "Australia/Melbourne","Australia/Perth","Australia/Sydney","Europe/Amsterdam","Europe/Athens",
  "Europe/Berlin","Europe/Copenhagen","Europe/Dublin","Europe/Helsinki","Europe/Istanbul",
  "Europe/Lisbon","Europe/London","Europe/Madrid","Europe/Moscow","Europe/Oslo","Europe/Paris",
  "Europe/Rome","Europe/Stockholm","Europe/Warsaw","Europe/Zurich","Pacific/Auckland",
  "Pacific/Honolulu","UTC",
];

interface ToggleProps { value: boolean; onChange: (v: boolean) => void; label?: string; desc?: string; }
function Toggle({ value, onChange, label, desc }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`group flex items-center justify-between gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        value ? "border-indigo-200 bg-indigo-50/50" : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex-1 min-w-0">
        {label && <p className={`text-sm font-medium ${value ? "text-indigo-900" : "text-gray-800"}`}>{label}</p>}
        {desc  && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${value ? "bg-indigo-500" : "bg-gray-200"}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc, color = "indigo" }: { icon: any; title: string; desc: string; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    violet: "bg-violet-100 text-violet-600",
    sky: "bg-sky-100 text-sky-600",
    rose:   "bg-rose-100 text-rose-600",
    amber:  "bg-amber-100 text-amber-600",
  };
  return (
    <div className="flex items-center gap-4 pb-5 border-b border-gray-100 mb-6">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsForm({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("gym");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logo ?? null);
  const [tzSearch, setTzSearch] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [form, setForm] = useState({
    gymName:                   settings?.gymName                   ?? "",
    gymType:                   settings?.gymType                   ?? "FITNESS",
    address:                   settings?.address                   ?? "",
    phone:                     settings?.phone                     ?? "",
    email:                     settings?.email                     ?? "",
    currency:                  settings?.currency                  ?? "GHS",
    timezone:                  settings?.timezone                  ?? "Africa/Accra",
    enableBeltRanks:           settings?.enableBeltRanks           ?? false,
    enableReferrals:           settings?.enableReferrals           ?? true,
    enablePOS:                 settings?.enablePOS                 ?? true,
    enableFacilityAccess:      settings?.enableFacilityAccess      ?? false,
    enableZoom:                settings?.enableZoom                ?? false,
    portalEnabled:             settings?.portalEnabled             ?? true,
    portalAllowEditProfile:    settings?.portalAllowEditProfile    ?? true,
    portalVisitorAccess:       settings?.portalVisitorAccess       ?? false,
    portalShowPayments:        settings?.portalShowPayments        ?? true,
    portalShowMembershipCard:  settings?.portalShowMembershipCard  ?? true,
    portalAllowRemovePayment:  settings?.portalAllowRemovePayment  ?? false,
    portalAllowUpdateRank:     settings?.portalAllowUpdateRank     ?? false,
    portalShowPromotionCriteria: settings?.portalShowPromotionCriteria ?? false,
    taxRate:                   settings?.taxRate?.toString()       ?? "0",
    lateFeeDefault:            settings?.lateFeeDefault?.toString() ?? "0",
    lateFeeAfterDays:          settings?.lateFeeAfterDays?.toString() ?? "5",
    smtpHost:                  settings?.smtpHost                  ?? "",
    smtpPort:                  settings?.smtpPort?.toString()      ?? "",
    smtpUser:                  settings?.smtpUser                  ?? "",
    smtpPass:                  settings?.smtpPass                  ?? "",
    kioskPin:                  settings?.kioskPin                  ?? "1234",
    expiryNotifEnabled:        settings?.expiryNotifEnabled        ?? false,
    expiryNotifDays:           settings?.expiryNotifDays?.toString() ?? "7",
    expiryNotifEmail:          settings?.expiryNotifEmail          ?? true,
    expiryNotifSms:            settings?.expiryNotifSms            ?? false,
    expiryNotifEmailTemplate:  settings?.expiryNotifEmailTemplate  ?? "Hi {name}, your membership at {gym} expires in {days} day(s) on {date}. Please renew to keep access.",
    expiryNotifSmsTemplate:    settings?.expiryNotifSmsTemplate    ?? "Hi {name}, your {gym} membership expires in {days} day(s) on {date}. Renew now to stay active.",
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    setLoading(true);
    await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setLoading(false);
    toast.success("Settings saved successfully.");
  }

  async function sendTestEmail() {
    setTestEmailLoading(true);
    const res = await fetch("/api/settings/test-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: form.email }),
    });
    const d = await res.json();
    setTestEmailLoading(false);
    if (!res.ok) { toast.error(d.error ?? "Failed to send test email."); return; }
    toast.success(`Test email sent to ${d.sentTo}`);
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
    const d = await res.json();
    setLogoUploading(false);
    if (!res.ok) { toast.error(d.error ?? "Upload failed."); return; }
    setLogoPreview(d.logo + "?t=" + Date.now());
    toast.success("Logo updated.");
  }

  const filteredTz = tzSearch
    ? TIMEZONES.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase()))
    : TIMEZONES;

  const TABS = [
    { id: "gym",      label: "Gym Profile",    icon: Building2,  color: "indigo" },
    { id: "portal",   label: "Member Portal",  icon: Users,      color: "emerald" },
    { id: "billing",  label: "Billing",        icon: CreditCard, color: "violet" },
    { id: "features", label: "Features",       icon: Zap,        color: "orange" },
    { id: "notifications", label: "Notifications", icon: BellRing, color: "rose" },
    { id: "email",    label: "Email / SMTP",   icon: Bell,       color: "sky" },
  ];

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="flex gap-6 items-start">

      {/* ── Sidebar ── */}
      <div className="w-52 flex-shrink-0 space-y-1">
        {/* Gym card */}
        <div className="card p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-400/70 flex-shrink-0">
            <Image src={logoPreview ?? "/gym-logo.png"} alt="Logo" width={48} height={48} className="object-cover w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{form.gymName || "Your Gym"}</p>
            <p className="text-xs text-gray-400 capitalize">{form.gymType.replace("_", " ").toLowerCase()}</p>
          </div>
        </div>

        {TABS.map(t => {
          const isActive = tab === t.id;
          const iconColors: Record<string, string> = {
            indigo: "text-indigo-600 bg-indigo-100",
            emerald: "text-emerald-600 bg-emerald-100",
            violet: "text-violet-600 bg-violet-100",
            orange: "text-orange-600 bg-orange-100",
            sky: "text-sky-600 bg-sky-100",
          };
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? "bg-white/20 text-white" : iconColors[t.color]
              }`}>
                <t.icon className="w-3.5 h-3.5" />
              </div>
              <span className="flex-1 truncate">{t.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="card p-6">

          {/* ── Gym Profile ── */}
          {tab === "gym" && (
            <>
              <SectionHeader icon={Building2} title="Gym Profile" desc="Your gym's public information and branding" color="indigo" />
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="Gym Name">
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" value={form.gymName} onChange={e => set("gymName", e.target.value)} placeholder="The Oracle Gym" />
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Gym Type">
                    <select className="select" value={form.gymType} onChange={e => set("gymType", e.target.value)}>
                      {GYM_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Phone">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+233 20 000 0000" />
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Contact Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="info@yourgym.com" />
                    </div>
                  </FieldGroup>
                </div>
                <FieldGroup label="Address">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input pl-9" value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Gym Street, Accra" />
                  </div>
                </FieldGroup>

                <FieldGroup label="Gym Logo" hint="Replaces the logo shown in the sidebar and on receipts. JPEG, PNG, or WebP.">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-50">
                      <Image src={logoPreview ?? "/gym-logo.png"} alt="Logo" width={64} height={64} className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
                      <button type="button" onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                        className="btn-secondary text-sm">
                        {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {logoUploading ? "Uploading…" : "Upload New Logo"}
                      </button>
                    </div>
                  </div>
                </FieldGroup>

                <div className="border-t border-gray-100 pt-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Regional Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Currency">
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select className="select pl-9" value={form.currency} onChange={e => set("currency", e.target.value)}>
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Timezone">
                      <div className="relative mb-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className="input pl-9 text-sm" placeholder="Search timezone…"
                          value={tzSearch} onChange={e => setTzSearch(e.target.value)} />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                        <select className="select pl-9" value={form.timezone} onChange={e => set("timezone", e.target.value)}>
                          {filteredTz.map(tz => <option key={tz}>{tz}</option>)}
                        </select>
                      </div>
                    </FieldGroup>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Member Portal ── */}
          {tab === "portal" && (
            <>
              <SectionHeader icon={Users} title="Member Portal" desc="Control what members can access and do in their self-service portal" color="emerald" />
              <div className="space-y-3">
                <Toggle value={form.portalEnabled} onChange={v => set("portalEnabled", v)}
                  label="Enable Member Portal" desc="Allow members to log in to the self-service portal" />

                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-2">Access & Visibility</p>
                {[
                  { key: "portalAllowEditProfile",   icon: UserCog,  label: "Allow profile editing",           desc: "Members and visitors can update their own profile information" },
                  { key: "portalVisitorAccess",       icon: DoorOpen, label: "Visitor access",                  desc: "Non-members can access a limited version of the portal" },
                  { key: "portalShowPayments",        icon: CreditCard, label: "Show payments",                 desc: "Members can view their payment history and invoices" },
                  { key: "portalShowMembershipCard",  icon: QrCode,   label: "Show membership card",            desc: "Display a digital membership card with QR/barcode" },
                  { key: "portalAllowRemovePayment",  icon: Shield,   label: "Allow payment method removal",    desc: "Members can remove saved payment methods from their account" },
                  { key: "portalAllowUpdateRank",     icon: Trophy,   label: "Allow self rank updates",         desc: "Members can update their own belt rank or level" },
                  { key: "portalShowPromotionCriteria", icon: Eye,    label: "Show promotion criteria",         desc: "Display the requirements needed for the next rank promotion" },
                ].map(f => (
                  <Toggle key={f.key} value={(form as any)[f.key]} onChange={v => set(f.key, v)}
                    label={f.label} desc={f.desc} />
                ))}
              </div>
            </>
          )}

          {/* ── Billing ── */}
          {tab === "billing" && (
            <>
              <SectionHeader icon={CreditCard} title="Billing" desc="Configure default tax rates, late fees, and billing behaviour" color="violet" />
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldGroup label="Tax Rate (%)" hint="Applied automatically to new invoices">
                    <div className="relative">
                      <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" type="number" min="0" max="100" step="0.01"
                        value={form.taxRate} onChange={e => set("taxRate", e.target.value)} placeholder="0" />
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Default Late Fee" hint="Amount charged for overdue invoices">
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" type="number" min="0" step="0.01"
                        value={form.lateFeeDefault} onChange={e => set("lateFeeDefault", e.target.value)} placeholder="0.00" />
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Apply Late Fee After (days)" hint="Days past due before charging the fee">
                    <div className="relative">
                      <AlarmClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" type="number" min="1"
                        value={form.lateFeeAfterDays} onChange={e => set("lateFeeAfterDays", e.target.value)} placeholder="5" />
                    </div>
                  </FieldGroup>
                </div>

                {/* Summary card */}
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-3">Current Configuration</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-black text-violet-700">{form.taxRate}%</p>
                      <p className="text-xs text-violet-400 mt-0.5">Tax Rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-violet-700">{form.lateFeeDefault}</p>
                      <p className="text-xs text-violet-400 mt-0.5">Late Fee</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-violet-700">{form.lateFeeAfterDays}d</p>
                      <p className="text-xs text-violet-400 mt-0.5">Grace Period</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Features ── */}
          {tab === "features" && (
            <>
              <SectionHeader icon={Zap} title="Features" desc="Enable or disable system modules to customise your gym's workflow" color="orange" />
              <div className="space-y-3">
                {[
                  { key: "enableBeltRanks",      icon: Trophy,    label: "Belt / Rank System",       desc: "Track belt ranks, promotions, and grading history for martial arts or similar gyms" },
                  { key: "enableReferrals",       icon: GitBranch, label: "Referral Program",         desc: "Allow members to refer others and earn reward credits" },
                  { key: "enablePOS",             icon: ShoppingBag, label: "Point of Sale (POS)",   desc: "Enable the product sales system with inventory management" },
                  { key: "enableFacilityAccess",  icon: DoorOpen,  label: "Facility Access Control", desc: "Integrate with door access hardware for automated entry" },
                  { key: "enableZoom",            icon: Video,     label: "Zoom Integration",        desc: "Attach Zoom meeting links to virtual and hybrid classes" },
                ].map(f => (
                  <Toggle key={f.key} value={(form as any)[f.key]} onChange={v => set(f.key, v)}
                    label={f.label} desc={f.desc} />
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <FieldGroup label="Kiosk Passcode" hint="4-digit PIN required to unlock the kiosk check-in screen (default: 1234)">
                  <input className="input w-32 font-mono tracking-widest text-center" maxLength={4} value={form.kioskPin}
                    onChange={e => set("kioskPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1234" />
                </FieldGroup>
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <>
              <SectionHeader icon={BellRing} title="Membership Expiry Notifications" desc="Automatically alert members before their membership expires via email and/or SMS" color="rose" />

              <div className="space-y-5">
                <Toggle
                  value={form.expiryNotifEnabled}
                  onChange={v => set("expiryNotifEnabled", v)}
                  label="Enable Expiry Notifications"
                  desc="Send reminders to members before their plan end date"
                />

                {form.expiryNotifEnabled && (
                  <>
                    {/* Timing */}
                    <FieldGroup
                      label="Notify how many days before expiry"
                      hint="The system will send a reminder on Day 1 of the countdown, Day 4, and on the expiry day itself. Members who have already renewed will not receive further messages."
                    >
                      <div className="flex items-center gap-3">
                        <input
                          className="input w-24 text-center text-lg font-semibold"
                          type="number" min="1" max="90"
                          value={form.expiryNotifDays}
                          onChange={e => set("expiryNotifDays", e.target.value)}
                        />
                        <span className="text-sm text-gray-500">days before expiry</span>
                      </div>
                    </FieldGroup>

                    {/* Schedule preview */}
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-3">Notification Schedule Preview</p>
                      <div className="space-y-2">
                        {(() => {
                          const days = parseInt(form.expiryNotifDays) || 7;
                          const schedule = [
                            { label: `Day 1 (${days} days before expiry)`, desc: "First warning sent", color: "bg-orange-400" },
                            { label: `Day 4 (${Math.max(1, days - 3)} days before expiry)`, desc: "Reminder sent", color: "bg-amber-400" },
                            { label: "Expiry day", desc: "Final notice — membership has expired", color: "bg-red-500" },
                          ];
                          return schedule.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                              <div>
                                <span className="text-xs font-semibold text-gray-800">{s.label}</span>
                                <span className="text-xs text-gray-500 ml-2">— {s.desc}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                      <p className="text-xs text-rose-500 mt-3">✓ Members who renew/pay will be automatically removed from the reminder list.</p>
                      <p className="text-xs text-gray-400 mt-1">The system checks daily. You can also trigger it manually from <code className="bg-white px-1 rounded">GET /api/cron/expiry-notifications</code>.</p>
                    </div>

                    {/* Channels */}
                    <div>
                      <p className="label mb-2">Send via</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Toggle
                          value={form.expiryNotifEmail}
                          onChange={v => set("expiryNotifEmail", v)}
                          label="Email"
                          desc="Send via configured SMTP"
                        />
                        <Toggle
                          value={form.expiryNotifSms}
                          onChange={v => set("expiryNotifSms", v)}
                          label="SMS"
                          desc="Requires SMS API key"
                        />
                      </div>
                    </div>

                    {/* Email template */}
                    {form.expiryNotifEmail && (
                      <FieldGroup
                        label="Email Message Template"
                        hint="Variables: {name} {gym} {days} {date} {plan}"
                      >
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            className="input pl-9 resize-none"
                            rows={4}
                            value={form.expiryNotifEmailTemplate}
                            onChange={e => set("expiryNotifEmailTemplate", e.target.value)}
                          />
                        </div>
                      </FieldGroup>
                    )}

                    {/* SMS template */}
                    {form.expiryNotifSms && (
                      <FieldGroup
                        label="SMS Message Template"
                        hint="Keep under 160 characters. Variables: {name} {gym} {days} {date} {plan}"
                      >
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            className="input pl-9 resize-none"
                            rows={3}
                            value={form.expiryNotifSmsTemplate}
                            onChange={e => set("expiryNotifSmsTemplate", e.target.value)}
                            maxLength={320}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {form.expiryNotifSmsTemplate.length} / 160 chars (2 SMS if over 160)
                        </p>
                      </FieldGroup>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ── Email ── */}
          {tab === "email" && (
            <>
              <SectionHeader icon={Bell} title="Email / SMTP" desc="Configure an outgoing mail server to send billing alerts, notifications, and receipts" color="sky" />
              <div className="space-y-4">
                <FieldGroup label="SMTP Host">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input pl-9" value={form.smtpHost} onChange={e => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
                  </div>
                </FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Port" hint="Usually 587 (TLS) or 465 (SSL)">
                    <input className="input" type="number" value={form.smtpPort} onChange={e => set("smtpPort", e.target.value)} placeholder="587" />
                  </FieldGroup>
                  <FieldGroup label="Username / Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input pl-9" value={form.smtpUser} onChange={e => set("smtpUser", e.target.value)} placeholder="you@gmail.com" />
                    </div>
                  </FieldGroup>
                </div>
                <FieldGroup label="App Password" hint="Use an app-specific password, not your main account password">
                  <input className="input" type="password" value={form.smtpPass} onChange={e => set("smtpPass", e.target.value)} placeholder="••••••••••••••••" />
                </FieldGroup>

                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-start gap-3">
                  <Bell className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-sky-800">Gmail tip</p>
                    <p className="text-xs text-sky-600 mt-0.5">Enable 2-Factor Authentication on your Google account, then generate an App Password at myaccount.google.com/apppasswords. Use that as the password above.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={sendTestEmail} disabled={testEmailLoading}
                    className="btn-secondary">
                    {testEmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {testEmailLoading ? "Sending…" : "Send Test Email"}
                  </button>
                  <p className="text-xs text-gray-400">Sends a test message to <span className="font-medium text-gray-600">{form.email || form.smtpUser || "your contact email"}</span></p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Save bar */}
        <div className="card px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Editing <span className="font-medium text-gray-700">{activeTab.label}</span>
          </p>
          <button onClick={save} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
