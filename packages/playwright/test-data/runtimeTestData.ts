export function requireTestData(name: string): string {
  const suffix = name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  const key = `UAT_TESTDATA_${suffix}`;
  const value = process.env[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required test-data environment variable ${key}`);
  }
  return value;
}

export function testDataEnvironment(data: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([name, value]) => {
      if (value === undefined || value === null) {
        throw new Error(`Test data '${name}' is missing`);
      }
      const suffix = name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
      return [`UAT_TESTDATA_${suffix}`, String(value)];
    }),
  );
}
