"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewContentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", type: "VIDEO",
    url: "", isPublished: false, accessByRank: "", accessByPlan: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    router.push("/dashboard/content");
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/dashboard/content" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Content Library
      </Link>
      <div className="card p-6">
        <h1 className="page-title mb-6">Add Content</h1>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div className="form-group">
            <label className="label label-required">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="input" placeholder="e.g. Beginner Yoga Flow" required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label label-required">Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="select">
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document</option>
                <option value="ARTICLE">Article</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">URL / Link</label>
              <input value={form.url} onChange={(e) => set("url", e.target.value)} className="input" placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Restrict by Rank</label>
              <input value={form.accessByRank} onChange={(e) => set("accessByRank", e.target.value)} className="input" placeholder="e.g. Blue Belt" />
            </div>
            <div className="form-group">
              <label className="label">Restrict by Plan</label>
              <input value={form.accessByPlan} onChange={(e) => set("accessByPlan", e.target.value)} className="input" placeholder="e.g. Premium" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-700">Publish immediately</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Adding..." : "Add Content"}</button>
            <Link href="/dashboard/content" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
