/* Vercel sets this at build to the production domain, so shared links,
   their preview cards and the structured data resolve to absolute URLs
   there, and to the local server anywhere else. */
export const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
