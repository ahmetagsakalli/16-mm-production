import { NextResponse, type NextRequest } from 'next/server';
import { hasPublishedProject, redirectedSlug } from '@/lib/cms/store';
// Resolve renamed project URLs before the page/ISR cache, including immediately after a publish.
export async function proxy(request: NextRequest) {
    const slug = request.nextUrl.pathname.split('/')[2];
    const target = slug && await redirectedSlug(slug);
    if (target && target !== slug) {
        const origin = process.env.CMS_ORIGIN || `${request.nextUrl.protocol}//${request.headers.get('host') || request.nextUrl.host}`;
        const response = NextResponse.redirect(new URL(`/projects/${target}${request.nextUrl.search}`, origin), 308);
        response.headers.set('Cache-Control', 'no-store');
        return response;
    }
    // Check before streaming begins so missing/unpublished projects return a real
    // HTTP 404 instead of a successful response containing the not-found screen.
    if (slug && !await hasPublishedProject(slug)) {
        return NextResponse.rewrite(new URL('/404', request.url), {
            status: 404,
            headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
        });
    }
    return NextResponse.next();
}
export const config = { matcher: '/projects/:slug' };
