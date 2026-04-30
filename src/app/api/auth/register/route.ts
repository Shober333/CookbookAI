import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/route-helpers";

const registerSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return jsonError("An account with this email already exists.", 409);
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name || null,
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 10),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
