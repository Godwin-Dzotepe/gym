"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { Plus, Minus, X, ShoppingCart, ChevronRight, ArrowLeft, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Product { id: string; name: string; price: number; stock: number; category: string; }
interface Member { id: string; firstName: string; lastName: string; }
interface LineItem { productId: string; name: string; price: number; quantity: number; discount: number; }

const PAYMENT_METHODS = [
  { value: "CARD", label: "Payment Card" },
  { value: "BANK_TRANSFER", label: "Bank Account" },
  { value: "MANUAL", label: "Manual Payment" },
  { value: "CASH", label: "Cash" },
  { value: "CHECK", label: "Check" },
  { value: "REFERRAL_CREDIT", label: "Referral Credit" },
  { value: "INVOICE", label: "Invoice" },
  { value: "BALANCE", label: "Balance" },
  { value: "IDEAL", label: "iDeal" },
  { value: "BANCONTACT", label: "Bancontact" },
  { value: "SKIPPED", label: "Skipped" },
];

type Screen = "build" | "summary" | "payment";

export default function POSCreateSale({
  products, categories, members,
}: { products: Product[]; categories: string[]; members: Member[] }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const toast = useToast();
  const [screen, setScreen] = useState<Screen>("build");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [memberId, setMemberId] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [transactionId, setTransactionId] = useState("");
  const [sendReceipt, setSendReceipt] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"manual" | "invoice">("manual");
  const [saving, setSaving] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;

  const addProduct = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, discount: 0 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(prev => {
      const updated = prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
      return updated.filter(i => i.quantity > 0);
    });
  };

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId));

  const subtotal = items.reduce((sum, i) => sum + (i.price - i.discount) * i.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const submit = async () => {
    setSaving(true);
    await fetch("/api/pos/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: memberId || null,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price, discount: i.discount })),
        subtotal, tax, total,
        method: paymentMethod,
        transactionId: transactionId || null,
        sendReceipt,
        notes: notes || null,
      }),
    });
    setSaving(false);
    toast.success("Sale completed successfully.");
    router.push("/dashboard/pos");
  };

  /* ── Cart panel (shared between desktop sidebar and mobile drawer) ── */
  const CartPanel = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <div className={`bg-white flex flex-col ${inDrawer ? "h-full" : "rounded-2xl border border-gray-100 w-72 flex-shrink-0"}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-gray-500" />
        <h2 className="font-semibold text-gray-900">Order</h2>
        {items.length > 0 && (
          <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
            {totalQty}
          </span>
        )}
        {inDrawer && (
          <button onClick={() => setCartOpen(false)} className="ml-auto text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-300">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Select Product</p>
          </div>
        ) : items.map(item => (
          <div key={item.productId} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 flex-1 leading-tight">{item.name}</p>
              <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} each</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.productId, -1)}
                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, 1)}
                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
          <button onClick={() => { setCartOpen(false); setScreen("summary"); }}
            className="btn-primary w-full justify-center">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  /* ── Summary screen ── */
  if (screen === "summary") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("build")} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="page-title">Sale Summary</h1>
          <button onClick={() => { setItems([]); setScreen("build"); }} className="ml-auto text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="card p-4 sm:p-5 space-y-3">
          {items.map(item => (
            <div key={item.productId} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
              </div>
              <p className="font-semibold flex-shrink-0">{formatCurrency((item.price - item.discount) * item.quantity)}</p>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax</span><span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-lg pt-1">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          <textarea
            className="input resize-none text-sm"
            rows={3}
            placeholder="Insert some notes (Shown on Invoice)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={250}
          />
          <p className="text-xs text-gray-400 text-right">{notes.length}/250 characters left.</p>
        </div>

        <button onClick={() => setScreen("payment")} className="btn-primary w-full justify-center text-base py-3">
          Continue to Payment
        </button>
      </div>
    );
  }

  /* ── Payment screen ── */
  if (screen === "payment") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("summary")} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="page-title">Payment</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Sale Summary */}
          <div className="card p-4 sm:p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Sale Summary</h2>
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm gap-2">
                <span className="text-gray-600 truncate">{item.name} × {item.quantity}</span>
                <span className="font-medium flex-shrink-0">{formatCurrency((item.price - item.discount) * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>

          {/* Payment Panel */}
          <div className="card p-4 sm:p-5 space-y-4">
            <div>
              <label className="label">Name (optional)</label>
              <select className="select" value={memberId} onChange={e => setMemberId(e.target.value)}>
                <option value="">Walk-in customer</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={sendReceipt} onChange={e => setSendReceipt(e.target.checked)} className="rounded" />
              Send receipt
            </label>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(["manual", "invoice"] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setPaymentTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                    paymentTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}>
                  {t === "manual" ? "Manual Payment" : "Invoice"}
                </button>
              ))}
            </div>

            <div>
              <label className="label">Payment Method</label>
              <select className="select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Transaction ID (Optional)</label>
              <input className="input" placeholder="Transaction ID"
                value={transactionId} onChange={e => setTransactionId(e.target.value)} />
            </div>

            <button onClick={submit} disabled={saving} className="btn-primary w-full justify-center py-3 text-base">
              {saving ? "Processing…" : `Create Sale · ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Build screen ── */
  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] lg:h-[calc(100dvh-120px)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0 pb-3">
        <Link href="/dashboard/pos" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title">Create Sale</h1>
      </div>

      {/* ── Mobile layout (< lg) ── */}
      <div className="flex flex-col flex-1 overflow-hidden lg:hidden">
        {/* Category chips — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0" style={{scrollbarWidth:"none"}}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !activeCategory ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"
            }`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pb-24">
              {filteredProducts.map(product => {
                const inCart = items.find(i => i.productId === product.id);
                return (
                  <button key={product.id}
                    onClick={() => addProduct(product)}
                    className={`border-2 rounded-xl p-3 text-left transition-all active:scale-95 ${
                      inCart ? "border-indigo-400 bg-indigo-50" : "border-gray-100 bg-white"
                    }`}>
                    <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center text-2xl">
                      🛍
                    </div>
                    <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{product.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Stock: {product.stock}</p>
                    <p className="text-sm font-bold text-indigo-600 mt-1">{formatCurrency(product.price)}</p>
                    {inCart && (
                      <div className="mt-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-md px-2 py-0.5 text-center">
                        × {inCart.quantity} in cart
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating cart bar */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-lg shadow-indigo-600/30 transition-all">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{totalQty}</span>
              </div>
              <span className="font-semibold flex-1 text-left text-sm">View Order</span>
              <span className="font-bold text-sm">{formatCurrency(total)}</span>
              <ChevronUp className="w-4 h-4 opacity-70" />
            </button>
          </div>
        )}

        {/* Mobile cart drawer */}
        {cartOpen && (
          <div className="fixed inset-0 z-40 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
            <div className="relative bg-white rounded-t-3xl flex flex-col max-h-[80vh] shadow-2xl">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
              <CartPanel inDrawer />
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop layout (≥ lg) ── */}
      <div className="hidden lg:flex gap-5 flex-1 overflow-hidden">
        {/* Category sidebar */}
        <div className="w-44 flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-2 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wide">Categories</h3>
          <button
            onClick={() => setActiveCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              !activeCategory ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
            }`}>
            All Products
          </button>
          {categories.map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map(product => {
                const inCart = items.find(i => i.productId === product.id);
                return (
                  <button key={product.id}
                    onClick={() => addProduct(product)}
                    className={`border-2 rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                      inCart ? "border-indigo-400 bg-indigo-50" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}>
                    <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-3xl">
                      🛍
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Stock: {product.stock}</p>
                    <p className="text-sm font-bold text-indigo-600 mt-1">{formatCurrency(product.price)}</p>
                    {inCart && (
                      <div className="mt-2 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg px-2 py-0.5 text-center">
                        × {inCart.quantity} in cart
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop cart sidebar */}
        <CartPanel />
      </div>
    </div>
  );
}
