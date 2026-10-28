import nodemailer from "nodemailer";

export async function sendValidationEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.warn("[email] SMTP non configure; email non envoye:", params.to);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to: params.to, subject: params.subject, text: params.body });
    return true;
  } catch (err) {
    console.error("[email] echec envoi:", err);
    return false;
  }
}
