const PRODUCTION_ORIGIN = 'https://aidora-three.vercel.app';

export function getAuthRedirect(path = '/login') {
  const safePath = typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? path
    : '/login';

  if (import.meta.env.DEV) {
    const previewRedirect = import.meta.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim();
    if (previewRedirect) return previewRedirect;
  }

  const origin = window.location.hostname === 'aidora-three.vercel.app'
    ? PRODUCTION_ORIGIN
    : window.location.origin;
  return new URL(safePath, origin).toString();
}
