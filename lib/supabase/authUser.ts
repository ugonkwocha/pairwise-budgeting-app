export function getAuthUserName(user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined) {
  const metadata = user?.user_metadata || {};
  const name =
    metadata.name ||
    metadata.full_name ||
    metadata.display_name ||
    metadata.preferred_username;

  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  return user?.email?.split('@')[0] || 'User';
}
