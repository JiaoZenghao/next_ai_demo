const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin123";

export const DEMO_SESSION_COOKIE = "ai_demo_session";
export const DEMO_SESSION_VALUE = "authenticated";

export function validateCredentials(
  username: unknown,
  password: unknown,
): boolean {
  return username === DEMO_USERNAME && password === DEMO_PASSWORD;
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
): "/" | "/login" | null {
  if (pathname === "/login") {
    return isAuthenticated ? "/" : null;
  }

  return isAuthenticated ? null : "/login";
}
