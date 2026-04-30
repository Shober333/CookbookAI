import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();

  return session?.user?.id ?? null;
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
