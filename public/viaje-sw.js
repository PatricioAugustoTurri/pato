/*
 * El diario de viaje sin señal.
 *
 * Guarda la página del panel y los archivos de Next que la hacen andar, para
 * que el panel abra en un lugar sin conexión. Los datos no pasan por acá: los
 * días esperan en IndexedDB y el panel los sube solo cuando hay señal.
 *
 * La página se pide primero a la red (para no quedarse con una versión vieja)
 * y, si no contesta en unos segundos, sale la guardada. Los archivos de
 * /_next/static llevan un hash en el nombre, así que una copia guardada nunca
 * queda vieja: se sirven desde la caché.
 */
const CACHE = "rumbo-viaje-v2";
const PAGINA = "/admin/viaje";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rumbo-viaje-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const conTiempo = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

/* ——— Compartir desde la galería (Android) ———
   El manifiesto (viaje.webmanifest) declara /admin/viaje/compartir como destino del menú
   Compartir. Lo atiende este service worker y no el servidor: así anda sin señal y sin
   depender de la sesión. Guarda los archivos en IndexedDB y abre el panel, que los reparte
   en el día que corresponde. */
const DB = "rumbo-viaje";

function abrirDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("dias")) db.createObjectStore("dias", { keyPath: "clientId" });
      if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache");
      if (!db.objectStoreNames.contains("compartidos")) db.createObjectStore("compartidos", { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function recibirCompartidos(request) {
  try {
    const form = await request.formData();
    const archivos = form.getAll("archivos").filter((f) => f && typeof f !== "string");
    const db = await abrirDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("compartidos", "readwrite");
      const s = tx.objectStore("compartidos");
      for (const f of archivos) s.add(f);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("[viaje] no se pudo recibir lo compartido", error);
  }
  return Response.redirect("/admin/viaje#/compartido", 303);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method === "POST" && new URL(request.url).pathname === "/admin/viaje/compartir") {
    event.respondWith(recibirCompartidos(request));
    return;
  }
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname === PAGINA) {
    event.respondWith(
      conTiempo(fetch(request), 5000)
        .then((response) => {
          // Una redirección al login no se guarda: sería guardar la puerta y no la casa.
          if (response.ok && !response.redirected) {
            const copia = response.clone();
            caches.open(CACHE).then((cache) => cache.put(PAGINA, copia));
          }
          return response;
        })
        .catch(() => caches.match(PAGINA).then((r) => r || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/viaje.webmanifest" || url.pathname.startsWith("/viaje-")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copia = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copia));
            }
            return response;
          }),
      ),
    );
  }
});
