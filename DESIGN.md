---
name: Pato Turri
description: A single-author print shop built as a dark room and a paper counter.
colors:
  ink: "#25231f"
  ink-soft: "#46423c"
  paper: "#f4f1eb"
  cream-100: "#eeebe4"
  cream-200: "#e1d5c7"
  cream-300: "#d8c8b5"
  cream-hover: "#e9dfd3"
  line: "#d9d3c9"
  line-soft: "#c8b9a8"
  line-faint: "#e6e0d7"
  text-muted: "#6f675d"
  text-faint: "#6b6156"
  footer-muted: "#a09b90"
  footer-line: "#6b665d"
  footer-link: "#c9c3b8"
  accent: "#d8895b"
  accent-text: "#a85527"
  success: "#46704d"
  error: "#a34d35"
typography:
  display:
    fontFamily: "Familjen Grotesk, sans-serif"
    fontSize: "clamp(56px, 10.5vw, 172px)"
    fontWeight: 500
    lineHeight: 0.86
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Familjen Grotesk, sans-serif"
    fontSize: "clamp(58px, 8.2vw, 125px)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.032em"
  title:
    fontFamily: "Familjen Grotesk, sans-serif"
    fontSize: "clamp(20px, 1.9vw, 27px)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.022em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "9.5px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.12em"
  figure:
    fontFamily: "DM Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
  wordmark:
    fontFamily: "Playfair Display, serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 0.76
    letterSpacing: "normal"
rounded:
  none: "0rem"
  pill: "50%"
spacing:
  hairline: "1px"
  seam: "2px"
  gutter: "5vw"
  gutter-narrow: "7vw"
  touch: "44px"
  mast: "88px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "54px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.accent-text}"
    textColor: "{colors.paper}"
  button-primary-disabled:
    backgroundColor: "{colors.text-muted}"
    textColor: "{colors.paper}"
  button-inline:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "16px 18px 16px 20px"
  button-inline-hover:
    backgroundColor: "{colors.accent}"
  button-on-ink:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "46px"
  stepper-button:
    backgroundColor: "transparent"
    textColor: "{colors.cream-200}"
    rounded: "{rounded.none}"
    height: "30px"
    width: "32px"
  stepper-button-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  stepper-button-disabled:
    textColor: "{colors.footer-line}"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 13px"
    height: "46px"
  input-field-focus:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  ledger-row:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "clamp(22px, 2.4vw, 30px) 0"
  size-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "15px 14px"
  size-row-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  size-row-hover:
    backgroundColor: "{colors.cream-hover}"
    textColor: "{colors.ink}"
  counter-panel:
    backgroundColor: "{colors.cream-100}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(56px, 6vw, 92px) clamp(28px, 2.8vw, 46px) clamp(40px, 4vw, 62px)"
  thumb-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "10px 5vw"
  nav-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.none}"
    padding: "0 5vw"
    height: "88px"
---

# Design System: Pato Turri

## Overview

**Creative North Star: "The Dark Room and the Counter"**

Two materials do all the work. Photographs hang on ink — a near-black warm brown that behaves like gallery wall paint, edge to edge, with nothing floating on it. Beside them, in cream or paper, is the counter: where the facts live, where sizes are chosen, where money is named. Every substantial surface in the site is one of these two things, and the join between them is a change of material, not a border, a card, or a shadow. The photograph is the product; the interface is the room it hangs in.

The density is editorial, not e-commerce. Information is set in rows separated by one-pixel rules rather than in boxes: the shop's size selector, the cart's ledger of chosen prints, the shipping tariffs, the work's technical facts all use the same hairline grammar at different scales. Where a card would be the default answer, this system uses a full-bleed plate or a ruled row instead. Radius is zero everywhere a box exists; the only circles in the system are two 17–19px nav dots that are read as marks, not as containers.

Type is a three-voice arrangement with one inherited signature. Familjen Grotesk sets every title, tight and large, using its drawn italic as the site's only rhetorical flourish. DM Sans carries prose at comfortable measure. DM Mono carries every label, size, quantity and price, always tabular, because the store shows figures in grids and proportional digits dance. The "Turri" of the wordmark stays in Playfair Display italic in its own variable; it is the last survivor of the previous title face and it does not change.

**Key Characteristics:**
- Two materials only: ink wall, cream/paper counter.
- Zero radius on every box; hairline rules instead of containers.
- Photographs full-bleed or in their true proportion — never cropped to a decorative square.
- Mono for every number, always tabular.
- One brand terracotta, used sparingly and never as small text on a light ground.
- One easing curve and three durations for everything that moves.

## Colors

A warm, low-chroma range pulled off photographic paper: one near-black, a ladder of creams, and a single terracotta that earns its rarity.

### Primary
- **Brand Terracotta** (`{colors.accent}`): the one saturated voice. It lives on ink — hover states on the dark wall, the italic in a title over ink, the mono metadata line, the footer wordmark — where it measures 5.71:1. It is a signal, not a fill.
- **Terracotta Ink** (`{colors.accent-text}`): the same voice darkened for light grounds. Every accent-colored word on paper or cream uses this, plus the focus ring, caret and `accent-color` of the whole document.

### Neutral
- **Gallery Ink** (`{colors.ink}`): the wall. Full-bleed backgrounds for the hero veil, shop room, work plate field, cart wall, story page, contact page and footer. Also the fill of every primary button.
- **Soft Ink** (`{colors.ink-soft}`): secondary text and drawer actions on paper.
- **Paper** (`{colors.paper}`): the document ground and the text color on ink.
- **Cream 100** (`{colors.cream-100}`): the counter panel — the work page's buy column and the cart's summary column.
- **Cream 200 / Cream 300** (`{colors.cream-200}`, `{colors.cream-300}`): long-form body text on ink (pure paper vibrates over a long dark paragraph) and secondary metadata on ink respectively.
- **Cream Hover** (`{colors.cream-hover}`): the hover wash on a selectable row over cream.
- **Rule / Soft Rule / Faint Rule** (`{colors.line}`, `{colors.line-soft}`, `{colors.line-faint}`): the hairline family on light grounds, from structural to barely-there.
- **Footer Rule / Footer Muted / Footer Link** (`{colors.footer-line}`, `{colors.footer-muted}`, `{colors.footer-link}`): the same three jobs on ink. Every hairline drawn on the dark wall is `footer-line`.
- **Muted Text / Faint Text** (`{colors.text-muted}`, `{colors.text-faint}`): labels and disabled text on light grounds.

### Named Rules
**The Two-Ground Accent Rule.** The terracotta has two forms and they are not interchangeable. `accent` on ink (5.71:1), `accent-text` on paper or cream (4.67:1). Putting `accent` on a light ground is a contrast failure (2.44:1), not a style choice.

**The Hairline Rule.** Separation is a one-pixel rule in the ground's own rule color — `line` family on light, `footer-line` on ink. Never a box, never a border on four sides, never a shadow standing in for a divider.

**The Numbers Are Mono Rule.** Every price, quantity, dimension and count is DM Mono with `tabular-nums`. Figures in a grid must align in a column.

## Typography

**Display Font:** Familjen Grotesk (variable, with drawn italic)
**Body Font:** DM Sans
**Label/Mono Font:** DM Mono (400 only)
**Wordmark Font:** Playfair Display italic 500, reserved for "Turri"

**Character:** A modern grotesque set very tight and very large against a plain humanist text face, with a monospace that does all the bookkeeping. The pairing reads like a contemporary exhibition catalogue: confident titles, quiet prose, exact figures.

### Hierarchy
- **Display** (500, `{typography.display.fontSize}`, 0.86): hero titles over photography, max 15ch, balanced wrap.
- **Headline** (500, `{typography.headline.fontSize}`, 0.9): the `h1` of every interior page. The cart takes it down a step (`clamp(46px, 6vw, 86px)`) because a list, not a title, is the subject.
- **Section** (500, `clamp(39px, 5vw, 72px)`, 0.96): `h2` on editorial surfaces.
- **Title** (500, `{typography.title.fontSize}`, 1.08): work titles in a counter or a ledger row. Plate names in walls drop to `clamp(15px, 1.3vw, 23px)`.
- **Body** (400, `{typography.body.fontSize}`, 1.75–1.82): prose. Measure is capped by content, not by habit: 46ch for lead notes over ink, 50ch for long author prose, 68ch for the work's note on paper.
- **Label** (400, 9–11px, `{typography.label.letterSpacing}`, uppercase): every mono rubric — trail, legend, spec, tariff name, remove.
- **Figure** (400, 10.5–14px, tabular): prices, quantities, dimensions, counts.

### Named Rules
**The Drawn Italic Rule.** Italic is a requirement of the type stack, not decoration: three headlines use it as their accent. Any future title face must ship a drawn italic; synthetic oblique is not acceptable.

**The Mono Slot Carries Data Rule.** The small uppercase mono line above a title is a metadata slot, not a kicker. It may hold a count, a place, a trail, a dimension. If it would only restate the heading, it is not drawn at all — the cart suppresses its own count line below two prints for exactly this reason.

## Layout

Pages are built from full-bleed bands, not from a centered container. Horizontal inset is `{spacing.gutter}` (5vw) at wide widths and `{spacing.gutter-narrow}` (7vw) below 700px; photography ignores both and runs to the edge. The masthead is a fixed `{spacing.mast}` (88px) band that goes transparent over a hero and ink over a dark room.

The signature spatial move is the two-material split: a grid of `minmax(0, 1fr)` wall against a `clamp(340px, 30vw, 452px)` counter, used by the work page (`.work-view` / `.work-counter`) and, at list scale, by the cart (`.cart-room` / `.cart-wall` / `.cart-counter`). The cart's counter pins its inner panel sticky at `clamp(24px, 3vw, 40px)` because a ledger can exceed the viewport while a single work cannot; the work page's counter is exactly one viewport and stays put.

Walls of photographs are flex rows with `{spacing.seam}` (2px) gaps — the seam is the only thing between two images — and share a single height while their widths are proportional to each image's own aspect ratio, so nothing is cropped to fit a grid.

Breakpoints are 1100px (wall thinning), 900px (the structural break: two columns collapse to one, touch targets grow, thumb bars appear) and 700px (gutters widen to 7vw, nav collapses to a drawer). At and below 900px every interactive control reaches `{spacing.touch}` (44px) by growing its hit area, never by enlarging its glyph.

Vertical rhythm is expressed almost entirely in `clamp()` pairs rather than a fixed step scale; the recurring shapes are `clamp(20px, 2.4vw, 34px)` for intra-block air and `clamp(56px, 6vw, 92px)` for band padding.

## Elevation & Depth

The system is flat by material. There is no elevation scale, no surface tint ladder, no shadow under any card, button, panel or row — depth comes from the ink/cream material change, from 1px rules, and from light falling on the photographs themselves. Selected state is a filled ground swap (row goes ink), not a lift.

Two exceptions are real and belong to the system rather than contradicting it: the off-canvas nav drawer casts a single soft edge shadow so the panel reads as being in front of the page, and the lightbox lays a `rgba(23,18,14,.93)` scrim over everything. Both are overlays leaving the plane; nothing resting on the page is ever raised.

### Shadow Vocabulary
- **Drawer edge** (`box-shadow: -26px 0 64px -32px rgba(37, 35, 31, .5)`): the only shadow in the system. Used exclusively under the leading edge of the off-canvas navigation panel.

### Named Rules
**The Flat Plane Rule.** Anything that stays in the page is flat. A shadow is permitted only on an element that has left the plane — the drawer and the lightbox. A shadow is never used to fake a card, a border, or a hierarchy.

## Shapes

Radius is zero (`{rounded.none}`) and the Tailwind bridge multiplies zero, so every `rounded-*` utility also resolves flat. Buttons, inputs, panels, plates, bars and rows are all true rectangles. The one deliberate curve is the full circle (`{rounded.pill}`) on two 17–19px nav marks — the account glyph ring and the bag count badge — where the shape is a mark, not a container.

Borders are single-sided and hairline. Rows carry `border-top` and the last of a run carries `border-bottom`, producing a ruled ledger; panels carry no border at all because their ground already declares them. Focus is a 2px outline in the ground's contrasting ink (`accent-text` globally, `paper` on the dark wall, `ink` on cream) at 3px offset, or negative offset when the control sits on an image.

Photographic form has two modes and they are chosen by meaning: `object-fit: cover` when the image is architecture (heroes, walls, plates), `object-fit: contain` when the image is the merchandise (the work's frame, the cart line's thumbnail plate) so a print's true proportion survives even at 96px.

## Components

### Buttons
- **Shape:** true rectangle (0 radius), full-width in a counter, inline elsewhere.
- **Primary (counter):** ink ground, paper text, 54px min-height, 20px side padding, with the price set in mono inside the button at the right edge. Hover goes terracotta-ink; disabled goes muted or soft-rule ground with a `progress` or `not-allowed` cursor.
- **Primary (inline):** ink ground with a 34px gap between label and marker, hover to `accent`.
- **On-ink:** paper ground, ink text, 46px min-height — the form a button takes when it sits on the dark wall or in a thumb bar.
- **Focus:** 2px outline, 3px offset, in whichever of ink/paper contrasts with the ground.

### Inputs / Fields
- **Style:** on paper, a 1px `line` box, 46px tall, 13px inset, DM Sans 15px, zero radius, with a mono uppercase label above. On ink, no box at all: a single bottom rule at 28% paper.
- **Focus:** the border recolors (terracotta-ink on paper; paper thickened to 2px on ink) with `box-shadow: none` and the default outline suppressed. No glow.
- **Error:** border goes `{colors.error}`, message in mono 10.5px.

### Cards / Containers
There are no cards. The container vocabulary is the counter panel — cream ground, no border, no shadow, `clamp(56px, 6vw, 92px)` top padding — and the ruled row. Anything that would be a card is either a full-bleed plate or a hairline-separated row.

### Navigation
- **Style:** an 88px band, wordmark left, mono-scaled 12px links, account and bag actions right. Over a hero it is transparent and paper-colored; over a dark room it is ink; otherwise paper with muted links. Hover is terracotta-ink on light, paper on dark.
- **Mobile (≤700px):** a right-hand drawer of paper `min(84%, 340px)` wide, where links become 21px Familjen Grotesk rows on faint rules with real touch heights. Link color is declared by width, not by page, so any future dark page inherits a legible drawer.

### Ruled Selection Row (`.buy-size`)
The counter's size picker. A three-column baseline grid on a `line` rule, mono name / mono note / mono price, hover washing to cream-hover, selected inverting the whole row to ink with paper text, unavailable struck through in faint text. The native radio is 1px and hidden; the focus ring is drawn on the row.

### Ledger Row (`.cart-line`)
The cart's contribution: the list-scale sibling of the selection row, on ink. A `clamp(96px, 11vw, 132px)` contain-fitted plate, the work title as an underlined link in Familjen Grotesk, mono ISO dimensions, the stepper under the dimensions, and money right-aligned with `Remove` anchored to the bottom of that column. Below 900px it folds to two columns and the money row slides under the stepper.

### Stepper (`.cart-qty`)
The system's first quantity control, introduced by the cart. Two 32×30px hairline squares in `footer-line` around a 38px-min mono value; hover inverts a button to paper-on-ink; `−` disables at 1 rather than deleting, and the destructive `Remove` is deliberately placed in the opposite column. Below 900px the buttons become 44×44 while the glyph stays the same size.

### Thumb Bar (`.buy-bar`, `.cart-bar`)
A fixed ink strip at the bottom of narrow viewports, one hairline on top, safe-area padded, carrying the mono figure and an on-ink button. It is hidden above 900px and is revealed by observing the real in-page button, so it never duplicates a visible control. It slides and fades with `--dur-base` and `--ease`.

### Message Shell (`.cart-note`)
A single-column ink message used for the empty cart, both Stripe return screens and the app error boundary: headline capped at 14ch, cream-200 prose at 46ch, and a ruled text link. One shell, four states, no illustration.

### Named Rules
**The Price Rides the Button Rule.** The subtotal is set inside the commit button, not floating beside it. A figure repeated next to its own button is noise.

**The Touch Area Grows, The Drawing Doesn't Rule.** At ≤900px controls reach 44px by expanding their hit area; icon and glyph sizes stay exactly as drawn at desktop.

## Do's and Don'ts

### Do:
- **Do** build a surface from the two grounds: ink wall for the work, cream/paper counter for the facts.
- **Do** separate items with a 1px rule in the ground's own rule color (`line` on light, `footer-line` on ink).
- **Do** set every price, quantity, dimension and count in DM Mono with `tabular-nums`.
- **Do** use `accent` only over ink and `accent-text` only over paper or cream.
- **Do** keep radius at 0 for anything that contains content.
- **Do** give a photograph `object-fit: contain` whenever the image is the thing being bought, so its proportion survives.
- **Do** route every transition through `--ease` and one of `--dur-fast` / `--dur-base` / `--dur-slow`, inside a `prefers-reduced-motion: no-preference` guard.
- **Do** reserve height for content that arrives after hydration (`min-height: 1lh` on a mono slot, ghost rows at the real line height) so nothing shifts.
- **Do** grow touch targets to 44px at ≤900px without enlarging the glyph.

### Don't:
- **Don't** put a card around anything. No bordered, padded, floating box as a list item or a summary.
- **Don't** add a shadow to anything that stays in the page; only the off-canvas drawer and the lightbox leave the plane.
- **Don't** put `accent` terracotta on small text over paper or cream — it measures 2.44:1.
- **Don't** use `text-faint` for anything a reader must read; at 3.66:1 it is for struck-through and placeholder text only.
- **Don't** crop merchandise photography to a square thumbnail.
- **Don't** draw the small mono line unless it carries a fact; a slot that restates its own heading is a kicker and is not drawn.
- **Don't** state a total the system cannot yet know; name the tariffs and where they are calculated instead.
- **Don't** replace the title face with anything lacking a drawn italic, and don't move "Turri" off Playfair Display italic.
