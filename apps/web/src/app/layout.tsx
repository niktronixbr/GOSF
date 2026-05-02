import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "GOSF", template: "%s | GOSF" },
  description: "Plataforma de inteligência educacional para personalização de aprendizagem",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={lexend.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
