import { marked } from "marked";
import React from "react";

/**
 * HTML rendering options
 */
export interface HtmlRenderOptions {
  includeStyles?: boolean;
  customCss?: string;
  theme?: "light" | "dark";
  forPdf?: boolean;
  pageSize?: "A4" | "Letter" | "Legal";
  title?: string;
  subtitle?: string;
}

/**
 * Enhanced CSS styles for rendered HTML
 * Includes beautiful gradients, typography, and print optimization
 */
const ENHANCED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css');


*, *::before, *::after {
  box-sizing: border-box;
}


:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-accent: #ec4899;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}


body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: var(--color-text);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
  margin: 0;
  padding: 3rem 2rem;
  min-height: 100vh;
}


.report-container {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--color-bg);
  border-radius: 24px;
  box-shadow: var(--shadow-xl);
  padding: 4rem 5rem;
}

/* Typography with proper spacing */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--color-text);
  margin-top: 3rem;
  margin-bottom: 1.5rem;
}


/* First heading has less top margin */
h1:first-child, 
h2:first-child, 
h3:first-child {
  margin-top: 0;
}


h1 {
  font-size: 2.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-bottom: 4px solid var(--color-primary);
  padding-bottom: 1rem;
  margin-top: 4rem;
  margin-bottom: 2rem;
}


h2 {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-primary);
  border-bottom: 3px solid var(--color-border);
  padding-bottom: 0.75rem;
  margin-top: 3.5rem;
  margin-bottom: 1.75rem;
}


h3 { 
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-secondary);
  margin-top: 3rem;
  margin-bottom: 1.5rem;
}


h4 { 
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-text);
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
}


h5 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}


h6 {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-top: 2rem;
  margin-bottom: 1rem;
}


/* Paragraphs with proper spacing */
p {
  margin: 0 0 1.5rem 0;
  line-height: 1.8;
}


/* Reduce space between heading and immediately following paragraph */
h1 + p,
h2 + p,
h3 + p,
h4 + p,
h5 + p,
h6 + p {
  margin-top: 0;
}


/* Code blocks */
code {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.9em;
  background: var(--color-bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}


pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: var(--shadow-lg);
  margin: 2rem 0;
}


pre code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-size: 0.875rem;
}


/* Tables */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 2rem 0;
  box-shadow: var(--shadow-md);
  border-radius: 8px;
  overflow: hidden;
}


table th, table td {
  border: 1px solid var(--color-border);
  padding: 0.875rem 1.25rem;
  text-align: left;
}


table th {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.025em;
}


table tr:nth-child(even) {
  background: var(--color-bg-secondary);
}


table tr:hover {
  background: #f3f4f6;
}


/* Links */
a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}


a:hover {
  border-bottom-color: var(--color-primary);
  color: var(--color-secondary);
}


/* Blockquotes */
blockquote {
  border-left: 5px solid var(--color-primary);
  background: linear-gradient(90deg, var(--color-bg-secondary) 0%, transparent 100%);
  padding: 1.25rem 2rem;
  margin: 2rem 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: var(--color-text-secondary);
}


blockquote p {
  margin: 0;
}


/* Lists */
ul, ol {
  margin: 1.5rem 0;
  padding-left: 2rem;
}


li {
  margin: 0.875rem 0;
  line-height: 1.75;
}


ul li::marker {
  color: var(--color-primary);
  font-weight: 600;
}


ol li::marker {
  color: var(--color-primary);
  font-weight: 600;
}


/* Nested lists */
li > ul,
li > ol {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}


/* Horizontal rule */
hr {
  border: none;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  margin: 3rem 0;
}


/* Images */
img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  margin: 2rem 0;
  display: block;
}


/* Strong and emphasis */
strong {
  font-weight: 600;
  color: var(--color-text);
}


em {
  font-style: italic;
  color: var(--color-text-secondary);
}


/* Print styles */
@media print {
  body {
    background: white;
    padding: 0;
    font-size: 12pt;
  }
  
  .report-container {
    box-shadow: none;
    padding: 1.5cm;
    max-width: none;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  
  p {
    orphans: 3;
    widows: 3;
  }
  
  table, figure, .metric-card, .chart-container {
    page-break-inside: avoid;
  }
  
  a {
    text-decoration: underline;
    color: var(--color-primary);
  }
  
  /* Reset gradients for print */
  h1 {
    -webkit-text-fill-color: var(--color-primary);
    border-bottom-color: var(--color-text);
  }
}


/* Responsive */
@media (max-width: 1024px) {
  .report-container {
    padding: 3rem 4rem;
  }
}


@media (max-width: 768px) {
  body {
    padding: 1.5rem 1rem;
  }
  
  .report-container {
    padding: 2rem;
    border-radius: 16px;
  }
  
  h1 { font-size: 2rem; margin-top: 3rem; }
  h2 { font-size: 1.75rem; margin-top: 2.5rem; }
  h3 { font-size: 1.5rem; margin-top: 2rem; }
  h4 { font-size: 1.25rem; }
  
  ul, ol {
    padding-left: 1.5rem;
  }
}


@media (max-width: 480px) {
  .report-container {
    padding: 1.5rem;
  }
  
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
}
`;

/**
 * HTML Renderer Class
 * Handles rendering of both Markdown and React components to styled HTML
 */
export class HtmlRenderer {
  /**
   * Render markdown string to HTML
   */
  async renderMarkdown(
    markdown: string,
    options: HtmlRenderOptions = {}
  ): Promise<string> {
    // Configure marked
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    // Convert markdown to HTML
    const htmlContent = await marked(markdown);

    return this.wrapInTemplate(htmlContent, options);
  }

  /**
   * Render React component to HTML (for MDX/PDF)
   */
  async renderReact(
    reactComponent: React.ReactElement,
    options: HtmlRenderOptions = {}
  ): Promise<string> {
    const ReactDOMServer = (await import("react-dom/server")).default;

    const htmlContent = ReactDOMServer.renderToString(
      React.createElement(
        "div",
        { className: "report-container" },
        reactComponent
      )
    );

    return this.wrapInTemplate(htmlContent, options);
  }

  /**
   * Wrap HTML content in full document template with styles
   */
  private wrapInTemplate(
    htmlContent: string,
    options: HtmlRenderOptions = {}
  ): string {
    const {
      includeStyles = true,
      customCss,
      theme = "light",
      forPdf = false,
      pageSize = "A4",
      title = "Report",
      subtitle,
    } = options;

    // PDF-specific CSS
    const pdfCss = forPdf
      ? `
      @page {
        size: ${pageSize};
        margin: 20mm;
      }
      
      .metric-card, .chart-container, table, figure {
        page-break-inside: avoid;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      
      * {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    `
      : "";

    const css = customCss || (includeStyles ? ENHANCED_CSS + pdfCss : "");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
    <script>
    tailwind.config = {
      corePlugins: {
        preflight: false
      }
    };
  </script>
  ${css ? `<style>${css}</style>` : ""}
</head>
<body data-theme="${theme}">
  ${htmlContent}
</body>
</html>
    `.trim();
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function markdownToHtml(
  markdown: string,
  options: HtmlRenderOptions = {}
): Promise<string> {
  const renderer = new HtmlRenderer();
  return renderer.renderMarkdown(markdown, options);
}
