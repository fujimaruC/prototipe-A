export const prerender = true;
// GitHub Pages resolves /secret to /secret/index.html; 'never' relies on extensionless
// fallbacks that only some hosts implement.
export const trailingSlash = 'always';
