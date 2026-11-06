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

  // Converts plain text (paragraphs separated by blank lines, lines starting with
  // "- " treated as bullets) into the Atlassian Document Format Jira's v3 API requires.
  static textToAdf(text: string) {
    const blocks = (text || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

    const content = blocks.map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const isBulletList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));

      if (isBulletList) {
        return {
          type: "bulletList",
          content: lines.map((l) => ({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: l.replace(/^[-*]\s+/, "") }],
              },
            ],
          })),
        };
      }

      return {
        type: "paragraph",
        content: [{ type: "text", text: block }],
      };
    });

    return {
      type: "doc",
      version: 1,
      content: content.length > 0 ? content : [{ type: "paragraph", content: [] }],
    };
  }
}
