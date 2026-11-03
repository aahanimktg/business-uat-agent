import fs from "fs/promises";
import path from "path";

export class ContextService {
  async appendKnowledge(rules: string[]) {
    const file = path.join(
      process.cwd(),
      "output",
      "context",
      "business-knowledge.json",
    );

    await fs.mkdir(path.dirname(file), {
      recursive: true,
    });

    let context: {
      rules: {
        rule: string;
        addedOn: string;
      }[];
    } = {
      rules: [],
    };

    try {
      context = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {}

    context.rules.push(
      ...rules.map((rule) => ({
        rule,
        addedOn: new Date().toISOString(),
      })),
    );

    await fs.writeFile(
      file,

      JSON.stringify(context, null, 2),
    );
  }
}
