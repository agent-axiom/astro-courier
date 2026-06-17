const urlSchemePattern = /^[a-z][a-z\d+\-.]*:/i;

export function resolvePublicAssetPath(path: string, base = import.meta.env.BASE_URL): string {
  const trimmedPath = path.trim();
  if (trimmedPath.length === 0 || urlSchemePattern.test(trimmedPath)) {
    return trimmedPath;
  }

  return `${normalizePublicBase(base)}${trimmedPath.replace(/^\/+/, "")}`;
}

function normalizePublicBase(base: string | undefined): string {
  const trimmedBase = base?.trim();
  if (!trimmedBase) {
    return "/";
  }

  if (trimmedBase === "./") {
    return "./";
  }

  const withLeadingSlash = trimmedBase.startsWith("/") ? trimmedBase : `/${trimmedBase}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
