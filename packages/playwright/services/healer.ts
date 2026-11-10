import { z } from "zod";
import { AIProvider } from "../../ai/providers/AIProvider.js";
import healerPrompt from "../prompts/healer.prompt.js";
import { LocatorDescriptorSchema } from "../schemas/locator.schema.js";

const RepairProposalSchema = z.object({
  status: z.enum(["repair_proposed", "blocked"]),
  reason: z.string().min(1),
  locatorHint: z.preprocess(value => value === null ? undefined : value, LocatorDescriptorSchema.optional()),
}).strict();
export type RepairProposal = z.infer<typeof RepairProposalSchema>;

/** Healer diagnoses and proposes only; it never edits approved tests or assertions. */
export async function proposeRepair(input: {
  failure: unknown; evidence: unknown; attempt: number; maxAttempts?: number;
}) : Promise<RepairProposal> {
  const maxAttempts = input.maxAttempts ?? Number(process.env.MAX_HEAL_ATTEMPTS ?? 2);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 0) {
    throw new Error("MAX_HEAL_ATTEMPTS must be a non-negative integer");
  }
  if (input.attempt < 0 || input.attempt >= maxAttempts) {
    return { status: "blocked", reason: `Repair attempt limit reached (${maxAttempts})` };
  }
  const ai = new AIProvider();
  const response = await ai.chat([
      { role: "system", content: healerPrompt },
      { role: "user", content: JSON.stringify({ ...input, maxAttempts }) },
    ]);
  const parsed = RepairProposalSchema.parse(JSON.parse(response));
  if (parsed.status === "repair_proposed" && !parsed.locatorHint) {
    return { status: "blocked", reason: "Repair proposal did not include a semantic locator descriptor" };
  }
  return parsed;
}
