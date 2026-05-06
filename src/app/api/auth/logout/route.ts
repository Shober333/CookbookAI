import { NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

export async function POST(request: Request) {
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl, {
    status: 303,
  });

  const secure = redirectUrl.protocol === "https:";
  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure:
        secure || name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }

  return response;
}
