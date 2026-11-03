// src/parsers/JiraADFParser.ts

export class JiraADFParser {
  static parse(adf: any): string {
    if (!adf) {
      return "";
    }

    const lines: string[] = [];

    const walk = (node: any) => {
      if (!node) {
        return;
      }

      // Preserve basic structure so Acceptance Criteria in Jira (often bullets/paragraphs)
      // can be split into multiple items later.
      // Jira ADF commonly uses: paragraph, bulletList, orderedList, listItem.
      const blockTypes = new Set([
        "paragraph",
        "listItem",
      ]);

      if (node.type === "text") {
        lines.push(node.text);
      }

      if (Array.isArray(node.content)) {
        node.content.forEach(walk);
      }

      if (blockTypes.has(node.type)) {
        lines.push("\n");
      }
    };

    walk(adf);

    return lines
      .join("")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  static safeParse(value: any): string {
    try {
      if (typeof value === "string") {
        return value;
      }

      return this.parse(value);
    } catch {
      return "";
    }
  }
}
