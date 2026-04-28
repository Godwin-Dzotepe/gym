const BASE = "https://api.mnotify.com/api";

export async function sendSms(
  apiKey: string,
  recipients: string[],
  message: string,
  sender = "Oracle Gym",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/sms/quick?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipients, sender, message, is_schedule: "false", schedule_date: "" }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.status === "error" || (!res.ok && json.status !== "success")) {
      return { ok: false, error: json.message ?? "SMS delivery failed" };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Network error" };
  }
}

export async function sendEmail(
  apiKey: string,
  recipients: string[],
  subject: string,
  bodyHtml: string,
  bodyText: string,
  sender = "Oracle Gym",
  fromEmail = "noreply@oraclegym.com",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/email/quick?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: recipients.map(email => ({ email })),
        sender,
        from_email: fromEmail,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.status === "error" || (!res.ok && json.status !== "success")) {
      return { ok: false, error: json.message ?? "Email delivery failed" };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Network error" };
  }
}
