"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";

const inp = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background";

export function OnboardingStepStudents({ onComplete }: { onComplete: () => void }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      toast.error("Preencha todos os campos. Senha mínima: 6 caracteres."); return;
    }
    setSaving(true);
    try {
      await adminApi.createUser({ fullName: fullName.trim(), email: email.trim(), password, role: "STUDENT" });
      await qc.invalidateQueries({ queryKey: ["onboarding-students"] });
      toast.success("Aluno cadastrado!");
      onComplete();
    } catch {
      toast.error("Erro ao cadastrar aluno. Verifique se o e-mail já está em uso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Cadastre o primeiro aluno</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nome completo</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ex: Maria Santos" className={inp} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@escola.com" className={inp} />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Senha provisória</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" className={inp} />
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Cadastrando..." : "Concluir setup ✓"}
        </button>
      </div>
    </div>
  );
}
