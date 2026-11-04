/**
 * El Sol de Mayo, el mismo que cruza el cielo de Rumbo Oeste (src/components/SolDeMayo.astro
 * en aquel repo): cara y 32 rayos que alternan rectos y flamígeros. Plano y sin contorno; el
 * disco y los rayos van en `currentColor` y los rasgos de la cara en una versión tostada del
 * mismo color (ver `.sol .face` en globals.css). Si cambia la forma allá, se copia acá.
 */
const FACE = 44;
const RAYS = 32;
const round = (n: number) => Math.round(n * 100) / 100;

// Rayo recto: un triángulo largo que nace debajo de la cara.
const straight = (deg: number) => {
	const a = (deg * Math.PI) / 180;
	const [c, s] = [Math.cos(a), Math.sin(a)];
	const base = 36, tip = 99, half = 3.7;
	const p = (r: number, w: number) => `${round(c * r - s * w)} ${round(s * r + c * w)}`;
	return `M${p(base, -half)}L${p(tip, 0)}L${p(base, half)}Z`;
};

// Rayo flamígero: una llama que ondula hacia afuera y se afina hasta la punta.
const wavy = (deg: number) => {
	const a = (deg * Math.PI) / 180;
	const [c, s] = [Math.cos(a), Math.sin(a)];
	const base = 36, tip = 91, steps = 30;
	const left: string[] = [];
	const right: string[] = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const r = base + (tip - base) * t;
		const sway = 3.1 * Math.sin(2 * Math.PI * 1.35 * (t - 0.12)) * Math.min(1, t * 2.2);
		const half = 3.6 * Math.pow(1 - t, 0.85);
		const pt = (w: number) => `${round(c * r - s * w)} ${round(s * r + c * w)}`;
		left.push(pt(sway - half));
		right.unshift(pt(sway + half));
	}
	return `M${left.join("L")}L${right.join("L")}Z`;
};

// La mitad derecha de la cara de la bandera, que se espeja. Geometría del Sol de Mayo de
// Wikimedia Commons (Sol_de_Mayo-Bandera_de_Argentina.svg), sobre un disco de radio 65.
const FACE_HALF = [
	"M41 -14C29.5 -24 15 -25.5 7 -18A140 50 10 0 0 8.5 8.5C8 8.5 7 9 6.5 9.5A80 50 10 0 1 4 -19C15 -28 30 -29 41 -14",
	"M23 -17C16.5 -17 15 -15.5 12 -13S7.5 -11 7 -10.5S7 -8.5 8 -9S11 -10.5 14 -13S20 -15.5 23 -15.5C32 -15.5 37 -8 38 -8.5S33 -17 23 -17",
	"M34.5 -8.5C28 -15.5 16 -16 11 -8H13C18 -16 30 -12.5 31 -9v1",
	"M11 -8C16 -3.5 27 -3 34.5 -8.5L31 -9C26 -3.5 18 -4 13 -8v-1",
	"M35 -6C26.5 .5 18 0 13 -3S8 -7 9 -7S11 -6 15 -4S25 -2 35 -6",
	"M10.5 9A3 3 0 1 1 6.5 12C6 13 4 16 0 16h-1l1 1.5C1 17.5 4 17.5 6 16A4.5 4.5 0 1 0 10.5 9",
	"M16.5 30C12 27 10 22.5 5 22.5C4 22.5 2 23 0 24h-1L0 25.5C2 25.5 5 23 8.5 25S14 29 16.5 30",
	"M15 30C5 27 3 29 0 29h-1l1 2C4 31 6 28 15 30",
	"M16.5 30C5.5 29 9 35.5 0 35.5h-1L0 37C11 37 6 31 16.5 30",
	"M9 46a9 9 0 0 0 -18 0a9.25 9.25 0 0 1 18 0",
];

// El rayo de arriba es recto, como en la bandera. Se calcula una sola vez, al cargar el módulo.
const RAYS_PATH = Array.from({ length: RAYS }, (_, i) => {
	const deg = -90 + (360 / RAYS) * i;
	return i % 2 === 0 ? straight(deg) : wavy(deg);
}).join("");

export default function SolDeMayo({ className }: { className?: string }) {
	return (
		<svg
			className={className ? `sol ${className}` : "sol"}
			viewBox="-100 -100 200 200"
			aria-hidden="true"
			focusable="false"
		>
			<path d={RAYS_PATH} />
			<circle r={FACE} />
			<g className="face" transform={`scale(${FACE / 65})`}>
				{[1, -1].map((side) => (
					<g key={side} transform={`scale(${side} 1)`}>
						{FACE_HALF.map((d) => <path key={d} d={d} />)}
						<circle cx="22" cy="-9" r="4.5" />
					</g>
				))}
			</g>
		</svg>
	);
}
