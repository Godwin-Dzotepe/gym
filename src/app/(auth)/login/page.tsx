"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=80",
    quote: "Where Champions Are Made",
    sub: "Your fitness journey starts here",
  },
  {
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1080&q=80",
    quote: "Push Beyond Your Limits",
    sub: "Train hard. Stay consistent.",
  },
  {
    src: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1080&q=80",
    quote: "Stronger Every Day",
    sub: "Expert trainers. Real results.",
  },
  {
    src: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=1080&q=80",
    quote: "Join The Community",
    sub: "500+ members and growing.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex">

      {/* ── Left: Form panel ── */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center px-8 sm:px-12 bg-gray-950 relative z-10">
        {/* Logo */}
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-full border-2 border-orange-400/70 shadow-xl shadow-orange-500/20 overflow-hidden mb-4">
              <Image src="/gym-logo.png" alt="The Oracle Gym" width={80} height={80} className="object-cover w-full h-full" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">THE ORACLE GYM</h1>
            <p className="text-orange-400 text-xs font-semibold tracking-widest uppercase mt-1">Management System</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-white mb-6">Sign in to your account</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-gray-400">
                New member?{" "}
                <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Image carousel ── */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        {/* Slides */}
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Slide text */}
        <div className="absolute bottom-16 left-10 right-10">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="absolute bottom-0 left-0 right-0 transition-all duration-700"
              style={{ opacity: i === current ? 1 : 0, transform: i === current ? "translateY(0)" : "translateY(8px)" }}
            >
              <p className="text-3xl font-black text-white leading-tight drop-shadow-lg">{slide.quote}</p>
              <p className="text-sm text-white/70 mt-2">{slide.sub}</p>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-10 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-orange-400" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Gym badge */}
        <div className="absolute top-8 right-8 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <Image src="/gym-logo.png" alt="" width={24} height={24} className="object-cover w-full h-full" />
          </div>
          <span className="text-white text-xs font-semibold tracking-wider">ORACLE GYM</span>
        </div>
      </div>
    </div>
  );
}
