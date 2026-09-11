/* El esqueleto arma la misma pantalla: campo de tinta a la izquierda,
   mostrador de papel a la derecha. Lo unico que late es el mostrador; el campo
   queda en tinta lisa, porque un rectangulo palpitando del tamano de la obra
   seria mas ruidoso que el vacio que va a llenar. */
export default function PhotoDetailLoading() {
  return (
    <main className="work-page">
      <section className="work-view is-dark-room">
        <div className="plate-field" />

        <aside className="work-counter">
          <div className="skeleton-line animate-pulse" style={{ height: 10, width: 130 }} />
          <div
            className="skeleton-line animate-pulse"
            style={{ height: 34, marginTop: 30, width: "94%" }}
          />
          <div
            className="skeleton-line animate-pulse"
            style={{ height: 34, marginTop: 9, width: "70%" }}
          />

          <div style={{ marginTop: 46 }}>
            {[0, 1, 2].map((row) => (
              <div
                className="skeleton-line animate-pulse"
                key={row}
                style={{ height: 22, marginBottom: 28, width: "100%" }}
              />
            ))}
          </div>

          <div className="skeleton-line animate-pulse" style={{ height: 54, marginTop: 14 }} />
        </aside>
      </section>
    </main>
  );
}
