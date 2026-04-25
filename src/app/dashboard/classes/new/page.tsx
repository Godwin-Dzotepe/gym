"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewClassPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", location: "", zoomLink: "",
    startTime: "", endTime: "", capacity: "", color: "#4f46e5",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    router.push("/dashboard/classes");
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/dashboard/classes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Classes
      </Link>
      <div className="card p-6">
        <h1 className="page-title mb-6">New Class</h1>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div className="form-group">
            <label className="label label-required">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="input" placeholder="e.g. Morning Yoga" required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} className="input" placeholder="Studio A" />
            </div>
            <div className="form-group">
              <label className="label">Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className="input" placeholder="Unlimited" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label label-required">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className="input" required />
            </div>
            <div className="form-group">
              <label className="label label-required">End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className="input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Zoom Link</label>
              <input value={form.zoomLink} onChange={(e) => set("zoomLink", e.target.value)} className="input" placeholder="https://zoom.us/j/..." />
            </div>
            <div className="form-group">
              <label className="label">Color</label>
              <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="input h-10 p-1 cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Creating..." : "Create Class"}</button>
            <Link href="/dashboard/classes" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
