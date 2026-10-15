/**
 * Quién vende, escrito una sola vez.
 *
 * Lo leen las condiciones de venta (/terms) y la franja legal del pie. Si la
 * situación fiscal cambia —por ejemplo, al abrir una Partita IVA— se cambia
 * acá y las dos cosas se mueven juntas: con P.IVA hay que mostrar el número en
 * el pie y los precios pasan a incluir IVA, así que `taxNote` deja de ser
 * cierta.
 *
 * Decisión del usuario (2026-10-15): vende como persona física, de forma
 * ocasional, sin Partita IVA. Por eso no se cobra IVA.
 */
export const SELLER = {
  name: "Pato Turri",
  status: "a private individual selling occasionally, not a registered business",
  taxNote: "No VAT is charged on the prints or on shipping.",
  email: "info@patoturri.com",
  /** La línea corta del pie, después de "© 2026 Pato Turri ·". */
  footerLine: "Private seller · No VAT charged",
} as const;
