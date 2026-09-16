/* El texto de "Mi Historia", escrito por Pato, en las dos lenguas.
   El español es el original y no se toca: es su voz. El inglés es una
   traducción hecha para que un comprador de la UE pueda leerla, y conserva
   registro y ritmo antes que literalidad.

   Los títulos son EXACTAMENTE los cinco que él escribió. Las fotografías no
   abren capítulos nuevos: entran entre sus párrafos, junto al pasaje que
   narran. La apertura no lleva ninguna — cuando el relato empieza, Pato
   todavía no era fotógrafo, y las imágenes entran a la página cuando entran
   a la historia. */

export type Lang = "es" | "en";

export type Block =
  | { kind: "p"; text: Record<Lang, string> }
  /* Slugs reales de `photos`. Cada una enlaza a su ficha de venta. */
  | { kind: "photos"; slugs: string[] };

export type Chapter = {
  id: string;
  /* null solo en la apertura: su título es el de la página. */
  title: Record<Lang, string> | null;
  blocks: Block[];
};

export const PAGE_TITLE: Record<Lang, string> = {
  es: "Mi Historia",
  en: "My Story",
};

export const UI: Record<Lang, { readIn: string; other: string; archive: string; note: string; heroAlt: string }> = {
  es: {
    readIn: "Leer en inglés",
    other: "English",
    archive: "Ver el archivo completo",
    note: "Obra del archivo",
    /* Describe lo que se ve, no lo que se supone: el lugar no esta confirmado
       y el alt no es sitio para adivinarlo. */
    heroAlt: "Pato Turri asomado a la puerta de una cabana de piedra con techo de paja, en un valle de montana",
  },
  en: {
    readIn: "Leer en español",
    other: "Español",
    archive: "See the full archive",
    note: "From the archive",
    heroAlt: "Pato Turri leaning out of the doorway of a stone hut with a thatched roof, in a mountain valley",
  },
};

/**
 * La ficha del hero. Las tres cifras son las que el propio relato declara en
 * "Lo que sigue": «Cinco años, cerca de veinte países, cuatro continentes».
 * El «≈» de países no es pudor: el texto dice "cerca de", y la ficha no va a
 * ser mas precisa que la fuente.
 */
export const STORY_INDEX: { label: Record<Lang, string>; value: string }[] = [
  { label: { es: "Años en ruta", en: "Years on the road" }, value: "5" },
  { label: { es: "Continentes", en: "Continents" }, value: "4" },
  { label: { es: "Países", en: "Countries" }, value: "≈20" },
];

const p = (es: string, en: string): Block => ({ kind: "p", text: { es, en } });

export const CHAPTERS: Chapter[] = [
  {
    id: "salida",
    title: null,
    blocks: [
      p(
        "Antes de todo esto, mi vida tenía la forma de un taller mecánico y el ruido de un camión de reparto. Trabajé arreglando autos, después llevando agua y soda de puerta en puerta por las calles de mi ciudad, en Argentina. Era un trabajo honesto, previsible, con horarios fijos y rutinas que se repetían semana tras semana. Y sin embargo, algo en mí no dejaba de hacer la misma pregunta: ¿qué hay más allá? No una insatisfacción concreta, no un drama, sino una curiosidad que crecía más rápido que las excusas para quedarme. Un día dejé de posponerla. Junté lo poco que tenía, armé una mochila y salí a buscar una respuesta que sabía que no iba a caber en una sola palabra.",
        "Before any of this, my life had the shape of a mechanic's workshop and the sound of a delivery truck. I fixed cars, then carried water and soda door to door through the streets of my city, in Argentina. It was honest work, predictable, with fixed hours and routines that repeated week after week. And still, something in me kept asking the same question: what is out there? Not a specific dissatisfaction, no drama — just a curiosity growing faster than my excuses for staying. One day I stopped putting it off. I gathered what little I had, packed a bag, and left to look for an answer I knew would not fit in a single word.",
      ),
      p(
        "No tenía un plan de cinco años. Tenía, como mucho, ganas de cruzar una frontera y ver qué pasaba del otro lado. Lo que no sabía era que esa curiosidad me iba a llevar, durante un lustro entero, por Latinoamérica, África, Asia y Europa, y que en el camino iba a aprender la lección más simple y a la vez más difícil de todo el viaje: los paisajes son espectaculares, pero el ojo se acostumbra. Una montaña impresionante dura de impresionarte un rato; una persona que te abre la puerta de su casa, te cocina lo que come su familia y te cuenta cómo entiende el mundo, eso no se acostumbra nunca. Así que decidí, casi sin darme cuenta al principio y después ya muy a propósito, que mi viaje iba a ser sobre gente. Sobre casas, comidas, bebidas tradicionales, tradiciones que se pasan de generación en generación. Los lugares fueron el escenario. Las personas fueron la historia.",
        "I did not have a five-year plan. At most I had the urge to cross one border and see what happened on the other side. What I did not know was that the curiosity would carry me for five full years through Latin America, Africa, Asia and Europe, and that along the way I would learn the simplest and hardest lesson of the whole trip: landscapes are spectacular, but the eye gets used to them. An astonishing mountain only astonishes you for a while; a person who opens their front door, cooks you what their family eats and tells you how they understand the world — you never get used to that. So I decided, almost without noticing at first and very deliberately afterwards, that my trip would be about people. About houses, food, traditional drinks, customs passed down through generations. The places were the setting. The people were the story.",
      ),
    ],
  },
  {
    id: "latinoamerica",
    title: { es: "El camino por Latinoamérica", en: "The Latin American Road" },
    blocks: [
      p(
        "Empecé cerca de casa, aunque «cerca» es una palabra relativa cuando se cruzan fronteras enteras a dedo, en micro, en lo que apareciera. México, Guatemala, Costa Rica, Panamá, Colombia, Ecuador, Perú, Bolivia, Chile, Brasil, Uruguay: fui armando un mapa que en realidad era una colección de cocinas, de idiomas que cambiaban de acento cada pocos cientos de kilómetros, de gente que me invitaba a sentarme a su mesa antes de preguntarme siquiera de dónde venía.",
        "I started close to home, though “close” is a relative word when you are crossing whole borders hitchhiking, by bus, by whatever turned up. Mexico, Guatemala, Costa Rica, Panama, Colombia, Ecuador, Peru, Bolivia, Chile, Brazil, Uruguay: I was building a map that was really a collection of kitchens, of languages that changed accent every few hundred kilometres, of people who invited me to their table before they even asked where I came from.",
      ),
      { kind: "photos", slugs: ["pura-vida", "cholitas-in-color", "coconut"] },
      p(
        "Aprendí rápido que viajar así, durante años y no semanas, tiene una lógica propia. La plata no alcanza para hoteles ni para restaurantes todos los días, y en el fondo tampoco quería esa clase de viaje. Empecé a hacer voluntariados: a cambio de un lugar donde dormir y algo para comer —que, al final, es en lo que más se te va la plata cuando viajás— trabajaba. Ayudaba en hostales, en huertas, en lo que hiciera falta. Y esa manera de moverme terminó siendo la puerta de entrada a todo lo demás, porque cuando trabajás al lado de alguien, cuando compartís la comida del mediodía y no solo un apretón de manos, la relación cambia. Dejás de ser un turista. Empezás a ser, por un rato, parte de la rutina de otro.",
        "I learned fast that travelling like this — for years, not weeks — has a logic of its own. The money does not stretch to hotels or restaurants every day, and deep down I did not want that kind of trip anyway. I started volunteering: in exchange for somewhere to sleep and something to eat, which is where most of your money goes when you travel, I worked. I helped in hostels, in vegetable gardens, wherever I was needed. And moving that way turned out to be the way into everything else, because when you work beside someone, when you share the midday meal and not just a handshake, the relationship changes. You stop being a tourist. You start being, for a while, part of somebody else's routine.",
      ),
      p(
        "Fue en ese ir y venir por el continente que llegué a Paraguay y conocí, casi de casualidad, a un médico que dedicaba su tiempo a ayudar a comunidades guaraníes a recuperar tierras que compradores extranjeros les habían arrebatado. Ese hombre me abrió una puerta que normalmente no se abre: pasé varios días conviviendo con una comunidad guaraní, durmiendo donde ellos dormían, comiendo lo que ellos comían. Y tuve la suerte —porque no hay otra palabra— de estar ahí durante una de las ceremonias más importantes de su cultura: el bautismo de los varones de la comunidad. No voy a pretender que entendí cada detalle de lo que estaba viendo, pero sí entendí lo esencial: estaba frente a una forma de sostener la identidad, la pertenencia y la memoria que llevaba generaciones resistiendo, a pesar de todo lo que les habían quitado. Salí de esos días con la certeza de que ese era exactamente el tipo de historia que había salido a buscar, aunque todavía no supiera nombrarla así.",
        "It was in that back and forth across the continent that I reached Paraguay and met, almost by chance, a doctor who spent his time helping Guaraní communities recover land that foreign buyers had taken from them. That man opened a door that normally stays shut: I spent several days living with a Guaraní community, sleeping where they slept, eating what they ate. And I had the luck — because there is no other word for it — to be there during one of the most important ceremonies in their culture: the baptism of the community's boys. I will not pretend I understood every detail of what I was seeing, but I did understand the essential part: I was in front of a way of holding on to identity, belonging and memory that had been resisting for generations, despite everything that had been taken from them. I came out of those days certain that this was exactly the kind of story I had left to find, even if I could not name it that way yet.",
      ),
      { kind: "photos", slugs: ["guarani", "face-of-the-guarani"] },
    ],
  },
  {
    id: "africa-asia",
    title: { es: "Cruzando el mundo: África y Asia", en: "Crossing the World: Africa and Asia" },
    blocks: [
      p(
        "Después de Latinoamérica, el mapa se abrió mucho más. Crucé a Marruecos, mi primer contacto con África, con sus mercados, sus casas de patio interior y una hospitalidad que se sirve, literalmente, en forma de té. Y de ahí, Asia: China, Japón, Tailandia, Vietnam, Malasia, Turquía. Cada país fue una manera distinta de comer, de rezar, de descansar, de recibir a un desconocido.",
        "After Latin America the map opened much wider. I crossed into Morocco, my first contact with Africa, with its markets, its courtyard houses and a hospitality that is served, literally, in the form of tea. And from there, Asia: China, Japan, Thailand, Vietnam, Malaysia, Turkey. Each country was a different way of eating, of praying, of resting, of receiving a stranger.",
      ),
      { kind: "photos", slugs: ["hands-in-clay", "market-vendor"] },
      p(
        "Si tengo que elegir un recuerdo de toda esa etapa, elijo una carretera del norte de Vietnam. Estaba recorriendo esa zona en moto, sin demasiado plan más que seguir el camino y ver adónde llevaba, cuando llegamos a una familia que tenía un homestay. Nos quedamos, y en cuestión de horas la buena onda con ellos fue tan real que terminaron invitándonos a una fiesta tradicional dentro de su comunidad hmong. No fue una experiencia armada para turistas: fue una familia abriendo su círculo más íntimo a un par de desconocidos en moto, sin más motivo que las ganas de compartir. Me acuerdo de esa noche —la comida, la música, la manera en que se reían entre ellos— como uno de esos momentos que justifican, por sí solos, todos los kilómetros que hacen falta para llegar hasta ahí.",
        "If I have to pick one memory from that whole stretch, I pick a road in northern Vietnam. I was riding through the area on a motorbike, with no plan beyond following the road and seeing where it went, when we came to a family running a homestay. We stayed, and within hours the warmth between us was so real that they ended up inviting us to a traditional celebration inside their Hmong community. It was not an experience staged for tourists: it was a family opening their most private circle to a couple of strangers on a motorbike, for no reason other than wanting to share. I remember that night — the food, the music, the way they laughed with each other — as one of those moments that justify, all on their own, every kilometre it takes to get there.",
      ),
      { kind: "photos", slugs: ["shared-meal", "mother-and-child"] },
      p(
        "Entre carretera y carretera, entre voluntariado y voluntariado, fui armando una regla que terminó siendo la brújula de los cinco años enteros: si tenía que elegir entre ver un lugar famoso o pasar la tarde con una familia local, elegía a la familia. Los templos y las montañas siguen ahí, esperando. Una invitación a comer en una casa, en cambio, no se repite.",
        "Between one road and the next, between one volunteering stint and the next, I built a rule that became the compass for all five years: if I had to choose between seeing a famous place and spending the afternoon with a local family, I chose the family. The temples and the mountains are still there, waiting. An invitation to eat in someone's home does not come around twice.",
      ),
    ],
  },
  {
    id: "europa",
    /* Sin fotografías por una razón que ya caducó: cuando el capítulo se armó
       no había una sola obra europea en el archivo, y no se iba a rellenar con
       nada que no fuera de Pato. Hoy España e Italia sí tienen obra cargada, así
       que el hueco se puede llenar —falta que el autor elija qué dos anclan acá
       y sumar sus slugs a `ANCHORED_SLUGS`, como hacen los demás capítulos. */
    title: {
      es: "Europa y un cierre que en realidad es un comienzo",
      en: "Europe, and an Ending That Is Really a Beginning",
    },
    blocks: [
      p(
        "El viaje me llevó también por Europa: Italia, Serbia, Inglaterra, España, y de vuelta a Turquía, esta vez del lado de Estambul, esa ciudad que es, literalmente, la bisagra entre dos continentes, algo que se sentía casi simbólico después de tantos años cruzando fronteras.",
        "The trip took me through Europe too: Italy, Serbia, England, Spain, and back to Turkey, this time to the Istanbul side — that city which is, literally, the hinge between two continents, something that felt almost symbolic after so many years crossing borders.",
      ),
      p(
        "Fue en Italia donde el viaje, sin que yo lo planeara, encontró un lugar donde apoyarse. Conocí a una chica italiana, y lo que empezó como una parada más en la ruta se convirtió en algo que no quise seguir postergando como había hecho, años atrás, con las preguntas que me sacaron del taller mecánico. Hoy vivo con ella en Italia. No fue el final del viaje —de hecho, no siento que el viaje haya terminado nunca—, pero sí fue el momento en que entendí que a veces uno sale a buscar el mundo entero y termina encontrando, en algún punto del camino, un lugar concreto y una persona concreta que le dan sentido a todo lo demás.",
        "It was in Italy that the trip, without my planning it, found somewhere to rest. I met an Italian girl, and what began as one more stop on the route turned into something I did not want to keep putting off the way I had, years earlier, with the questions that got me out of the mechanic's workshop. Today I live with her in Italy. It was not the end of the trip — in fact I do not feel the trip has ever ended — but it was the moment I understood that sometimes you set out to find the whole world and end up finding, somewhere along the way, one specific place and one specific person that give meaning to all the rest.",
      ),
    ],
  },
  {
    id: "lo-que-sigue",
    title: { es: "Lo que sigue", en: "What Comes Next" },
    blocks: [
      p(
        "Cinco años, cerca de veinte países, cuatro continentes, y una certeza que se hizo más fuerte con cada frontera: los seres humanos nos parecemos mucho más de lo que las noticias y las distancias nos hacen creer, y al mismo tiempo, lo que nos hace distintos —la lengua, la comida, las ceremonias, la forma de recibir a un extraño— es exactamente lo que vale la pena ir a buscar.",
        "Five years, close to twenty countries, four continents, and one certainty that grew stronger with every border: human beings resemble each other far more than the news and the distances lead us to believe, and at the same time, what makes us different — the language, the food, the ceremonies, the way of receiving a stranger — is exactly what is worth going to find.",
      ),
      p(
        "El viaje no terminó. Sigo teniendo las mismas ganas de conocer, de sacar fotos, de grabar historias que de otro modo se perderían. Este sitio es, en el fondo, una manera de seguir compartiendo esas mesas a las que me invitaron, esas casas que me abrieron, esas ceremonias que tuve la suerte de presenciar. Cada foto que vas a encontrar acá tiene, detrás, a alguien que decidió confiar en un desconocido con una mochila. Esta es mi manera de devolverles algo de eso: contar sus historias, para que no se queden solo en mi memoria.",
        "The trip is not over. I still have the same urge to see, to take photographs, to record stories that would otherwise be lost. This site is, underneath it all, a way of continuing to share those tables I was invited to, those houses that were opened to me, those ceremonies I was lucky enough to witness. Every photograph you will find here has, behind it, someone who decided to trust a stranger with a backpack. This is my way of giving some of that back: telling their stories, so they do not stay only in my memory.",
      ),
    ],
  },
];

/* Todos los slugs que la historia ancla, para que la página pida exactamente
   esas obras y ninguna más. */
export const ANCHORED_SLUGS = CHAPTERS.flatMap((chapter) =>
  chapter.blocks.flatMap((block) => (block.kind === "photos" ? block.slugs : [])),
);
