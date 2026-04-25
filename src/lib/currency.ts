import { prisma } from "./prisma";

let cached: string | null = null;
let cachedAt = 0;
const TTL = 60_000; // 1 minute cache

export async function getGymCurrency(): Promise<string> {
  const now = Date.now();
  if (cached && now - cachedAt < TTL) return cached;
  const settings = await prisma.gymSettings.findFirst({ select: { currency: true } });
  cached = settings?.currency ?? "GHS";
  cachedAt = now;
  return cached;
}
