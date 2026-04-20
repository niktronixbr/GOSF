import { z } from "zod";

export const loginSchema = z.object({
  institutionSlug: z.string().min(1, "Informe o código da instituição"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
