import { AIProvider } from "../providers/AIProvider";
import { StructuredResponseService } from "./structured-response.service";
import { buildJiraDraftPrompt } from "../prompts/jira-draft.prompt";
import { JiraDraft, JiraDraftSchema } from "../../domain/schemas/jira-draft.schema";

export class JiraDraftService {
  constructor(
    private readonly provider: AIProvider,
    private readonly structuredResponse: StructuredResponseService,
  ) {}

  async draft(input: string): Promise<JiraDraft> {
    const prompt = buildJiraDraftPrompt(input);
    const response = await this.provider.chat([
      {
        role: "system",
        content: "You are a senior business analyst. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ]);

    return this.structuredResponse.parse(response, JiraDraftSchema);
  }
}
