import { androidAssetLinks } from "@/lib/app-links";

// Served at https://tariften.com/.well-known/assetlinks.json for Android App Links.
export const dynamic = "force-dynamic";

export function GET() {
  const body = androidAssetLinks(process.env.ANDROID_CERT_SHA256);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}
