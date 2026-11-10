export function getApplicationBaseUrl(): string {
  const configured = process.env.UAT_BASE_URL?.trim();
  const value = configured || "https://www.etihad.com/en-in/";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("UAT_BASE_URL must be an absolute HTTP(S) URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("UAT_BASE_URL must use HTTP or HTTPS");
  }
  return url.toString();
}
