/**
 * Universal links (iOS) and App Links (Android) for the Tariften app.
 * Only guide pages (/rehber/...) open the app; everything else stays on the web.
 *
 * Values come from Vercel env so no secret/ID is hard-coded:
 * - APPLE_TEAM_ID: 10-character Apple Developer Team ID.
 * - ANDROID_CERT_SHA256: release signing certificate SHA-256 fingerprint(s),
 *   comma separated ("AA:BB:…"); Play App Signing's key comes first.
 * Without them the files answer 404, so no app claims links by mistake.
 */
export const APP_LINK_PATHS = ["/rehber", "/rehber/*"] as const;
export const IOS_BUNDLE_ID = "com.tariften.app";
export const ANDROID_PACKAGE = "com.tariften.app";

export function appleAppSiteAssociation(teamId: string | undefined): Record<string, unknown> | null {
  const id = (teamId || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(id)) return null;
  return {
    applinks: {
      details: [{
        appIDs: [`${id}.${IOS_BUNDLE_ID}`],
        components: APP_LINK_PATHS.map(path => ({ "/": path, comment: "Mutfak Rehberi" })),
      }],
    },
    webcredentials: { apps: [`${id}.${IOS_BUNDLE_ID}`] },
  };
}

export function androidAssetLinks(fingerprints: string | undefined): Record<string, unknown>[] | null {
  const list = (fingerprints || "")
    .split(",")
    .map(f => f.trim().toUpperCase())
    .filter(f => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
  if (list.length === 0) return null;
  return [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: list },
  }];
}
