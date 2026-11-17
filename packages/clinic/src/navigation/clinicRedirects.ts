type Redirect = { source: string; destination: string; permanent: boolean };

// Direct-URL entry points for features hidden in clinic mode. Sent to the clinic landing page,
// not a 404, so old bookmarks and emailed links still land somewhere useful.
const HIDDEN_ROOTS = ["teams", "workflows", "routing", "insights"] as const;

export function getClinicRedirects(enabled: boolean): Redirect[] {
  if (!enabled) return [];

  return HIDDEN_ROOTS.flatMap((root) => [
    { source: `/${root}`, destination: "/event-types", permanent: false },
    { source: `/${root}/:path*`, destination: "/event-types", permanent: false },
  ]);
}
