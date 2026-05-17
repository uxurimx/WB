import { NextResponse } from "next/server";
import { getPBOpenTicketsCount } from "@/app/actions/poxelbit";

export async function GET() {
  const count = await getPBOpenTicketsCount();
  return NextResponse.json({ count });
}
