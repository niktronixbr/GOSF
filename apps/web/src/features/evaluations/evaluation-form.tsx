"use client";

import { useState } from "react";
import { EvaluationForm, EvaluationQuestion } from "@/lib/api/evaluations";
import { toast } from "sonner";

interface Props {
  form: EvaluationForm;
  targetName: string;
  onSubmit: (answers: Record<string, number>, comment: string) => Promise<void>;
  onCancel: () => void;
}

const SCALE_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

function ScaleQuestion({
  question,
  value,
  onChange,
}: {
  question: EvaluationQuestion;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{question.questionText}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-all ${
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {value !== undefined && (
        <p className="text-xs text-muted-foreground text-center">{SCALE_LABELS[value]}</p>
      )}
    </div>
  );
}

export function EvaluationFormComponent({ form, targetName, onSubmit, onCancel }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAnswered = form.questions
    .filter((q) => q.isRequired)
    .every((q) => answers[q.id] !== undefined);

  const progress =
    Math.round((Object.keys(answers).length / form.questions.length) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered) {
      toast.warning("Responda todas as questões obrigatórias.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(answers, comment);
      toast.success("Avaliação enviada com sucesso!");
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-foreground">{form.title}</h2>
          <span className="text-xs text-muted-foreground">{progress}% concluído</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Avaliando: <strong>{targetName}</strong></p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {form.questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2">
              Questão {idx + 1} de {form.questions.length} · {q.dimension.replace(/_/g, " ")}
            </p>
            <ScaleQuestion
              question={q}
              value={answers[q.id]}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="block text-sm font-medium text-foreground mb-2">
          Comentário adicional <span className="text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Deixe um comentário construtivo, se desejar..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{comment.length}/500</p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !allAnswered}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? "Enviando..." : "Enviar avaliação"}
        </button>
      </div>
    </form>
  );
}
