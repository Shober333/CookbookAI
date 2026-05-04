import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export async function POST(request: Request) {
  try {
    await signOut({ redirect: false, redirectTo: "/login" });
  } catch (error) {
    console.error("[auth] Sign-out failed", error);
  }

  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return response;
}
