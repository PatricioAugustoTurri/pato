import Anthropic from "@anthropic-ai/sdk";
import type { AdminDia } from "@/lib/viaje/types";

/**
 * El inglés de cada día, escrito por Claude a partir del español del autor.
 *
 * Sale como borrador ("auto"): el sitio lo muestra, y el panel avisa que
 * falta revisarlo. Sin ANTHROPIC_API_KEY no se traduce nada y la página en
 * inglés muestra el día en español, que es mejor que una página vacía.
 *
 * Una traducción es una tarea corta y bien definida: esfuerzo bajo alcanza.
 * La salida es JSON con esquema, así el título, el texto y la descripción de
 * cada foto vuelven separados y no hay que adivinar dónde termina cada uno.
 */

export const traduccionDisponible = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `You translate a cyclist's travel diary from Spanish (Rioplatense) into English.
The author is a professional photographer riding a bicycle from Cape Nosappu, Japan, to Cabo da Roca, Portugal.
Keep his voice: first person, plain, warm, a little dry. Do not polish it into marketing copy, do not add anything, do not summarize.
Keep place names as the author wrote them unless there is a standard English name (Pekín → Beijing, Bujará → Bukhara).
Keep paragraph breaks exactly. Keep numbers and units as written.
Alt texts describe photos for people who cannot see them: translate them literally and keep them short.`;

const SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string", description: "The day's title in English." },
    texto: { type: "string", description: "The day's text in English, same paragraph breaks." },
    alts: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, alt: { type: "string" } },
        required: ["id", "alt"],
        additionalProperties: false,
      },
    },
  },
  required: ["titulo", "texto", "alts"],
  additionalProperties: false,
} as const;

/** Un error de la API en palabras del panel: el autor lo lee en la ruta, no un JSON. */
export function errorClaude(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return "la clave de Claude (ANTHROPIC_API_KEY) no es válida.";
  }
  if (error instanceof Anthropic.RateLimitError) return "Claude está saturado; probá de nuevo en un rato.";
  if (error instanceof Anthropic.APIConnectionError) return "no se pudo conectar con Claude.";
  if (error instanceof Anthropic.APIError) return "Claude no contestó bien; probá de nuevo.";
  return error instanceof Error ? error.message : "algo falló.";
}

export type Traduccion = { titulo: string; texto: string; alts: Record<string, string> };

let client: Anthropic | null = null;

export async function traducirDia(dia: Pick<AdminDia, "tituloEs" | "textoEs" | "medios">): Promise<Traduccion> {
  client ??= new Anthropic();
  const alts = dia.medios.filter((m) => m.altEs?.trim()).map((m) => ({ id: m.clientId, alt: m.altEs! }));
  const entrada = JSON.stringify({ titulo: dia.tituloEs, texto: dia.textoEs, alts }, null, 2);

  const response = await client.beta.messages.create(
    {
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Translate this diary entry:\n\n${entrada}` }],
    },
    { timeout: 90_000 },
  );

  if (response.stop_reason === "refusal") {
    throw new Error("Claude no quiso traducir este día.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("El día es demasiado largo para traducirlo de una vez.");
  }

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("La traducción volvió vacía.");
  const parsed = JSON.parse(text.text) as { titulo: string; texto: string; alts: { id: string; alt: string }[] };
  return {
    titulo: parsed.titulo,
    texto: parsed.texto,
    alts: Object.fromEntries(parsed.alts.filter((a) => alts.some((x) => x.id === a.id)).map((a) => [a.id, a.alt])),
  };
}

/* ——— Ordenar un dictado ——— */

const SYSTEM_DICTADO = `Recibís un texto dictado por voz por un ciclista que escribe su diario de viaje en castellano rioplatense.
Tu único trabajo es dejarlo prolijo para leer: puntuación, mayúsculas, tildes, y párrafos donde cambia el tema o el momento del día.
Sacá muletillas y repeticiones propias del habla ("eh", "este", "o sea" cuando no dicen nada, palabras dichas dos veces).
No agregues nada, no resumas, no cambies palabras por sinónimos, no corrijas su forma de hablar (voseo, lunfardo, expresiones suyas).
Si una palabra parece mal reconocida por el dictado y el contexto deja clara la correcta, corregila; si no, dejala.
Devolvé solo el texto final, con los párrafos separados por una línea en blanco.`;

export async function ordenarDictado(texto: string): Promise<string> {
  client ??= new Anthropic();
  const response = await client.beta.messages.create(
    {
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_DICTADO,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: texto }],
    },
    { timeout: 90_000 },
  );
  if (response.stop_reason === "refusal") throw new Error("Claude no quiso ordenar este texto.");
  if (response.stop_reason === "max_tokens") throw new Error("El texto es demasiado largo para ordenarlo de una vez.");
  const salida = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  if (!salida) throw new Error("El texto ordenado volvió vacío.");
  return salida;
}
