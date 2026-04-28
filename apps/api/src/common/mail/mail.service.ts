import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private config: ConfigService) {
    this.from = config.get("SMTP_FROM", "GOSF <noreply@gosf.app>");
    this.appUrl = config.get("APP_URL", "http://localhost:3002");
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
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: "Redefinição de senha — GOSF",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#111">Olá, ${escapeHtml(fullName)}</h2>
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

  async sendEvaluationOpen(to: string, fullName: string, cycleTitle: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: "Novo ciclo de avaliação aberto — GOSF",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#111">Olá, ${escapeHtml(fullName)}</h2>
            <p style="color:#444;line-height:1.6">
              Um novo ciclo de avaliação foi aberto: <strong>${escapeHtml(cycleTitle)}</strong>.
              Acesse o GOSF para registrar suas avaliações.
            </p>
            <a href="${this.appUrl}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Acessar GOSF
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">GOSF — Plataforma de Inteligência Educacional</p>
          </div>
        `,
      });
      this.logger.log(`Cycle email sent to ${to} [messageId=${info.messageId}]`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) this.logger.log(`Preview: ${previewUrl}`);
    } catch (err) {
      this.logger.error(`Failed to send cycle email to ${to}`, err);
      throw err;
    }
  }

  async sendPlanReady(to: string, fullName: string, type: "student" | "teacher") {
    const planPath = type === "student" ? "/student/plan" : "/teacher/development";
    const planLabel = type === "student" ? "plano de estudo" : "plano de desenvolvimento";

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: "Seu plano está pronto — GOSF",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#111">Olá, ${escapeHtml(fullName)}</h2>
            <p style="color:#444;line-height:1.6">
              Seu ${escapeHtml(planLabel)} personalizado foi gerado pela IA do GOSF.
              Acesse para visualizar suas recomendações.
            </p>
            <a href="${this.appUrl}${planPath}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Ver meu plano
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">GOSF — Plataforma de Inteligência Educacional</p>
          </div>
        `,
      });
      this.logger.log(`Plan email sent to ${to} [messageId=${info.messageId}]`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) this.logger.log(`Preview: ${previewUrl}`);
    } catch (err) {
      this.logger.error(`Failed to send plan email to ${to}`, err);
      throw err;
    }
  }
}
