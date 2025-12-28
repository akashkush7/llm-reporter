import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Reporter",
  description: "Generate AI-powered reports from your data pipelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="llm-reporter-theme"
        >
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
