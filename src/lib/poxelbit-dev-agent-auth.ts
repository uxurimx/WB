import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const POXELBIT_DEV_ALLOWED_EMAIL = "poxelbit@gmail.com";

export function isPoxelbitDevAccount(user: {
  primaryEmailAddress?: { emailAddress: string; verification: { status: string } | null } | null;
} | null) {
  const email = user?.primaryEmailAddress?.emailAddress.trim().toLowerCase();
  const verified = user?.primaryEmailAddress?.verification?.status === "verified";
  return email === POXELBIT_DEV_ALLOWED_EMAIL && verified;
}

export async function requirePoxelbitDevAccess() {
  const user = await currentUser();
  if (!user) return { response: NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 }) };
  if (!isPoxelbitDevAccount(user)) {
    return { response: NextResponse.json({ error: "Este portal de desarrollo está reservado a la cuenta autorizada de PoxelBit." }, { status: 403 }) };
  }
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.primaryEmailAddress?.emailAddress || "Staff PoxelBit";
  return { user: { id: user.id, name } };
}
