import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

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
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.from = config.get("SMTP_FROM", "GOSF <noreply@niktronix.com.br>");
    this.appUrl = config.get("APP_URL", "http://localhost:3002");
    this.resend = new Resend(config.get("RESEND_API_KEY", ""));
  }

  async sendPasswordReset(to: string, fullName: string, resetUrl: string) {
    const { error } = await this.resend.emails.send({
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
    if (error) this.logger.error(`Failed to send reset email to ${to}`, error);
    else this.logger.log(`Reset email sent to ${to}`);
  }

  async sendEvaluationOpen(to: string, fullName: string, cycleTitle: string) {
    const { error } = await this.resend.emails.send({
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
    if (error) this.logger.error(`Failed to send cycle email to ${to}`, error);
    else this.logger.log(`Cycle email sent to ${to}`);
  }

  async sendCheckoutWelcome(
    to: string,
    fullName: string,
    institutionName: string,
    planName: string,
  ) {
    const planLabel: Record<string, string> = {
      STARTER: "Starter",
      ESCOLA: "Escola",
      ENTERPRISE: "Enterprise",
    };
    const label = planLabel[planName.toUpperCase()] ?? planName;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Bem-vindo ao GOSF — plano ${label} ativado!`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
          <h2 style="color:#111">Olá, ${escapeHtml(fullName)} 🎉</h2>
          <p style="color:#444;line-height:1.6">
            O plano <strong>${escapeHtml(label)}</strong> da <strong>${escapeHtml(institutionName)}</strong>
            foi ativado com sucesso. Seu time já pode usar todas as funcionalidades do GOSF.
          </p>
          <a href="${this.appUrl}/coordinator"
             style="display:inline-block;margin:24px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
            Acessar o GOSF
          </a>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#bbb;font-size:12px">GOSF — Plataforma de Inteligência Educacional</p>
        </div>
      `,
    });
    if (error) this.logger.error(`Failed to send checkout welcome email to ${to}`, error);
    else this.logger.log(`Checkout welcome email sent to ${to}`);
  }

  async sendPlanReady(to: string, fullName: string, type: "student" | "teacher") {
    const planPath = type === "student" ? "/student/plan" : "/teacher/development";
    const planLabel = type === "student" ? "plano de estudo" : "plano de desenvolvimento";

    const { error } = await this.resend.emails.send({
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
    if (error) this.logger.error(`Failed to send plan email to ${to}`, error);
    else this.logger.log(`Plan email sent to ${to}`);
  }
}
