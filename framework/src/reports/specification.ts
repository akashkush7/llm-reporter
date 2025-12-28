import { SpecificationConfig } from "../plugins/plugin-interface.js";

export interface InputSpec {
  path: string;
  name: string;
}

export interface PromptSpec {
  file: string;
  name: string;
  inputs: string[];
}

export interface TemplateSpec {
  file: string;
  type: "njk" | "mdx";
}

export interface ReportSpecification {
  inputs: InputSpec[];
  prompts: PromptSpec[];
  template: TemplateSpec;
}

export function validateSpecification(spec: SpecificationConfig): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!spec.inputs || !Array.isArray(spec.inputs)) {
    errors.push("Missing or invalid inputs array");
  } else {
    spec.inputs.forEach((input, idx) => {
      if (!input.path || typeof input.path !== "string") {
        errors.push(`Input ${idx}: missing or invalid path`);
      }
      if (!input.name || typeof input.name !== "string") {
        errors.push(`Input ${idx}: missing or invalid name`);
      }
    });
  }

  if (!spec.prompts || !Array.isArray(spec.prompts)) {
    errors.push("Missing or invalid prompts array");
  } else {
    spec.prompts.forEach((prompt, idx) => {
      if (!prompt.file || typeof prompt.file !== "string") {
        errors.push(`Prompt ${idx}: missing or invalid file`);
      }
      if (!prompt.name || typeof prompt.name !== "string") {
        errors.push(`Prompt ${idx}: missing or invalid name`);
      }
      if (!prompt.inputs || !Array.isArray(prompt.inputs)) {
        errors.push(`Prompt ${idx}: missing or invalid inputs array`);
      }
    });
  }

  if (!spec.template || typeof spec.template !== "object") {
    errors.push("Missing or invalid template object");
  } else {
    if (!spec.template.file || typeof spec.template.file !== "string") {
      errors.push("Template: missing or invalid file");
    }
    if (!spec.template.type || !["njk", "mdx"].includes(spec.template.type)) {
      errors.push('Template: type must be "njk" or "mdx"');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
