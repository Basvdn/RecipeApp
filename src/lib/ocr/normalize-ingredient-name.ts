export function normalizeIngredientName(name: string): string {
  let normalized = name.trim().toLowerCase();
  normalized = normalized.replace(/[^a-z0-9À-ž\s-]/g, "");
  normalized = normalized.replace(/\s+/g, " ").trim();
  if (normalized.endsWith("oes")) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith("ies")) {
    normalized = normalized.slice(0, -3) + "y";
  } else if (normalized.endsWith("s") && !normalized.endsWith("ss")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}
