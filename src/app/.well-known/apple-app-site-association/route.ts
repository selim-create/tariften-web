import { appleAppSiteAssociation } from "@/lib/app-links";

// Served at https://tariften.com/.well-known/apple-app-site-association
// (JSON, no extension, no redirect) for iOS universal links.
export const dynamic = "force-dynamic";

export function GET() {
  const body = appleAppSiteAssociation(process.env.APPLE_TEAM_ID);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}
