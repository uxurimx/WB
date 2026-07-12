import { NextResponse } from "next/server";
import { getPBNovedadesUnreadCount } from "@/app/actions/poxelbit";

export async function GET() {
  const count = await getPBNovedadesUnreadCount();
  return NextResponse.json({ count });
}
