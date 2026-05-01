import { NextResponse } from "next/server";
import {
  equipmentPayloadSchema,
  getEquipmentProfileForUser,
  upsertEquipmentProfileForUser,
} from "@/lib/equipment-service";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  const profile = await getEquipmentProfileForUser(userId);

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = equipmentPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid equipment payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const profile = await upsertEquipmentProfileForUser(
    userId,
    parsed.data.appliances,
  );

  return NextResponse.json(profile);
}
