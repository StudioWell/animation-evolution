/**
 * Google sign-in through Google Identity Services (GIS), entirely in the
 * browser. Google returns a signed ID token; this site reads the account id
 * (`sub`) and email from it to key the visitor's profile. Nothing is sent to a
 * server of ours, and no Google API access is requested — only "who is this".
 *
 * Setup: create an OAuth client (type "Web application") in Google Cloud
 * Console, add the site's origin under "Authorized JavaScript origins", and set
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID. The client id is public by design; there is no
 * secret to protect.
 */

export const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();
const GIS_SRC = "https://accounts.google.com/gsi/client";

export function googleConfigured(): boolean {
  return /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID);
}

export interface GoogleIdentity {
  sub: string;
  email: string | null;
  name: string;
}

interface GsiId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
  disableAutoSelect(): void;
}
type GsiWindow = Window & { google?: { accounts?: { id?: GsiId } } };

let loading: Promise<GsiId> | null = null;

function loadGis(): Promise<GsiId> {
  const w = window as GsiWindow;
  if (w.google?.accounts?.id) return Promise.resolve(w.google.accounts.id);
  loading ??= new Promise<GsiId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => (w.google?.accounts?.id ? resolve(w.google.accounts.id) : reject(new Error("gis-missing")));
    script.onerror = () => {
      loading = null;
      reject(new Error("gis-blocked"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Decode and sanity-check a GIS ID token (audience, issuer, expiry). */
export function readIdToken(token: string, clientId = GOOGLE_CLIENT_ID, now = Date.now()): GoogleIdentity | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    const expOk = typeof claims.exp === "number" && claims.exp * 1000 > now;
    if (!issuerOk || claims.aud !== clientId || !expOk || typeof claims.sub !== "string" || !/^[0-9]{1,64}$/.test(claims.sub)) return null;
    return {
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      name: typeof claims.name === "string" ? claims.name.slice(0, 60) : "",
    };
  } catch {
    return null;
  }
}

/**
 * Render Google's own "Sign in with Google" button into `parent`. Resolves once
 * the button is drawn; `onSignIn` runs when the visitor completes sign-in.
 */
export async function renderGoogleButton(
  parent: HTMLElement,
  options: { locale: string; width: number; onSignIn: (identity: GoogleIdentity) => void; onError: () => void },
): Promise<void> {
  const gis = await loadGis();
  gis.initialize({
    client_id: GOOGLE_CLIENT_ID,
    ux_mode: "popup",
    itp_support: true,
    use_fedcm_for_button: true,
    callback: (response) => {
      const identity = response.credential ? readIdToken(response.credential) : null;
      if (identity) options.onSignIn(identity);
      else options.onError();
    },
  });
  gis.renderButton(parent, {
    type: "standard",
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "continue_with",
    logo_alignment: "left",
    locale: options.locale,
    width: Math.round(Math.min(400, Math.max(200, options.width))),
  });
}

export function googleSignOut() {
  (window as GsiWindow).google?.accounts?.id?.disableAutoSelect();
}
