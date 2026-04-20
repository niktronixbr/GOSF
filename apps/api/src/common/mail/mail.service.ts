import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get("SMTP_HOST", "smtp.ethereal.email"),
      port: config.get<number>("SMTP_PORT", 587),
      secure: config.get("SMTP_SECURE", "false") === "true",
      auth: {
        user: config.get("SMTP_USER", ""),
        pass: config.get("SMTP_PASS", ""),
      },
    });
  }

  async sendPasswordReset(to: string, fullName: string, resetUrl: string) {
    const from = this.config.get("SMTP_FROM", "GOSF <noreply@gosf.app>");

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: "Redefinição de senha — GOSF",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#111">Olá, ${fullName}</h2>
            <p style="color:#444;line-height:1.6">
              Recebemos uma solicitação para redefinir a senha da sua conta no GOSF.
              Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Redefinir senha
            </a>
            <p style="color:#888;font-size:13px">
              Se você não solicitou isso, ignore este e-mail — sua senha permanece a mesma.
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">GOSF — Plataforma de Inteligência Educacional</p>
          </div>
        `,
      });

      this.logger.log(`Reset email sent to ${to} [messageId=${info.messageId}]`);

      // Em dev com Ethereal, imprime a URL de preview no log
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) this.logger.log(`Preview: ${previewUrl}`);
    } catch (err) {
      this.logger.error(`Failed to send reset email to ${to}`, err);
      throw err;
    }
  }
}
