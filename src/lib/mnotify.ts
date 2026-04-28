const BASE = "https://api.mnotify.com/api";

export async function sendSms(apiKey: string, recipients: string[], message: string, sender = "Oracle Gym") {
  const res = await fetch(`${BASE}/sms/quick?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: recipients, sender, message, is_schedule: "false", schedule_date: "" }),
  });
  return res.ok;
}

export async function sendEmail(
  apiKey: string,
  recipients: string[],
  subject: string,
  bodyHtml: string,
  bodyText: string,
  sender = "Oracle Gym",
  fromEmail = "noreply@oraclegym.com",
) {
  const res = await fetch(`${BASE}/email/quick?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipients: recipients.map(email => ({ email })),
      sender, from_email: fromEmail,
      subject, body_html: bodyHtml, body_text: bodyText,
    }),
  });
  return res.ok;
}
