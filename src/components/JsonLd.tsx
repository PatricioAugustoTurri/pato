/**
 * Un bloque de datos estructurados.
 *
 * Escapar `<` a su equivalente unicode no es decorativo: los nombres y las
 * descripciones de las obras salen de la base, y sin eso un `<` cargado desde
 * el panel de admin cerraría el `<script>` antes de tiempo y dejaría inyectar
 * HTML en la página.
 * Se hace una sola vez acá para que ninguna página tenga que acordarse.
 *
 * Es un `<script>` nativo a propósito, no `next/script`: esto son datos, no
 * código que haya que ejecutar ni diferir.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
