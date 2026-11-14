// Configuration partagée par le serveur (scripts/serve.mjs), le sitemap (scripts/build-seo.mjs) et les tests.
export const SITE_URL = (process.env.SITE_URL || "https://cybersecurity.eflex.app").replace(/\/+$/, "");

/** Politique CSP stricte : aucun script/style en ligne, aucune ressource tierce. */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join("; ");

export const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin"
};
export const HSTS = "max-age=31536000; includeSubDomains";

/** Pages HTML publiques (URL propres : /catalogue pour catalogue.html ; l'accueil est /). */
export const PAGES = ["index", "catalogue", "domaines", "communaute", "docs", "mentions-legales", "confidentialite"];
