import React from "react";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import * as Components from "../components/index.js";
import {
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  Tag,
  Award,
  Building2,
  Calendar,
  Activity,
  BarChart,
  PieChart,
  LineChart,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

/**
 * MDX rendering options
 */
export interface MdxRenderOptions {
  customComponents?: Record<string, React.ComponentType<any>>;
}

/**
 * Lucide icons available in MDX templates
 */
const LucideIcons = {
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  Tag,
  Award,
  Building2,
  Calendar,
  Activity,
  BarChart,
  PieChart,
  LineChart,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
};

/**
 * Advanced MDX Renderer
 * Pure MDX → React conversion (no HTML/CSS concerns)
 */
export class AdvancedMdxRenderer {
  /**
   * Render MDX content to React components
   * @param mdxContent - The MDX content string
   * @param data - Data to be passed to MDX (available via props)
   * @param options - Rendering options
   * @returns React component and serialized source
   */
  async renderToReact(
    mdxContent: string,
    data: Record<string, any>,
    options: MdxRenderOptions = {}
  ): Promise<{ component: React.ReactElement; source: any }> {
    const { customComponents = {} } = options;

    // Combine all available components
    const allComponents = {
      ...Components,
      // Use StaticChart for SSR instead of Recharts Chart
      Chart: Components.StaticChart || Components.Chart,
      ...LucideIcons,
      ...customComponents,
    };

    // Serialize MDX content with plugins
    const mdxSource = await serialize(mdxContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm], // GitHub Flavored Markdown
        rehypePlugins: [rehypeHighlight], // Syntax highlighting
        format: "mdx",
      },
      scope: data, // Make data available in MDX
    });

    // Create React component
    const component = React.createElement(MDXRemote, {
      ...mdxSource,
      components: allComponents,
    });

    return { component, source: mdxSource };
  }
}

/**
 * Legacy export for backward compatibility
 */
export interface AdvancedMdxRenderOptions extends MdxRenderOptions {
  includeStyles?: boolean;
  customCss?: string;
  theme?: "light" | "dark";
}
