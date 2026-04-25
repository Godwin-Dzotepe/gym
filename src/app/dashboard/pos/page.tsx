import { prisma } from "@/lib/prisma";
import { getGymCurrency } from "@/lib/currency";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Package, ShoppingCart, TrendingUp, Download, DollarSign, BarChart2 } from "lucide-react";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function POSPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab ?? "sales";

  const [currency, salesStats, recentSales, productRevenue, products, costStats] = await Promise.all([
    getGymCurrency(),
    prisma.sale.aggregate({ _sum: { total: true, tax: true }, _count: true }),
    prisma.sale.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { firstName: true, lastName: true } },
        staff: { select: { firstName: true, lastName: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: "desc" } },
      take: 20,
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    // Cost of goods = SUM(saleItem.quantity * product.cost)
    prisma.$queryRaw<[{ cogs: number }]>`
      SELECT COALESCE(SUM(si.quantity * p.cost), 0) AS cogs
      FROM SaleItem si
      JOIN Product p ON p.id = si.productId
    `,
  ]);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const cogs = Number((costStats as any[])[0]?.cogs ?? 0);
  const totalRevenue = Number(salesStats._sum.total ?? 0);
  const netProfit = totalRevenue - cogs;

  const TABS = [
    { key: "sales", label: "Sales" },
    { key: "products", label: "Products" },
    { key: "report", label: "Report" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Point of Sale</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sell products and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/pos/products" className="btn-secondary">
            <Package className="w-4 h-4" /> Products
          </Link>
          <Link href="/dashboard/pos/create" className="btn-primary">
            <Plus className="w-4 h-4" /> Create Sale
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-full sm:w-fit" style={{scrollbarWidth:'none'}}>
        {TABS.map(t => (
          <Link key={t.key} href={`/dashboard/pos?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* Dashboard KPIs */}
      {tab === "sales" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: formatCurrency(totalRevenue, currency), icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
            { label: "Cost of Goods", value: formatCurrency(cogs, currency), icon: Package, card: "bg-slate-500 hover:bg-slate-600", iconBg: "bg-slate-400/30" },
            { label: "Net Profit", value: formatCurrency(netProfit, currency), icon: DollarSign, card: "bg-indigo-500 hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
            { label: "Total Sales", value: salesStats._count.toString(), icon: ShoppingCart, card: "bg-orange-500 hover:bg-orange-600", iconBg: "bg-orange-400/30" },
          ].map(c => (
            <div key={c.label} className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors cursor-default shadow-sm ${c.card}`}>
              <c.icon className="absolute -right-3 -bottom-3 w-14 sm:w-20 h-14 sm:h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
              <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-3`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{c.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-white mt-1 leading-none truncate">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sales List */}
      {tab === "sales" && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Sales</h2>
            <button className="btn-secondary text-xs"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="table-th">Customer</th>
                <th className="table-th hidden md:table-cell">Staff</th>
                <th className="table-th hidden lg:table-cell">Description</th>
                <th className="table-th">Amount</th>
                <th className="table-th hidden sm:table-cell">Method</th>
                <th className="table-th hidden sm:table-cell">Date</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center py-10 text-gray-400">No sales yet</td></tr>
              ) : recentSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <span className="text-sm font-medium text-gray-900">
                      {sale.member ? `${sale.member.firstName} ${sale.member.lastName}` : "Walk-in"}
                    </span>
                  </td>
                  <td className="table-td text-sm text-gray-500 hidden md:table-cell">
                    {sale.staff ? `${sale.staff.firstName} ${sale.staff.lastName}` : "—"}
                  </td>
                  <td className="table-td text-sm text-gray-600 hidden lg:table-cell">
                    {sale.items.map(i => i.product.name).join(", ")}
                  </td>
                  <td className="table-td font-semibold text-gray-900">{formatCurrency(Number(sale.total), currency)}</td>
                  <td className="table-td text-sm text-gray-500 capitalize hidden sm:table-cell">{sale.method.toLowerCase().replace("_", " ")}</td>
                  <td className="table-td text-xs text-gray-400 hidden sm:table-cell">{formatDate(sale.createdAt)}</td>
                  <td className="table-td">
                    <span className={`badge ${sale.status === "PAID" ? "badge-green" : "badge-yellow"}`}>
                      {sale.status === "PAID" ? "✓ Paid" : sale.status}
                    </span>
                  </td>
                  <td className="table-td">
                    <Link href={`/dashboard/pos/${sale.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg px-2 py-1 inline-block">
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Products tab */}
      {tab === "products" && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Product List</h2>
            <div className="flex gap-2">
              <Link href="/dashboard/pos/products/new" className="btn-primary text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="table-th">Product</th>
                <th className="table-th hidden sm:table-cell">Category</th>
                <th className="table-th">Price</th>
                <th className="table-th hidden sm:table-cell">In Stock</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center py-10 text-gray-400">No products yet</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium text-gray-900">{p.name}</td>
                  <td className="table-td text-sm text-gray-500 hidden sm:table-cell">{p.category ?? "—"}</td>
                  <td className="table-td font-semibold">{formatCurrency(Number(p.price), currency)}</td>
                  <td className="table-td text-sm hidden sm:table-cell">{p.stock}</td>
                  <td className="table-td">
                    <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Report tab */}
      {tab === "report" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: formatCurrency(Number(salesStats._sum.total ?? 0), currency), icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
              { label: "Cost of Goods", value: formatCurrency(0, currency), icon: Package, card: "bg-slate-500 hover:bg-slate-600", iconBg: "bg-slate-400/30" },
              { label: "Net Profits", value: formatCurrency(Number(salesStats._sum.total ?? 0), currency), icon: DollarSign, card: "bg-indigo-500 hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
              { label: "Total Sales", value: salesStats._count.toString(), icon: ShoppingCart, card: "bg-orange-500 hover:bg-orange-600", iconBg: "bg-orange-400/30" },
            ].map(c => (
              <div key={c.label} className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors cursor-default shadow-sm ${c.card}`}>
                <c.icon className="absolute -right-3 -bottom-3 w-14 sm:w-20 h-14 sm:h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-3`}>
                  <c.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{c.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white mt-1 leading-none truncate">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Product Revenue</h2>
            </div>
            <div className="overflow-x-auto"><table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="table-th">Product</th>
                  <th className="table-th hidden sm:table-cell">QTY</th>
                  <th className="table-th hidden md:table-cell">Amount</th>
                  <th className="table-th hidden md:table-cell">Discount</th>
                  <th className="table-th hidden md:table-cell">Tax</th>
                  <th className="table-th">Total</th>
                </tr>
              </thead>
              <tbody>
                {productRevenue.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center py-10 text-gray-400">No sales data</td></tr>
                ) : productRevenue.map(row => {
                  const product = productMap[row.productId];
                  return (
                    <tr key={row.productId} className="hover:bg-gray-50">
                      <td className="table-td font-medium text-gray-900">{product?.name ?? "—"}</td>
                      <td className="table-td text-sm hidden sm:table-cell">{row._sum.quantity ?? 0}</td>
                      <td className="table-td hidden md:table-cell">{formatCurrency(Number(row._sum.total ?? 0), currency)}</td>
                      <td className="table-td text-gray-400 hidden md:table-cell">—</td>
                      <td className="table-td text-gray-400 hidden md:table-cell">—</td>
                      <td className="table-td font-semibold">{formatCurrency(Number(row._sum.total ?? 0), currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
