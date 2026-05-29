export function emailLayout(content: string, unsubscribeToken?: string): string {
  const unsubscribeLink = unsubscribeToken
    ? `<p style="text-align:center;font-size:11px;color:#9a9a8a;margin-top:32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${unsubscribeToken}" style="color:#9a9a8a;text-decoration:underline;">Unsubscribe</a>
        &nbsp;·&nbsp; Luxury Lifestyle Vault, LLC
      </p>`
    : '<p style="text-align:center;font-size:11px;color:#9a9a8a;margin-top:32px;">Luxury Lifestyle Vault, LLC</p>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Luxury Lifestyle Vault</title>
</head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 40px;text-align:center;border-radius:8px 8px 0 0;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:300;color:#f0ede6;letter-spacing:0.15em;text-transform:uppercase;">
                Luxury Lifestyle Vault
              </p>
            </td>
          </tr>
          <!-- Gold divider -->
          <tr>
            <td style="background:#c9a96e;height:2px;"></td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 8px 8px;">
              ${content}
              ${unsubscribeLink}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:300;color:#1a1a1a;letter-spacing:0.02em;">${text}</h1>`
}

export function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3a3a3a;">${text}</p>`
}

export function label(text: string): string {
  return `<p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#9a9a8a;font-weight:500;">${text}</p>`
}

export function value(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;font-weight:500;">${text}</p>`
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e8e6e0;margin:24px 0;">`
}

export function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#1a1a1a;border-radius:4px;padding:14px 28px;">
        <a href="${href}" style="color:#f0ede6;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.05em;">${text}</a>
      </td>
    </tr>
  </table>`
}
