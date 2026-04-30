/**
 * Wraps email body HTML in a branded template.
 * gymName and contactEmail are pulled from the caller (who already has settings).
 */
export function wrapEmailTemplate(opts: {
  body: string;
  gymName: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
}): string {
  const { body, gymName, contactEmail, contactPhone, logoUrl } = opts;
  const year = new Date().getFullYear();

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${gymName}" style="max-height:48px;max-width:160px;margin-bottom:8px;" />`
    : `<span style="font-size:22px;font-weight:700;color:#4f46e5;letter-spacing:-0.5px;">${gymName}</span>`;

  const contactLine = [contactEmail, contactPhone].filter(Boolean).join(" &nbsp;·&nbsp; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${gymName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#6d28d9 100%);padding:28px 40px;text-align:center;">
              ${logoHtml}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;color:#111827;font-size:15px;line-height:1.7;">
              ${body}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;font-size:12px;color:#6b7280;line-height:1.6;">
              <p style="margin:0 0 6px;">
                You received this email because you are a member of <strong>${gymName}</strong>.
              </p>
              ${contactLine ? `<p style="margin:0 0 6px;">${contactLine}</p>` : ""}
              <p style="margin:0;">&copy; ${year} ${gymName}. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
