function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  optional: (name: string, fallback: string): string => process.env[name] ?? fallback,
  require: requireEnv,
  /**
   * Returns the absolute path to the installed puku-cli launcher
   * (PUKU_CLI_PATH env var). Undefined when unset, so call sites can
   * use it as a feature flag — see `tests/specs/cli/*`.
   *
   * The path is intentionally NOT hardcoded inside the automation so
   * the same code runs on any contributor machine + CI without leaking
   * a personal file layout. See `.env.example` for the convention.
   */
  pukuCliPath: (): string | undefined => process.env.PUKU_CLI_PATH,
};
