"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent } from "react";
import { Bot, Plus, Send, RefreshCw, ShieldAlert, GitBranch, UserRound, Sparkles, Paperclip, X, Image as ImageIcon } from "lucide-react";
import NextImage from "next/image";
import type { DevAgentEvent, DevAgentThread } from "@/lib/poxelbit-dev-agent";

type AgentConfig = { enabled: boolean; reason?: string; branch: string; dangerousMode: boolean };
type ThreadFile = { thread: DevAgentThread; events: DevAgentEvent[] };
type WorkspaceFile = { status: string; path: string };
type DraftAttachment = { id: string; file: File; previewUrl?: string; kind: "image" | "document" };

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 16 * 1024 * 1024;
const ALLOWED_FILE_KINDS = new Map<string, "image" | "document">([
  ["png", "image"], ["jpg", "image"], ["jpeg", "image"], ["webp", "image"], ["gif", "image"],
  ["pdf", "document"], ["docx", "document"], ["txt", "document"], ["md", "document"], ["csv", "document"], ["json", "document"],
]);

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error(`No se pudo leer ${file.name}.`));
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function PoxelbitDevAgentClient({ config }: { config: AgentConfig }) {
  const [threads, setThreads] = useState<DevAgentThread[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [events, setEvents] = useState<DevAgentEvent[]>([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const attachmentRef = useRef<DraftAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(config.enabled);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef("");

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => () => attachmentRef.current.forEach((item) => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); }), []);

  function replaceAttachments(next: DraftAttachment[]) {
    attachmentRef.current = next;
    setAttachments(next);
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    const next = [...attachments];
    let totalBytes = next.reduce((total, item) => total + item.file.size, 0);
    let validationError = "";
    for (const file of files) {
      const extension = file.name.split(".").at(-1)?.toLowerCase() || "";
      const kind = ALLOWED_FILE_KINDS.get(extension);
      if (!kind) { validationError ||= `No se admite ${file.name}. Usa imágenes, PDF, DOCX, TXT, MD, CSV o JSON.`; continue; }
      if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) { validationError ||= `Cada archivo debe pesar hasta 8 MB: ${file.name}.`; continue; }
      if (next.length >= MAX_ATTACHMENTS) { validationError ||= `Puedes adjuntar hasta ${MAX_ATTACHMENTS} archivos por mensaje.`; break; }
      if (totalBytes + file.size > MAX_TOTAL_ATTACHMENT_BYTES) { validationError ||= "El total de los adjuntos debe ser de hasta 16 MB."; break; }
      const image = kind === "image";
      next.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, file, kind, previewUrl: image ? URL.createObjectURL(file) : undefined });
      totalBytes += file.size;
    }
    replaceAttachments(next);
    setError(validationError);
  }

  function removeAttachment(id: string) {
    const item = attachments.find((entry) => entry.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    replaceAttachments(attachments.filter((entry) => entry.id !== id));
  }

  function onFileSelection(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files || []));
    event.target.value = "";
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (!files.length) return;
    event.preventDefault();
    addFiles(files.map((file, index) => {
      const extensionByType: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
      const extension = extensionByType[file.type];
      return extension && file.name === "image.png" ? new File([file], `captura-${Date.now()}-${index + 1}.${extension}`, { type: file.type, lastModified: file.lastModified }) : file;
    }));
  }

  const loadThread = useCallback(async (id: string) => {
    const response = await fetch(`/api/poxelbit/dev-agent/threads/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo abrir la conversación.");
    const file = data as ThreadFile;
    setEvents(file.events);
    setThreads((previous) => previous.map((thread) => thread.id === file.thread.id ? file.thread : thread));
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!config.enabled) return;
    setWorkspaceLoading(true);
    try {
      const response = await fetch("/api/poxelbit/dev-agent/workspace", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo revisar el repositorio.");
      setWorkspaceFiles(data.files as WorkspaceFile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revisar el repositorio.");
    } finally { setWorkspaceLoading(false); }
  }, [config.enabled]);

  const loadThreads = useCallback(async (preferredId?: string) => {
    if (!config.enabled) return;
    setError("");
    try {
      const response = await fetch("/api/poxelbit/dev-agent/threads", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el historial.");
      const list = data.threads as DevAgentThread[];
      setThreads(list);
      const currentId = selectedIdRef.current;
      const nextId = preferredId && list.some((thread) => thread.id === preferredId) ? preferredId : currentId && list.some((thread) => thread.id === currentId) ? currentId : list[0]?.id || "";
      setSelectedId(nextId);
      if (nextId) await loadThread(nextId);
      else setEvents([]);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar con el agente.");
    } finally {
      setLoading(false);
    }
  }, [config.enabled, loadThread, loadWorkspace]);

  useEffect(() => { void loadThreads(); }, [loadThreads]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [events]);

  async function createThread() {
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/poxelbit/dev-agent/threads", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar una conversación.");
      await loadThreads(data.thread.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar Codex.");
    } finally { setCreating(false); }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if ((!text && attachments.length === 0) || !selectedId || sending) return;
    setSending(true);
    setError("");
    const visibleMessage = [text, ...attachments.map((item) => `📎 ${item.file.name}`)].filter(Boolean).join("\n");
    const temporaryUser: DevAgentEvent = { id: `local-${Date.now()}`, role: "user", content: visibleMessage, createdAt: new Date().toISOString() };
    const temporaryAssistant: DevAgentEvent = { id: `assistant-${Date.now()}`, role: "assistant", content: "", createdAt: new Date().toISOString() };
    setEvents((previous) => [...previous, temporaryUser, temporaryAssistant]);

    try {
      const encodedAttachments = await Promise.all(attachments.map(async ({ file }) => ({ name: file.name, data: await fileAsDataUrl(file) })));
      const response = await fetch(`/api/poxelbit/dev-agent/threads/${encodeURIComponent(selectedId)}/turn`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, attachments: encodedAttachments }),
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo enviar la solicitud.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let finished = false;
      while (!finished) {
        const part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const line = block.split("\n").find((row) => row.startsWith("data: "));
          if (!line) continue;
          const data = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string; status?: string };
          if (data.type === "delta") {
            assistantText += data.text || "";
            setEvents((previous) => previous.map((item) => item.id === temporaryAssistant.id ? { ...item, content: assistantText } : item));
          } else if (data.type === "error") {
            throw new Error(data.message || "Codex no pudo completar la solicitud.");
          } else if (data.type === "done") {
            finished = true;
          }
        }
      }
      if (!assistantText.trim()) setError("Codex terminó sin devolver texto. Actualiza la conversación para revisar su estado.");
      else {
        setMessage("");
        for (const item of attachments) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        replaceAttachments([]);
      }
      await loadThreads(selectedId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Se interrumpió la conexión con Codex.";
      await loadThreads(selectedId);
      setError(message);
    } finally { setSending(false); }
  }

  const selectedThread = threads.find((thread) => thread.id === selectedId);

  return (
    <div className="p-4 md:p-8 max-w-[1536px]">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>Herramientas internas · PoxelBit</p>
          <h1 className="font-outfit font-bold text-3xl flex items-center gap-2" style={{ color: "var(--fg)" }}><Bot className="h-7 w-7 text-indigo-400" /> Max · Agente de desarrollo</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>Analiza el proyecto y trabaja cambios desde el panel. Max carga su contexto y memoria en cada conversación.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-muted)" }}>
          <GitBranch className="h-4 w-4 text-indigo-400" /> Rama <strong style={{ color: "var(--fg)" }}>{config.branch || "desconocida"}</strong>
        </div>
      </header>

      {config.dangerousMode && config.enabled && (
        <div className="mb-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p><strong>Modo de pruebas con acceso completo.</strong> Codex ejecuta comandos sin sandbox ni confirmaciones. Usa esta instancia solo con personal autorizado y en un equipo de pruebas de confianza.</p>
        </div>
      )}

      {!config.enabled ? (
        <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--fg)" }}>Agente local desactivado</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>{config.reason || "Activa el agente en la configuración local de pruebas."}</p>
        </div>
      ) : (
        <>
        <section className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Archivos con cambios</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Resumen del checkout de pruebas · se omiten archivos de entorno y respaldos</p></div>
            <button onClick={() => void loadWorkspace()} disabled={workspaceLoading} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>{workspaceLoading ? "Revisando…" : "Actualizar"}</button>
          </div>
          {workspaceFiles.length === 0 ? <p className="text-xs" style={{ color: "var(--fg-muted)" }}>No hay cambios locales visibles.</p> : (
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">{workspaceFiles.map((file) => <span key={`${file.status}-${file.path}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px]" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}><strong className="text-indigo-400">{file.status}</strong><span className="truncate">{file.path}</span></span>)}</div>
          )}
        </section>
        <div className="grid min-h-[650px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border p-3" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Conversaciones</h2>
              <button onClick={createThread} disabled={creating || loading} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" /> Nueva
              </button>
            </div>
            {loading ? <p className="p-3 text-sm" style={{ color: "var(--fg-muted)" }}>Cargando…</p> : threads.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>Todavía no hay conversaciones.</div>
            ) : <div className="space-y-1">
              {threads.map((thread) => (
                <button key={thread.id} onClick={() => { setSelectedId(thread.id); void loadThread(thread.id).catch((err) => setError(err.message)); }} className="w-full rounded-xl px-3 py-2.5 text-left transition-colors" style={{ backgroundColor: selectedId === thread.id ? "var(--surface-2)" : "transparent", color: "var(--fg)" }}>
                  <span className="block truncate text-sm font-medium">{thread.title}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[10px]" style={{ color: "var(--fg-muted)" }}><span className="truncate">{thread.createdByName}</span><span>{new Date(thread.updatedAt).toLocaleDateString("es-MX")}</span></span>
                </button>
              ))}
            </div>}
            <button onClick={() => void loadThreads(selectedId)} disabled={loading} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs hover:bg-[var(--surface-2)] disabled:opacity-50" style={{ color: "var(--fg-muted)" }}><RefreshCw className="h-3.5 w-3.5" /> Actualizar</button>
          </aside>

          <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="min-w-0"><h2 className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>{selectedThread?.title || "Nueva conversación"}</h2><p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{selectedThread?.status === "in_progress" || sending ? "Max está trabajando…" : "Max está listo para analizar y proponer cambios"}</p></div>
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
            </div>
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {!selectedId ? <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center"><Bot className="mb-3 h-10 w-10 text-indigo-400/70" /><p className="text-sm" style={{ color: "var(--fg-muted)" }}>Crea una conversación y pide un análisis o un cambio para el proyecto.</p></div> : events.length === 0 ? <p className="py-8 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Esta conversación está lista.</p> : events.map((item) => (
                <div key={item.id} className={`flex gap-2.5 ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.role === "user" ? "bg-slate-500/15 text-slate-400" : item.role === "error" ? "bg-red-500/15 text-red-400" : "bg-indigo-500/15 text-indigo-400"}`}>{item.role === "user" ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}</div>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${item.role === "user" ? "bg-indigo-600 text-white" : item.role === "error" ? "border border-red-500/20 bg-red-500/5 text-red-400" : "border"}`} style={item.role === "assistant" ? { backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" } : undefined}>
                    {item.role === "user" && item.actorName && <p className="mb-1 text-[10px] font-semibold text-indigo-100/70">{item.actorName}</p>}
                    <div className="whitespace-pre-wrap break-words">{item.content || (sending && item.id.startsWith("assistant-") ? "Codex está preparando la respuesta…" : "")}</div>
                  </div>
                </div>
              ))}
            </div>
            {error && <div className="mx-4 mb-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">{error}</div>}
            <form onSubmit={sendMessage} className="border-t p-3" style={{ borderColor: "var(--border)" }}>
              <label className="sr-only" htmlFor="poxelbit-dev-agent-input">Solicitud para Codex</label>
              <div className="flex items-end gap-2 rounded-xl border p-2" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                <textarea id="poxelbit-dev-agent-input" value={message} onChange={(event) => setMessage(event.target.value)} onPaste={onPaste} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={5000} rows={3} disabled={!selectedId || sending} placeholder="Escribe o pega una captura; también puedes adjuntar archivos…" className="min-h-[72px] flex-1 resize-y bg-transparent px-2 py-1 text-sm outline-none disabled:opacity-50" style={{ color: "var(--fg)" }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!selectedId || sending || attachments.length >= MAX_ATTACHMENTS} aria-label="Adjuntar archivos" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}><Paperclip className="h-4 w-4" /></button>
                <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.docx,.txt,.md,.csv,.json" onChange={onFileSelection} className="hidden" />
                <button type="submit" disabled={!selectedId || (!message.trim() && attachments.length === 0) || sending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4" /><span className="hidden sm:inline">{sending ? "Enviando" : "Enviar"}</span></button>
              </div>
              {attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((item) => <div key={item.id} className="flex max-w-full items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
                  {item.previewUrl ? <NextImage src={item.previewUrl} alt={`Vista previa de ${item.file.name}`} width={36} height={36} unoptimized className="h-9 w-9 rounded object-cover" /> : <ImageIcon className="h-4 w-4 shrink-0" style={{ color: "var(--fg-muted)" }} />}
                  <span className="max-w-48 truncate text-xs" style={{ color: "var(--fg)" }}>{item.file.name}</span>
                  <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" onClick={() => removeAttachment(item.id)} disabled={sending} aria-label={`Quitar ${item.file.name}`} className="rounded p-1 hover:bg-[var(--surface)] disabled:opacity-50"><X className="h-3.5 w-3.5" style={{ color: "var(--fg-muted)" }} /></button>
                </div>)}
              </div>}
              <p className="mt-1.5 px-1 text-[10px]" style={{ color: "var(--fg-muted)" }}>Enter envía · Shift+Enter agrega una línea · Ctrl+V pega capturas. Hasta 5 archivos, 8 MB cada uno y 16 MB en total.</p>
            </form>
          </section>
        </div>
        </>
      )}
    </div>
  );
}
