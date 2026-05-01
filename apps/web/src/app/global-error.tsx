"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Algo deu errado</h2>
        <p style={{ color: "#78716c", marginTop: "0.5rem" }}>
          Nossa equipe foi notificada. Tente recarregar a página.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
