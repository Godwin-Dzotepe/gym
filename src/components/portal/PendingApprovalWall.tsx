"use client";

import { signOut } from "next-auth/react";
import { Clock, Dumbbell, CheckCircle2, Mail, LogOut } from "lucide-react";

export default function PendingApprovalWall({ firstName }: { firstName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-orange-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center border-2 border-gray-900">
              <Dumbbell className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-black text-white">
            {firstName ? `Hi, ${firstName}!` : "Almost there!"}
          </h1>
          <p className="text-orange-400 text-xs font-semibold tracking-widest uppercase mt-1">Account Pending Approval</p>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Your registration has been received and is currently being reviewed by the gym admin.
            You&apos;ll gain full access to your member portal once approved.
          </p>
        </div>

        {/* Status card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What happens next?</p>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, color: "text-green-400", text: "Registration submitted successfully" },
              { icon: Clock, color: "text-orange-400", text: "Admin reviews your application (within 24h)" },
              { icon: Mail, color: "text-blue-400", text: "Your account gets activated — you're in!" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i === 0 ? "bg-green-500/15" : i === 1 ? "bg-orange-500/15" : "bg-blue-500/15"
                }`}>
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <p className={`text-sm ${i === 0 ? "text-gray-300" : "text-gray-500"}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
