import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export function formatDate(date: Date | string, pattern = "MMM dd, yyyy") {
  return format(new Date(date), pattern);
}

export function formatRelativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function generateMemberNumber() {
  const prefix = "GYM";
  const number = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${number}`;
}

export function generateInvoiceNumber() {
  const prefix = "INV";
  const date = format(new Date(), "yyyyMM");
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${number}`;
}

export function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getPaymentStatusColor(status: string) {
  switch (status) {
    case "PAID": return "text-green-600 bg-green-50 border-green-200";
    case "PENDING": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "FAILED": return "text-red-600 bg-red-50 border-red-200";
    case "REFUNDED": return "text-blue-600 bg-blue-50 border-blue-200";
    case "WAIVED": return "text-gray-600 bg-gray-50 border-gray-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getMemberStatusColor(status: string) {
  switch (status) {
    case "ACTIVE": return "text-green-600 bg-green-50 border-green-200";
    case "PENDING": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "FROZEN": return "text-blue-600 bg-blue-50 border-blue-200";
    case "CANCELLED": return "text-red-600 bg-red-50 border-red-200";
    case "LEAD": return "text-purple-600 bg-purple-50 border-purple-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getLeadStatusColor(status: string) {
  switch (status) {
    case "INQUIRY": return "text-gray-600 bg-gray-50";
    case "CONTACTED": return "text-blue-600 bg-blue-50";
    case "TRIAL": return "text-yellow-600 bg-yellow-50";
    case "NEGOTIATING": return "text-orange-600 bg-orange-50";
    case "CONVERTED": return "text-green-600 bg-green-50";
    case "LOST": return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}
