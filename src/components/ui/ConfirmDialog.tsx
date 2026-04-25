"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmCtx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmCtx | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, opts, resolve });
    });
  }, []);

  function answer(v: boolean) {
    state?.resolve(v);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state?.open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => answer(false)} />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              state.opts.danger ? "bg-red-100" : "bg-yellow-100"
            }`}>
              <AlertTriangle className={`w-6 h-6 ${state.opts.danger ? "text-red-500" : "text-yellow-500"}`} />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-2">
              {state.opts.title}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              {state.opts.message}
            </p>

            <div className="flex gap-3">
              <button onClick={() => answer(false)}
                className="flex-1 btn-secondary justify-center py-2.5">
                Cancel
              </button>
              <button onClick={() => answer(true)}
                className={`flex-1 justify-center py-2.5 inline-flex items-center gap-2 font-medium text-sm rounded-lg border-none cursor-pointer transition-colors ${
                  state.opts.danger
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-sky-500 hover:bg-sky-600 text-white"
                }`}>
                {state.opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
