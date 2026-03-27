import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channel = params.get("channel_name");

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channel, {
    user_id: userId,
  });

  return NextResponse.json(authResponse);
}
