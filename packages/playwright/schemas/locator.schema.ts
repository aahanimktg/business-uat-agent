import { z } from "zod";

export const LocatorStrategySchema = z.enum([
  "role", "label", "testId", "placeholder", "text", "css",
]);

export const LocatorRoleSchema = z.enum([
  "alert", "alertdialog", "application", "article", "banner", "blockquote", "button",
  "caption", "cell", "checkbox", "code", "columnheader", "combobox", "complementary",
  "contentinfo", "definition", "deletion", "dialog", "directory", "document", "emphasis",
  "feed", "figure", "form", "generic", "grid", "gridcell", "group", "heading", "img",
  "insertion", "link", "list", "listbox", "listitem", "log", "main", "marquee", "math",
  "meter", "menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio", "navigation",
  "none", "note", "option", "paragraph", "presentation", "progressbar", "radio", "radiogroup",
  "region", "row", "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator",
  "slider", "spinbutton", "status", "strong", "subscript", "superscript", "switch", "tab",
  "table", "tabpanel", "term", "textbox", "time", "timer", "toolbar", "tooltip", "tree",
  "treegrid", "treeitem",
]);

/** Durable locator description. Never store an MCP snapshot ref here. */
export const LocatorDescriptorSchema = z.object({
  strategy: LocatorStrategySchema,
  value: z.string().trim().min(1),
  role: LocatorRoleSchema.optional(),
  exact: z.boolean().default(true),
  scope: z.string().trim().min(1).optional(),
  source: z.enum(["aria", "label", "testid", "placeholder", "visible-text", "dom"]).optional(),
}).strict().superRefine((locator, ctx) => {
  if (locator.strategy === "role" && !locator.role) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["role"], message: "role is required when strategy is role" });
  }
  if (locator.strategy !== "role" && locator.role) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["role"], message: "role can only be used with strategy=role" });
  }
});

export type LocatorDescriptor = z.infer<typeof LocatorDescriptorSchema>;

export const LocatorResolutionSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("resolved"), locator: LocatorDescriptorSchema, evidence: z.string().min(1) }).strict(),
  z.object({ status: z.literal("blocked"), reason: z.string().min(1) }).strict(),
]);

export type LocatorResolution = z.infer<typeof LocatorResolutionSchema>;
