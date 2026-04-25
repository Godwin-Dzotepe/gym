"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function MemberPhotoUpload({ memberId, photoUrl, initials }: { memberId: string; photoUrl: string | null; initials: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(photoUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch(`/api/members/${memberId}/photo`, { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { toast.error("Upload failed."); setPreview(photoUrl); return; }
    const data = await res.json();
    setPreview(data.photoUrl);
    toast.success("Photo updated.");
    router.refresh();
  }

  return (
    <div className="relative group cursor-pointer flex-shrink-0" onClick={() => inputRef.current?.click()}>
      <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 ring-2 ring-white shadow">
        {preview ? (
          <Image src={preview} alt="Profile" width={64} height={64} className="object-cover w-full h-full" unoptimized />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
