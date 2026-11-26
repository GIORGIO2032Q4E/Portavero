type PortaveroMomxmarebeli = { id: string; email?: string };
export type PortaveroSesia = { user: PortaveroMomxmarebeli };
export type ShenakhuliShefaseba = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Dzveli browser-storage sesiis tokenebi waShale; axali sesia HttpOnly cookie-ebit marTvis.
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("portavero-auth-session");
  } catch {
    // Private an shezRudul browser-modshi storage sheidzleba xelmisawvdomi ar iyos.
  }
}

export function authKonfigurirebulia() {
  return Boolean(supabaseUrl && supabaseKey);
}

async function gaagzavneAngarishisMotxovna<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    },
    cache: "no-store",
    credentials: "same-origin"
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(typeof result.error === "string"
      ? result.error
      : "The account request could not be completed. Please try again.");
  }

  return result as T;
}

async function gaagzavneSesiisMotxovna<T>(body: Record<string, unknown>) {
  return gaagzavneAngarishisMotxovna<T>("/api/account/session", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function registracia(email: string, password: string) {
  return gaagzavneSesiisMotxovna<{ session: PortaveroSesia | null; user: PortaveroMomxmarebeli | null }>({
    action: "signup",
    email: email.trim(),
    password
  });
}

export async function sesiashiShesvla(email: string, password: string) {
  const result = await gaagzavneSesiisMotxovna<{ session: PortaveroSesia | null; error?: string }>({
    action: "signin",
    email: email.trim(),
    password
  });

  if (!result.session) {
    throw new Error(result.error || "Sign-in did not create a session. Check email confirmation and try again.");
  }

  return result.session;
}

export async function sesiidanGasvla() {
  await gaagzavneSesiisMotxovna<{ signedOut: boolean }>({ action: "signout" });
}

export async function parolisGanaxleba(password: string) {
  await gaagzavneSesiisMotxovna<{ updated: boolean }>({ action: "update-password", password });
}

export async function aghadgenisSesiisDawyeba(): Promise<PortaveroSesia | null> {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (params.get("type") !== "recovery") return null;

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    throw new Error("The recovery link is incomplete or expired. Request a new password reset link.");
  }

  // Remove recovery credentials from the address bar before exchanging them for HttpOnly cookies.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  const result = await gaagzavneSesiisMotxovna<{ session: PortaveroSesia }>({
    action: "recovery",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(params.get("expires_in") ?? 3600)
  });

  return result.session;
}

export async function parolisAghdgenisGagzavna(email: string) {
  const result = await gaagzavneAngarishisMotxovna<{ status?: string }>("/api/account/password-reset", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() })
  });

  if (result.status !== "accepted") {
    throw new Error("Password reset could not be completed. Please try again.");
  }
}

export async function migheSesia(): Promise<PortaveroSesia | null> {
  const result = await gaagzavneAngarishisMotxovna<{ session: PortaveroSesia | null }>("/api/account/session");
  return result.session;
}

export async function migheShenakhuliShefasebebi() {
  const session = await migheSesia();
  if (!session) return [];

  return gaagzavneAngarishisMotxovna<ShenakhuliShefaseba[]>("/api/account/estimates");
}

export async function washaleShenakhuliShefaseba(id: string) {
  const session = await migheSesia();
  if (!session) throw new Error("Sign in to manage your saved estimates.");

  await gaagzavneAngarishisMotxovna<{ deleted: boolean }>("/api/account/estimates", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
}
