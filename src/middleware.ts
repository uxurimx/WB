import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /api/cron se protege con CRON_SECRET dentro del route handler, no con Clerk
const isPublicRoute = createRouteMatcher(['/', '/login', '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks(.*)', '/api/uploadthing(.*)', '/offline', '/api/analytics/session', '/api/analytics/event', '/api/cron(.*)']);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
