# Dino-Evo — Design-Konzept

Status: Entwurf · Zuletzt aktualisiert: 2026-05-03

## Pitch

Top-Down-Ökosystem-Spiel als drittes Spiel auf der Seite. Der Spieler führt eine Pflanzenfresser-Dinosaurier-Herde durch eine sich evolvierende Welt. Der Twist: **die Verhaltensentscheidungen des Spielers sind der Selektionsdruck** — die NPC-Spezies (Räuber, Konkurrenten, Pflanzen) passen sich über Generationen mit einem evolutionären Algorithmus gegen genau den Stil des Spielers an. Es gibt keine dominante Strategie, weil die Welt jede konsistente Strategie kontert.

## Kern-Loop

1. Spieler bewegt seine Herde durch die Karte (Pikmin-Stil-Waypoints).
2. Bei Encountern entscheidet der Spieler binär: **Fight** oder **Flee**.
3. Bei Events entscheidet der Spieler ggf. (siehe „Events" — 80 % Auto, 20 % Choice).
4. Periodisch (Modus-abhängig) endet eine Generation: NPC-Populationen reproduzieren mit Crossover + Mutation, Selektion basiert auf den Begegnungen mit dem Spieler. Die eigene Herde evolviert passiv: Überlebende vererben Gene weiter.
5. Run endet, wenn die Spieler-Herde ausstirbt.

## Spielmodi (Wahl beim Start, persistiert in `localStorage`)

| Modus | Tick-Quelle | Generationsdauer | Zielsessionlänge |
| --- | --- | --- | --- |
| **Echtzeit** | `requestAnimationFrame`, ~60 fps | 60–90 s real | ~10 min |
| **Rundenbasiert** | Spieler-Aktionen | N Aktionen pro Generation | offen, längere Sessions |

Beide Modi nutzen dieselbe `step(state, dt, action) → state` in `logic.js`. Unterschiedlich sind nur Input-Layer (`controls.js`) und HUD. Separate Leaderboards (`dinos_realtime`, `dinos_turn`).

## Steuerung & Encounter

- **Bewegung:** Maus/Touch setzt Waypoint, Herde wandert dorthin. Tastatur-Pfeile als Alternative.
- **Pace:** Walk / Run (Run = schneller, höherer Stamina-Verbrauch, lauter — lockt Räuber).
- **Encounter-Auflösung:** binäre Wahl Fight/Flee. Outcome wird aus Genom-Vergleich + Populations-Verhältnis berechnet. Verluste auf beiden Seiten sind Selektion.
- **Foraging / Rest:** Herde grast in Vegetation automatisch; Rest ist verwundbar, aber stellt Stamina wieder her.
- **Split / Regroup:** Herde kann temporär gesplittet werden (mehr Erkundung, kleinere Untergruppen sind anfälliger).

## Entscheidungen → Selektionsdruck

Der wichtigste Mechanismus. Jede konsistente Spielerentscheidung treibt eine Anpassung der NPC-Genome:

| Entscheidung | NPC-Anpassung |
| --- | --- |
| Flucht statt Kampf | Räuber: höhere Geschwindigkeit, Ausdauer |
| Kampf statt Flucht | Räuber: dickere Panzerung, größere Rudel |
| In einem Biom bleiben | Lokale Räuber spezialisieren sich gezielt gegen den Spieler |
| Viel erkunden | Räuber-Genpool wird breiter, Generalisten dominieren |
| Pflanze überweiden | Pflanze: Toxine / wird seltener; Konkurrenz-Pflanzenfresser drängt in die Nische |
| Gruppe splitten | Räuber: schnelle Kleinrudel-Hunter |
| Geschlossen bleiben | Räuber: größere Einzeljäger |

Selektion = Überleben gegen den Spieler. Mutation auf alle Genom-Floats mit konfigurierbarer Rate. Crossover als Single-Point oder uniform (im Skelett zu entscheiden).

## Genome (Erstentwurf)

- **Räuber:** `speed`, `size`, `armor`, `aggression_threshold`, `pack_size`, `vision_range`
- **Pflanzenfresser-Konkurrent:** `speed`, `vigilance`, `herd_size`, `forage_efficiency`
- **Pflanzen:** `growth_rate`, `toxicity`, `abundance`
- **Spieler-Herde (passiv evolvierend):** `speed`, `stamina`, `size`, `vigilance`, `forage_efficiency`

Werte sind normalisierte Floats `[0, 1]`. Jedes Tier hat ein eigenes Genom; Population-Statistiken (Mittelwert, Streuung) werden zur Anzeige aggregiert.

## Events (~1 pro 2 Generationen)

Verteilung: ~80 % Auto-Apply, ~20 % Choice.

**Sehr positiv (selten):**
- **Lagune** (Herbivor): Wasser + saftige Pflanzen → Pop +20 %, Stamina-Boost
- **Frischer Kadaver** (Carnivor): Sofort-Nahrung ohne Kampfrisiko
- **Fruchtbare Lichtung**: konzentrierte Nahrung, beschleunigtes Generationswachstum
- **Höhlenversteck**: 1 Generation Räuber-Selektionsdruck pausiert

**Positiv:**
- **Beerensträucher / Mineralquelle**: kleiner Stat-Boost
- **Verlassenes Nest**: einmaliger Population-Boost
- **Salzlecke**: +Fortpflanzungsrate für eine Generation

**Neutral mit Evo-Twist:**
- **Pandemie**: 5–10 % sterben, Überlebende vererben Resistenz → sichtbare Selektion in einer Generation
- **Mutagener Tümpel** (Choice): trinken? Mutationsrate ×3 nächste Generation
- **Beute-Boom**: Pflanzen wachsen schneller — Konkurrenten profitieren auch

**Leicht negativ:**
- **Sandsturm / Hitzewelle**: Bewegung oder Stamina-Cap reduziert (1 Gen)
- **Insektenschwarm**: minimaler Pop-Decline
- **Feuer am Horizont**: ein Biom wird über N Generationen unzugänglich → erzwingt Migration

**Wichtige Eigenschaft:** Events sind **kompetitiv**, nicht exklusiv. Ein Kadaver, den der Spieler als Herbivor ignoriert, füttert nahe Räuber-Populationen → deren nächste Generation ist größer. NPC-Events werden dezent als HUD-Notification angezeigt (Transparenz für Strategie-Lesbarkeit).

## Biome

Wald, Ebene, Fluss, Felsen. Events sind biom-gebunden:

- Lagune nur in Ebenen
- Höhlenversteck nur in Felsen
- Kadaver nur in Räuber-Revieren

Macht Erkundung mechanisch attraktiv (vs. „in einem sicheren Biom kleben").

## Score

- **Hauptmetrik:** überlebte Generationen
- **Sekundär:** Maximalpopulation, Biome erschlossen

Score wird wie bei Tetris/Snake serverseitig validiert. Caps konservativ wählen (z. B. ≤ 10 000 Generationen, plausibler Score-pro-Sekunde-Wert für Echtzeit).

## Visuals (Initial-Skope)

Bewusst einfach: top-down 2D, Dinosaurier als gefärbte Dreiecke/Kreise mit Rotationsindikator, Biome als gefärbte Regionen mit Texturhint. Predator/Prey/Plant farblich klar unterscheidbar. Health/Stamina als kleine Bars über jedem Tier.

## Tech-Setup (Stack-konform)

Folgt der bestehenden Konvention (siehe `CLAUDE.md`):

- `src/games/dinos/logic.js` — State-Modell, Genome, `step(state, dt, action)`, Selection/Mutation/Crossover. **Pure Funktionen.**
- `src/games/dinos/renderer.js` — Canvas-Zeichnen, liest aus State, mutiert nichts.
- `src/games/dinos/controls.js` — Maus/Touch/Tastatur → Actions; `cleanup()` zurückgeben.
- `src/pages/dinos.js` — `mount(container) → destroy`, mit Mode-Picker als erstem Schritt.
- Neue Route in `src/main.js`, Nav-Link in `src/ui/nav.js`, Home-Card in `src/pages/home.js`.
- Migration `supabase/migrations/004_dinos.sql`: ENUM um `dinos_realtime` + `dinos_turn` erweitern, CHECK-Constraint auf `scores` ergänzen, WITH-CHECK-Klausel der Insert-Policy ergänzen (alle drei Schritte gemäß `CLAUDE.md`).
- Leaderboard-Tabs in `src/ui/leaderboard.js` erweitern (zwei neue Tabs).

## Implementierungs-Reihenfolge

1. **Logic-Skelett** (`logic.js`): State-Modell, Genom-Struktur, `step()`, Selection-Stub — pure Funktionen, ohne Render/Controls, lokal testbar im Browser-Konsolen-REPL.
2. **Migration `004_dinos.sql`**: ENUM-Erweiterung, CHECK + RLS-Policy ergänzen.
3. **Page + Renderer + Controls** zuerst für Echtzeit-Modus (klarerer Test-Loop, schnellere Visualisierung).
4. **Rundenbasierter Modus**: gleiche Logik, anderer Input-Layer.
5. **Events**.
6. **UI-Polish + Leaderboard-Tabs**.

## Offene Punkte

- Genome-Repräsentation final festlegen (Floats vs. Bit-Strings) — Floats sind im Skelett geplant, Bit-Strings wären klassischer GA-Stil aber overkill.
- Crossover-Variante (Single-Point vs. Uniform) — im Skelett zu entscheiden, beide trivial implementierbar.
- Initial-Population-Größen pro Biom: Balance-Frage, gehört in Playtest-Phase.
- Score-Caps: konkrete Zahlen erst nach erstem Playtest fixieren.
