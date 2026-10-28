import { redirect } from "next/navigation";

export default async function TallerNuevaRedirect({
  searchParams,
}: {
  searchParams: Promise<{ unidadId?: string; preventivo?: string }>;
}) {
  const q = await searchParams;
  const p = new URLSearchParams({ nueva: "1" });
  if (q.unidadId) p.set("unidadId", q.unidadId);
  if (q.preventivo) p.set("preventivo", q.preventivo);
  redirect(`/taller?${p.toString()}`);
}
