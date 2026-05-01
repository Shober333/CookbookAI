import { z } from "zod";
import { prisma } from "@/lib/db";

export const applianceKeys = [
  "oven",
  "stovetop",
  "microwave",
  "air_fryer",
  "slow_cooker",
  "grill",
  "instant_pot",
  "blender",
] as const;

export type ApplianceKey = (typeof applianceKeys)[number];

const applianceKeySet = new Set<string>(applianceKeys);

export const equipmentPayloadSchema = z.object({
  appliances: z
    .array(z.string())
    .transform((values) => normalizeAppliances(values)),
});

export function normalizeAppliances(values: string[]): ApplianceKey[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value): value is ApplianceKey => applianceKeySet.has(value)),
    ),
  );
}

export function serializeAppliances(values: string[]): string {
  return normalizeAppliances(values).join(",");
}

export function parseAppliances(value: string | null | undefined): ApplianceKey[] {
  if (!value) return [];

  return normalizeAppliances(value.split(","));
}

export async function getEquipmentProfileForUser(
  userId: string,
): Promise<{ appliances: ApplianceKey[] }> {
  const profile = await prisma.equipmentProfile.findUnique({
    where: { userId },
  });

  return { appliances: parseAppliances(profile?.appliances) };
}

export async function upsertEquipmentProfileForUser(
  userId: string,
  appliances: string[],
): Promise<{ appliances: ApplianceKey[] }> {
  const normalized = normalizeAppliances(appliances);

  await prisma.equipmentProfile.upsert({
    where: { userId },
    create: {
      userId,
      appliances: serializeAppliances(normalized),
    },
    update: {
      appliances: serializeAppliances(normalized),
    },
  });

  return { appliances: normalized };
}
