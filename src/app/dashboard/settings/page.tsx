import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const settings = await prisma.gymSettings.findFirst();

  const serialized = settings ? {
    ...settings,
    taxRate: Number(settings.taxRate),
    lateFeeDefault: Number(settings.lateFeeDefault),
  } : null;

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure your gym profile and system preferences</p>
      </div>
      <SettingsForm settings={serialized as any} />
    </div>
  );
}
