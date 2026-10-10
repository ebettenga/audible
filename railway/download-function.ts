const APK_URL =
  "https://raw.githubusercontent.com/ebettenga/audible/main/releases/audible-1.0.0.apk?v=262454e";
const FILENAME = "audible-1.0.0.apk";
const BUILD_LABEL = "1.0.7 (main @ 262454e)";

const PAGE = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Download Audible</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0d1110; color: #e8efe6; margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
    main { text-align: center; }
    a { display: inline-block; background: #c9f25b; color: #0d1110; font-weight: 700; text-decoration: none; padding: 16px 28px; border-radius: 14px; font-size: 18px; }
    p { color: #9aa39a; max-width: 28rem; line-height: 1.45; margin: 0 auto 24px; }
    code { color: #c9f25b; font-size: 0.9em; }
  </style>
</head>
<body>
  <main>
    <h1>Audible</h1>
    <p>Build <code>${BUILD_LABEL}</code>: assignment drawer stays closed until you tap a player; centered route preview with correct mirroring; Build tab crash fix; sheet above Android nav bar. Uninstall the old APK first if Android says the app is already installed. Tap download, wait until complete, then open the APK.</p>
    <a href="/audible-1.0.0.apk">Download APK</a>
  </main>
</body>
</html>`;

let cached: { body: Uint8Array; at: number } | null = null;
const CACHE_MS = 30 * 1000;

async function apkBytes(): Promise<Uint8Array> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.body;
  const upstream = await fetch(APK_URL);
  if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
  const body = new Uint8Array(await upstream.arrayBuffer());
  cached = { body, at: Date.now() };
  return body;
}

export default {
  async fetch(req: Request) {
    const path = new URL(req.url).pathname;
    if (path === "/audible-1.0.0.apk" || path === "/download") {
      try {
        const body = await apkBytes();
        return new Response(body.buffer as ArrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": `attachment; filename="${FILENAME}"`,
            "Content-Length": String(body.byteLength),
            "Cache-Control": "no-store",
          },
        });
      } catch {
        return new Response("APK unavailable", { status: 502 });
      }
    }
    return new Response(PAGE, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  },
};
