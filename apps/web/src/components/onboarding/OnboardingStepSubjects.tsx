"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { toast } from "sonner";
import { X } from "lucide-react";

const inp = "border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background";

export function OnboardingStepSubjects({ onComplete }: { onComplete: () => void }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function add() {
    const v = input.trim();
    if (!v || pending.includes(v)) return;
    setPending((p) => [...p, v]);
    setInput("");
  }

  async function save() {
    if (pending.length === 0) { toast.error("Adicione pelo menos uma disciplina."); return; }
    setSaving(true);
    try {
      await Promise.all(pending.map((name) => coordinatorApi.createSubject({ name })));
      await qc.invalidateQueries({ queryKey: ["onboarding-subjects"] });
      toast.success("Disciplinas criadas!");
      onComplete();
    } catch {
      toast.error("Erro ao criar disciplinas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Adicione as disciplinas da sua escola</p>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="ex: Matemática"
          className={`${inp} flex-1`}
        />
        <button type="button" onClick={add} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          + Adicionar
        </button>
      </div>
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pending.map((name) => (
            <span key={name} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {name}
              <button onClick={() => setPending((p) => p.filter((x) => x !== name))}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving || pending.length === 0} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar e continuar →"}
        </button>
      </div>
    </div>
  );
}
