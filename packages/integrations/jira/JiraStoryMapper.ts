import { AcceptanceCriteria } from "@ai/schemas/requirement.schema";
import { JiraADFParser } from "../jira/JiraADFParser";

export interface Story {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  sprint?: string;
  priority?: string;
  storyType?: string;
}

export class StoryMapper {
  static map(issue: any): Story {
    const fields = issue.fields || {};

    const description = JiraADFParser.safeParse(fields.description);

    let acceptanceCriteria = "";

    // Custom AC field
    if (fields.customfield_10035) {
      acceptanceCriteria = JiraADFParser.safeParse(fields.customfield_10035);
    }

    // AC description me hi ho sakti hai
    if (!acceptanceCriteria) {
      acceptanceCriteria = this.extractAc(description);
    }

    return {
      id: issue.key,

      title: fields.summary || "",

      description,

      acceptanceCriteria,

      storyType: fields.issuetype?.name,

      priority: fields.priority?.name,
    };
  }

  private static extractAc(description: string): string {
    const regex = /(acceptance criteria|acceptance criteria:)([\s\S]*)/i;

    const match = description.match(regex);

    if (match?.[2]) {
      return match[2].trim();
    }

    return "";
  }

  /**
   * Convert an Acceptance Criteria text block into individual criteria lines.
   * Handles bullets, numbered lists, and AC1/AC2 patterns.
   */
  static extractAcItemsFromText(text: string): string[] {
    const cleaned = (text || "")
      .replace(/\r\n/g, "\n")
      // normalize common bullets to start-of-line markers
      .replace(/^\s*[•*]\s+/gm, "- ")
      .trim();

    if (!cleaned) return [];

    // If everything is in one paragraph but has AC1/AC2..., split those.
    // Example: "AC1: ... AC2: ... AC3: ..."
    if (/\bAC\s*\d+\s*[:\-]/i.test(cleaned) && !cleaned.includes("\n")) {
      const parts = cleaned
        .split(/(?=\bAC\s*\d+\s*[:\-])/i)
        .map((s) => s.trim())
        .filter(Boolean);
      return parts.map((p) => p.replace(/^AC\s*\d+\s*[:\-]\s*/i, "").trim()).filter(Boolean);
    }

    // Primary split: by newline
    const rawLines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Remove leading bullets / numbering / AC labels
    const normalized = rawLines
      .map((line) =>
        line
          .replace(/^[-–—]\s+/, "")
          .replace(/^\d+\s*[\.)]\s+/, "")
          .replace(/^AC\s*\d+\s*[:\-]\s*/i, "")
          .trim(),
      )
      .filter(Boolean);

    return normalized;
  }

  static mapMany(issues: any[]): Story[] {
    return issues.map(this.map.bind(this));
  }

  static extractAcceptanceCriteria(
    acceptanceCriteria?: string,
    description?: string
  ): AcceptanceCriteria[] {

    const source =
      acceptanceCriteria?.trim()
        ? acceptanceCriteria
        : description ?? "";

    if (!source.trim()) {
      return [];
    }

    const results: AcceptanceCriteria[] = [];

    const regex =
      /(AC\d+)\s*([\s\S]*?)(?=AC\d+|$)/gi;

    let match;

    while (
      (match = regex.exec(source)) !== null
    ) {

      const id =
        match[1].trim();

      const acDescription =
        match[2]
          .replace(/\s+/g, " ")
          .trim();

      if (!acDescription) {
        continue;
      }

      results.push({

        id,

        description:
          acDescription

      });

    }

    return results;

  }
}
