import mammoth from "mammoth";
import Tesseract from "tesseract.js";

export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<string> {
  const lowerName = filename.toLowerCase();

  if (mimetype === "application/pdf" || lowerName.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimetype.startsWith("image/")) {
    const result = await Tesseract.recognize(buffer, "eng");
    return result.data.text;
  }

  // Fallback: treat as plain text
  return buffer.toString("utf8");
}
