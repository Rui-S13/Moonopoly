export function safeReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  if (value.startsWith('/login') || value.startsWith('/signup')) {
    return '/';
  }
  return value;
}