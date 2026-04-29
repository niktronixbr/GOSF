"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { toast } from "sonner";

const inp = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background";

export function OnboardingStepClasses({ onComplete }: { onComplete: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || !period.trim()) { toast.error("Preencha nome e período."); return; }
    setSaving(true);
    try {
      await coordinatorApi.createClass({ name: name.trim(), academicPeriod: period.trim() });
      await qc.invalidateQueries({ queryKey: ["onboarding-classes"] });
      toast.success("Turma criada!");
      onComplete();
    } catch {
      toast.error("Erro ao criar turma.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Crie a primeira turma</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nome da turma</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: 9º Ano A" className={inp} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Período letivo</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="ex: 2025" className={inp} />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Criando..." : "Criar e continuar →"}
        </button>
      </div>
    </div>
  );
}
