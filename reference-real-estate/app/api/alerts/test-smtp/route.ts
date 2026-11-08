import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { to } = await req.json();

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "SMTP no configurado" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    tls: { rejectUnauthorized: false },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to || process.env.SMTP_USER,
      subject: "Test SMTP — Penalva Inmobiliaria",
      text: "Si recibís este email, el SMTP está funcionando correctamente.",
    });
    return NextResponse.json({ ok: true, message: `Email de prueba enviado a ${to || process.env.SMTP_USER}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
