// Returns effective integration credentials: env vars take precedence over database values.
export function getIntegrationConfig(settings: {
  smsApiKey?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  email?: string | null;
  gymName?: string | null;
} | null) {
  return {
    mnotifyKey:    process.env.MNOTIFY_API_KEY  ?? settings?.smsApiKey ?? null,
    smtpHost:      process.env.SMTP_HOST        ?? settings?.smtpHost  ?? null,
    smtpPort:      process.env.SMTP_PORT        ? parseInt(process.env.SMTP_PORT) : (settings?.smtpPort ?? 587),
    smtpUser:      process.env.SMTP_USER        ?? settings?.smtpUser  ?? null,
    smtpPass:      process.env.SMTP_PASS        ?? settings?.smtpPass  ?? null,
    smtpFromEmail: process.env.SMTP_FROM_EMAIL  ?? settings?.email     ?? null,
    smtpFromName:  process.env.SMTP_FROM_NAME   ?? settings?.gymName   ?? "Oracle Gym",
  };
}
