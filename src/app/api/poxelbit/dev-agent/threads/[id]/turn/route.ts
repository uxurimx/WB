import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getPoxelbitDevAgentConfig, runDevAgentTurnSafe } from "@/lib/poxelbit-dev-agent";
import { requirePoxelbitDevAccess } from "@/lib/poxelbit-dev-agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 16 * 1024 * 1024;
const MAX_REQUEST_BYTES = 23 * 1024 * 1024;
const ALLOWED_ATTACHMENTS = new Map<string, "image" | "document">([
  [".png", "image"], [".jpg", "image"], [".jpeg", "image"], [".webp", "image"], [".gif", "image"],
  [".pdf", "document"], [".docx", "document"], [".txt", "document"], [".md", "document"], [".csv", "document"], [".json", "document"],
]);

type IncomingAttachment = { name?: unknown; data?: unknown };
type RequestBody = { message?: unknown; attachments?: unknown };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePoxelbitDevAccess();
  if (access.response) return access.response;
  const config = getPoxelbitDevAgentConfig();
  if (!config.enabled) return Response.json({ error: config.reason }, { status: 503 });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return Response.json({ error: "La solicitud no pertenece a esta aplicación." }, { status: 403 });
    } catch {
      return Response.json({ error: "La solicitud no pertenece a esta aplicación." }, { status: 403 });
    }
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) return Response.json({ error: "Los adjuntos superan el límite total de 16 MB." }, { status: 413 });

  let body: RequestBody;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) return Response.json({ error: "Los adjuntos superan el límite total de 16 MB." }, { status: 413 });
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return Response.json({ error: "El mensaje no tiene un formato válido." }, { status: 400 });
    body = parsed as RequestBody;
  }
  catch { return Response.json({ error: "El mensaje no tiene un formato válido." }, { status: 400 }); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 5000) return Response.json({ error: "El mensaje puede tener hasta 5000 caracteres." }, { status: 400 });
  if (body.attachments !== undefined && !Array.isArray(body.attachments)) return Response.json({ error: "La lista de adjuntos no es válida." }, { status: 400 });
  const incoming = (Array.isArray(body.attachments) ? body.attachments : []) as IncomingAttachment[];
  if (incoming.length > MAX_ATTACHMENTS) return Response.json({ error: `Adjunta hasta ${MAX_ATTACHMENTS} archivos por mensaje.` }, { status: 400 });
  if (!message && incoming.length === 0) return Response.json({ error: "Escribe una solicitud o pega/adjunta un archivo." }, { status: 400 });

  const decoded: Array<{ name: string; kind: "image" | "document"; extension: string; bytes: Buffer }> = [];
  let totalBytes = 0;
  for (const item of incoming) {
    if (typeof item.name !== "string" || typeof item.data !== "string") return Response.json({ error: "Uno de los archivos no se pudo leer." }, { status: 400 });
    const name = path.basename(item.name).replace(/[\u0000-\u001f]/g, "_").slice(0, 180);
    const extension = path.extname(name).toLowerCase();
    const kind = ALLOWED_ATTACHMENTS.get(extension);
    if (!kind) return Response.json({ error: "Usa PNG, JPG, WEBP o GIF; también PDF, DOCX, TXT, MD, CSV o JSON." }, { status: 400 });
    const encoded = item.data.replace(/^data:[^,]*;base64,/, "");
    if (!encoded || !/^[\da-z+/]*={0,2}$/i.test(encoded) || encoded.length % 4 !== 0 || encoded.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 + 4) {
      return Response.json({ error: `No se pudo leer ${name} o supera el máximo de 8 MB.` }, { status: 400 });
    }
    const bytes = Buffer.from(encoded, "base64");
    if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES || bytes.toString("base64") !== encoded) {
      return Response.json({ error: `No se pudo leer ${name} o supera el máximo de 8 MB.` }, { status: 400 });
    }
    totalBytes += bytes.length;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) return Response.json({ error: "El total de los adjuntos no puede superar 16 MB." }, { status: 400 });
    decoded.push({ name, kind, extension, bytes });
  }

  const { id } = await params;
  let uploadDir: string;
  try { uploadDir = await mkdtemp(path.join(os.tmpdir(), "poxelbit-dev-agent-")); }
  catch { return Response.json({ error: "No se pudo preparar el espacio temporal de los adjuntos." }, { status: 500 }); }
  const attachments: Array<{ name: string; path: string; kind: "image" | "document" }> = [];
  try {
    for (const attachment of decoded) {
      const filePath = path.join(uploadDir, `${randomUUID()}${attachment.extension}`);
      await writeFile(filePath, attachment.bytes, { flag: "wx", mode: 0o600 });
      attachments.push({ name: attachment.name, path: filePath, kind: attachment.kind });
    }
  } catch {
    await rm(uploadDir, { recursive: true, force: true });
    return Response.json({ error: "No se pudieron guardar los adjuntos de forma temporal." }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: Record<string, unknown>) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); }
        catch { /* the browser may close the stream while Codex is still saving its result */ }
      };
      void runDevAgentTurnSafe(id, message, access.user, (text) => send({ type: "delta", text }), attachments)
        .then((result) => send({ type: "done", status: result.status }))
        .catch((error) => send({ type: "error", message: error instanceof Error ? error.message : "Codex no pudo completar la solicitud." }))
        .finally(async () => {
          await rm(uploadDir, { recursive: true, force: true }).catch(() => {});
          try { controller.close(); } catch { /* already closed */ }
        });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
