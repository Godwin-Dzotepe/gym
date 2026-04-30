"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  iconClassName?: string;
}

export default function PasswordInput({ className, iconClassName, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${iconClassName ?? "text-gray-400 hover:text-gray-600"}`}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
