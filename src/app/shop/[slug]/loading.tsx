/* El esqueleto arma la misma sala, no una grilla distinta: hero a sangre,
   cartel de sala y un colgado de proporciones mezcladas. Las proporciones son
   las que de verdad hay en el catalogo (3:2, 2:3, 4:3), asi que cuando llegan
   los datos la pagina cambia de contenido pero no de forma.

   Sobre tinta el pulso de opacidad borraria las placas en el valle, asi que no
   laten: el unico signo de vida esta en el cartel, como en /shop. */
const WALLS: { ratios: number[]; solo?: boolean; lean: "left" | "right" }[] = [
  { ratios: [1.5, 0.667], lean: "left" },
  { ratios: [0.667, 1.5], lean: "right" },
  { ratios: [1.5], solo: true, lean: "left" },
  { ratios: [1.333, 0.667], lean: "right" },
];

export default function CategoryLoading() {
  return (
    <main className="category-page">
      <section className="hero-section" />

      <section className="category-room is-dark-room">
        <div className="room-entry">
          <div className="room-statement">
            <div className="shop-ghost animate-pulse" style={{ height: 34, width: "82%" }} />
            <div
              className="shop-ghost animate-pulse"
              style={{ height: 34, marginTop: 10, width: "56%" }}
            />
          </div>
        </div>

        <div className="room-hang">
          {WALLS.map((wall, wallIndex) => (
            <div
              className="hang-wall"
              key={wallIndex}
              data-solo={wall.solo ? "" : undefined}
              data-lean={wall.lean}
            >
              {wall.ratios.map((ratio, index) => (
                <div
                  className="hang-plate"
                  key={index}
                  style={
                    {
                      "--ratio": ratio,
                      "--span": wall.solo ? "70%" : undefined,
                      "--drop": !wall.solo && index === 1 ? "1" : "0",
                    } as React.CSSProperties
                  }
                >
                  <div className="hang-frame shop-ghost" />
                  <div className="hang-label">
                    <div
                      className="shop-ghost"
                      style={{ gridColumn: "1 / -1", height: 12, maxWidth: 240 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
