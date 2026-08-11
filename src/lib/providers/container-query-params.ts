const controlCharacterPattern = /[\u0000-\u001F\u007F]/g;
const hasControlCharacterPattern = /[\u0000-\u001F\u007F]/;

export function parseInitialContainerQuery(
  value: string | string[] | undefined,
  maxLength = 512
) {
  if (typeof value !== "string" || value.length > maxLength) {
    return "";
  }

  return value.replace(controlCharacterPattern, "").trim();
}

export function buildContainerResourceQuery(providerId: string, resourceId: string) {
  return `provider-id:${quoteQueryValue(providerId)} resource-id:${quoteQueryValue(resourceId)}`;
}

function quoteQueryValue(value: string) {
  const normalized = value.trim();

  if (!normalized || value.includes('"') || hasControlCharacterPattern.test(value)) {
    throw new Error("Container query values must be non-empty and safe to quote.");
  }

  return `"${normalized}"`;
}
