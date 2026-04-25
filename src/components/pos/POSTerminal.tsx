"use client";

import { useState } from "react";
import { Plus, Minus, Trash2, CreditCard, Banknote, Loader2, CheckCircle2 } from "lucide-react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";

interface Product { id: string; name: string; price: number; stock: number; category: string | null; }
interface CartItem { product: Product; qty: number; }

export default function POSTerminal({ products }: { products: Product[] }) {
  const formatCurrency = useFormatCurrency();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<"CASH" | "CARD">("CASH");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((s, i) => s + i.qty * Number(i.product.price), 0);

  function addToCart(p: Product) {
    setCart((c) => {
      const existing = c.find((i) => i.product.id === p.id);
      if (existing) return c.map((i) => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { product: p, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((c) =>
      c.map((i) => i.product.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
       .filter((i) => i.qty > 0)
    );
  }

  async function checkout() {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.qty })),
          method,
        }),
      });
      setCart([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="section-title">Sale Terminal</h2>
      </div>

      {/* Products */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs text-slate-400 font-medium mb-2">TAP TO ADD</p>
        <div className="grid grid-cols-3 gap-2">
          {products.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="p-2.5 border border-slate-100 rounded-xl text-left hover:border-sky-200 hover:bg-sky-50 transition-all active:scale-95">
              <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
              <p className="text-xs text-sky-600 font-medium mt-0.5">{formatCurrency(Number(p.price))}</p>
            </button>
          ))}
          {products.length === 0 && (
            <p className="col-span-3 text-sm text-slate-400 text-center py-4">No products</p>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="flex-1 p-4 space-y-2 min-h-[120px]">
        {success && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Sale recorded successfully!
          </div>
        )}
        {cart.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Cart is empty</p>
        ) : cart.map((item) => (
          <div key={item.product.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
              <p className="text-xs text-slate-400">{formatCurrency(Number(item.product.price))} each</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => updateQty(item.product.id, -1)} className="btn-icon w-6 h-6 border border-slate-200">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
              <button onClick={() => updateQty(item.product.id, 1)} className="btn-icon w-6 h-6 border border-slate-200">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm font-semibold w-16 text-right">
              {formatCurrency(Number(item.product.price) * item.qty)}
            </p>
            <button onClick={() => setCart((c) => c.filter((i) => i.product.id !== item.product.id))}
              className="btn-icon text-red-400 w-6 h-6">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Checkout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total</span>
          <span className="text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMethod("CASH")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-all ${
              method === "CASH" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
            }`}>
            <Banknote className="w-3.5 h-3.5" /> Cash
          </button>
          <button onClick={() => setMethod("CARD")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-all ${
              method === "CARD" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
            }`}>
            <CreditCard className="w-3.5 h-3.5" /> Card
          </button>
        </div>
        <button onClick={checkout} disabled={cart.length === 0 || loading}
          className="btn-primary w-full justify-center py-2.5 text-sm font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Processing..." : `Charge ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  );
}
