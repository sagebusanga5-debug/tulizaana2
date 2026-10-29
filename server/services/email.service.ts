export async function sendValidationEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SMTP_FROM || process.env.RESEND_FROM;

  if (apiKey && from) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: params.to, subject: params.subject, text: params.body }),
      });
      if (!res.ok) {
        console.error("[email] Resend echec:", res.status, await res.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error("[email] Resend erreur:", err);
      return false;
    }
  }

  // Fallback SMTP
  const nodemailer = await import("nodemailer");
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || user;
  if (!host || !user || !pass) {
    console.warn("[email] aucun provider configure; email non envoye:", params.to);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({ from: smtpFrom, to: params.to, subject: params.subject, text: params.body });
    return true;
  } catch (err) {
    console.error("[email] SMTP echec:", err);
    return false;
  }
}
