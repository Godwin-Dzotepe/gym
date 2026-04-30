"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Save, CheckCircle2, Users } from "lucide-react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import PasswordInput from "@/components/ui/PasswordInput";

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  planType: string;
}

const CYCLE_LABEL: Record<string, string> = { DAILY: "/day", WEEKLY: "/wk", MONTHLY: "/mo", YEARLY: "/yr" };


interface Props {
  defaultValues?: Record<string, any>;
  memberId?: string;
}

export default function MemberForm({ defaultValues, memberId }: Props) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId   = searchParams.get("familyId");
  const familyLastName = searchParams.get("lastName");
  const familyPlanId   = searchParams.get("planId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(familyPlanId ?? "");
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [planEndDate, setPlanEndDate] = useState("");
  const [planDiscount, setPlanDiscount] = useState("");
  const [planPaymentMethod, setPlanPaymentMethod] = useState("MANUAL");

  useEffect(() => {
    fetch("/api/plans").then(r => r.json()).then((data: Plan[]) => {
      setPlans(data);
      if (familyPlanId && !selectedPlanId) setSelectedPlanId(familyPlanId);
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? familyLastName ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    dateOfBirth: defaultValues?.dateOfBirth ? defaultValues.dateOfBirth.split("T")[0] : "",
    gender: defaultValues?.gender ?? "",
    address: defaultValues?.address ?? "",
    city: defaultValues?.city ?? "",
    emergencyName: defaultValues?.emergencyName ?? "",
    emergencyPhone: defaultValues?.emergencyPhone ?? "",
    emergencyRelation: defaultValues?.emergencyRelation ?? "",
    notes: defaultValues?.notes ?? "",
    status: defaultValues?.status ?? "ACTIVE",
    password: "",
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(memberId ? `/api/members/${memberId}` : "/api/members", {
        method: memberId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      const newMemberId = memberId ?? data.id;
      // Assign plan if selected (new members only)
      if (selectedPlanId) {
        await fetch("/api/members/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: newMemberId, planId: selectedPlanId, startDate: planStartDate, endDate: planEndDate || undefined, paymentMethod: planPaymentMethod, discount: planDiscount || 0 }),
        });
      }
      // Auto-add to family if coming from family account flow
      if (!memberId && familyId) {
        await fetch(`/api/families/${familyId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: newMemberId, relationship: "FAMILY_MEMBER" }),
        });
      }
      router.push(`/dashboard/members/${newMemberId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const sections = [
    {
      title: "Personal Information",
      fields: [
        [
          { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
          { name: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Doe" },
        ],
        [
          { name: "email", label: "Email Address", type: "email", required: true, placeholder: "john@example.com" },
          { name: "phone", label: "Phone Number", type: "tel", placeholder: "+1 555 0100" },
        ],
        [
          { name: "dateOfBirth", label: "Date of Birth", type: "date" },
          { name: "gender", label: "Gender", type: "select", options: ["", "Male", "Female", "Other", "Prefer not to say"] },
        ],
        [
          { name: "address", label: "Address", type: "text", placeholder: "123 Main Street" },
          { name: "city", label: "City", type: "text", placeholder: "New York" },
        ],
      ],
    },
    {
      title: "Emergency Contact",
      fields: [
        [
          { name: "emergencyName", label: "Full Name", type: "text", placeholder: "Jane Doe" },
          { name: "emergencyPhone", label: "Phone", type: "tel", placeholder: "+1 555 0200" },
        ],
        [
          { name: "emergencyRelation", label: "Relationship", type: "text", placeholder: "Spouse / Parent" },
          { name: "status", label: "Account Status", type: "select", options: ["ACTIVE", "PENDING", "FROZEN", "CANCELLED"] },
        ],
      ],
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {familyId && (
        <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
          <Users className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-800">Adding family member</p>
            <p className="text-xs text-violet-600">Last name and plan are pre-filled. This member will be linked to the family account automatically.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.title} className="card p-6">
          <h3 className="section-title mb-5 pb-3 border-b border-slate-100">{section.title}</h3>
          <div className="space-y-4">
            {section.fields.map((row, ri) => (
              <div key={ri} className={`grid gap-4 ${row.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {row.map((field) => {
                  const f = field as any;
                  return (
                  <div key={field.name} className="form-group">
                    <label className={`label ${f.required ? "label-required" : ""}`}>
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={(form as any)[field.name]}
                        onChange={(e) => set(field.name, e.target.value)}
                        className="select"
                      >
                        {f.options?.map((o: string) => (
                          <option key={o} value={o}>{o || "Select..."}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={(form as any)[field.name]}
                        onChange={(e) => set(field.name, e.target.value)}
                        placeholder={f.placeholder}
                        required={f.required}
                        className="input"
                      />
                    )}
                  </div>
                );})}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Membership Plan */}
      <div className="card p-6">
          <h3 className="section-title mb-1 pb-3 border-b border-slate-100">
            {memberId ? "Add Membership Plan" : "Membership Plan"}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {memberId ? "Assign a new plan to this member. Leave unselected to skip." : "Optional — assign a plan now or do it later from the member profile."}
          </p>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No plans available. <a href="/dashboard/billing/plans/new" className="text-indigo-600 hover:underline">Create a plan first.</a></p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* No plan option */}
                <button type="button" onClick={() => setSelectedPlanId("")}
                  className={`border-2 rounded-xl px-4 py-3 text-left transition-all ${
                    selectedPlanId === "" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">No Plan</p>
                      <p className="text-xs text-gray-400">Assign later</p>
                    </div>
                    {selectedPlanId === "" && <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                  </div>
                </button>
                {plans.map(p => (
                  <button key={p.id} type="button" onClick={() => setSelectedPlanId(p.id)}
                    className={`border-2 rounded-xl px-4 py-3 text-left transition-all ${
                      selectedPlanId === p.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.planType.charAt(0) + p.planType.slice(1).toLowerCase().replace("_", "-")}</p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        <span className={`font-semibold text-sm ${selectedPlanId === p.id ? "text-indigo-600" : "text-gray-700"}`}>
                          {formatCurrency(p.price)}<span className="text-xs font-normal text-gray-400">{CYCLE_LABEL[p.billingCycle]}</span>
                        </span>
                        {selectedPlanId === p.id && <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPlanId && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="label">Start Date</label>
                      <input type="date" className="input" value={planStartDate}
                        onChange={e => setPlanStartDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="label">End Date <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="date" className="input" value={planEndDate}
                        onChange={e => setPlanEndDate(e.target.value)}
                        placeholder="Leave blank to auto-calculate" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="label">Discount Amount <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="number" min="0" step="0.01" className="input" value={planDiscount}
                        onChange={e => setPlanDiscount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="form-group">
                      <label className="label">Payment Method</label>
                      <select className="select" value={planPaymentMethod} onChange={e => setPlanPaymentMethod(e.target.value)}>
                        <option value="MANUAL">Manual Payment</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Notes */}
      <div className="card p-6">
        <h3 className="section-title mb-5 pb-3 border-b border-slate-100">Internal Notes</h3>
        <div className="form-group">
          <label className="label">Staff Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Internal notes visible only to staff..."
            className="input resize-none"
          />
          <p className="form-hint">Only visible to admin and staff</p>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h3 className="section-title mb-5 pb-3 border-b border-slate-100">
          {memberId ? "Change Password" : "Account Access"}
        </h3>
        <div className="form-group max-w-sm">
          <label className="label">
            {memberId ? <>New Password <span className="text-gray-400 font-normal">(optional)</span></> : "Temporary Password"}
          </label>
          <PasswordInput
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={memberId ? "Leave blank to keep current password" : "Leave blank for default (Gym@1234)"}
            className="input"
          />
          <p className="form-hint">
            {memberId ? "Enter a new password to update the member's login" : "Member should change this after first login"}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {memberId ? "Save Changes" : "Create Member"}
        </button>
      </div>
    </form>
  );
}
