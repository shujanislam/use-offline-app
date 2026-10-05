/** App Router routes worth having ready before the connection drops. */
export const IMPORTANT_ROUTES = ["/feed", "/jobs", "/events", "/profile"] as const;

/** Public, user-independent page shells the Service Worker precaches. */
export const PRECACHED_SHELLS = ["/", "/login", "/~offline", ...IMPORTANT_ROUTES];
