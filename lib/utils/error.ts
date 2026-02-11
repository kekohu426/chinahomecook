export function getErrorMessage(error: unknown, fallback = "操作失败"): string {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "object") {
    const value = error as Record<string, unknown>;
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
    if (Array.isArray(value.errors)) {
      const parts = value.errors.filter((item) => typeof item === "string") as string[];
      if (parts.length > 0) return parts.join("; ");
    }
  }

  return fallback;
}
