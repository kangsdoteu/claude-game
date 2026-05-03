# Dino-Evo Implementierungs-Status

Stand: 2026-05-03. Tracking-Issue: [#26](https://github.com/kangsdoteu/claude-game/issues/26).

## Pipeline-Übersicht

| Phase | Status | Artefakt |
|---|---|---|
| 0 — Design-Klärung | ✅ done | [Phase-0-Brief](https://github.com/kangsdoteu/claude-game/issues/26#issuecomment-4365984511) |
| 1a — Logic-Skelett + Vitest | ✅ merged | PR #28 |
| 1b — Migration `004_dinos.sql` | ✅ merged | PR #29 |
| 3 — Echtzeit-Modus (page/renderer/controls) | 🟡 implementiert lokal — noch nicht commited/PRed | siehe `src/pages/dinos.js`, `src/games/dinos/{renderer,controls}.js` |
| 4 — Rundenbasierter Modus | ⏸ pending — Picker zeigt „Rundenbasiert", Logik wartet | — |
| 5 — Events (Auto + Choice) | ⏸ pending | — |
| 6 — UI-Polish + Leaderboard-Tabs | 🟡 LB-Tabs `dinos_realtime`/`dinos_turn` schon hinzugefügt — Polish offen | `src/ui/leaderboard.js` |

## Nächster Trigger

1. **Migration anwenden**, falls noch nicht passiert: `004_dinos.sql` in zwei Schritten im Supabase-SQL-Editor:
   - **Section A** (außerhalb Transaktion): die zwei `ALTER TYPE … ADD VALUE`-Zeilen.
   - **Section B** (in `BEGIN; … COMMIT;`): CHECK-Constraints + Policy-Replace.
   Ohne Migration werden Dino-Scores mit `42501` abgewiesen — die Page fängt das mit Statusmeldung „⚠ Score abgelehnt …" ab.

2. **Phase 3 review + commit**: Lokale Änderungen sichten und PR aufmachen. Branch-Vorschlag: `dinos-phase3-realtime`. Geänderte/Neue Dateien siehe `git status`.

## Phase 3 — Was gemacht wurde

Lokal, noch nicht committet:

- **Logic-Erweiterungen** (additiv, keine Test-Brüche):
  - `state.js`: neue Konstanten `WORLD_SIZE`, `BIOME_SIZE`, `BIOME_ORIGIN`. Entitäten werden bei `createState` deterministisch zufällig im jeweiligen Biom-Quadranten verteilt (vorher alle bei `(0,0)`).
  - `state.js` + `step.js`: neues Feld `state.encounterCooldown` — verhindert, dass `findEncounters` direkt nach `fight`/`flee` denselben Modal wieder triggert (8 s nach Kampf, 15 s nach Flucht).
  - `step.js#phaseSimulating`: Bewegung erstmals implementiert (vorher TODO):
    - Player-Herde driftet zum `waypoint` mit `40 + speed*60` Welt-Einheiten/s, `pace='run'` ×1.6.
    - Predatoren im aktiven Biom verfolgen den nächstgelegenen Herd-Member mit `30 + speed*50` Einheiten/s.
    - `player.biome` wird per `getBiomeAt(herdCenter)` jeden Frame neu abgeleitet; `metrics.biomesExplored` wächst dabei automatisch.
    - Bewegung ist **deterministisch (kein RNG)** — Determinismus-Tests bleiben grün.
  - `step.js#phaseBreeding`: Kinder bekommen Position innerhalb ihres Biom-Quadranten (statt `(0,0)`).
- **Page/Renderer/Controls**:
  - `src/pages/dinos.js` — `mount/destroy`, Modus-Picker (Echtzeit/Rundenbasiert), RAF-Loop, HUD (Generation/Score/Phase/Peak Pop), 4 klickbare Biom-Karten, Encounter-Modal mit Fight/Flee, Game-Over-Save.
  - `src/games/dinos/renderer.js` — Top-Down-Canvas 600×600, rendert nur aktives Biom (Phase-0-Vorgabe). Herd-Mitglieder, die mid-transit aus dem Biom raus sind, werden ausgeblendet (`isInBiome`-Filter).
  - `src/games/dinos/controls.js` — Klick auf Canvas → `setWaypoint`-Action, F/R für Fight/Flee, Q für `endTurn` (Turn-Mode), Leertaste toggelt Pace. Keyboard-Guard wie in Tetris/Snake.
- **Wiring**: Route `#/dinos` (lazy), Nav-Link, Home-Game-Card, Leaderboard-Tabs `dinos_realtime` + `dinos_turn`.
- **CSS**: neuer Block `Dino-Evo: spezifische Komponenten` in `src/styles/main.css` (Mode-Picker, Encounter-Modal, Biom-Karten, `#dn-canvas`-Layout).

## Phase 3 — Bekannte Lücken / offene Punkte

- **Turn-Mode**: Picker zeigt den Button, `createState({mode:'turn',…})` wird gerufen, GA-Phasen laufen synchron via `endTurn`. Aber zwischen den Aktionen passiert visuell nichts, weil `loop()` für `turn` `dt=0` benutzt. Phase 4 ist explizit dafür da.
- **Mobile-Touch**: Pikmin-Stil-Waypoint reagiert auf `click` (funktioniert auf Touch), aber kein dezidierter Touch-Pfad oder D-Pad. Mobile-Layout-Test steht aus.
- **Renderer-Polish**: Player-Herd-Mitglieder stapeln sich am Waypoint (kein Spread/Formation). Pop-Trend-Pfeile in den Biom-Karten fehlen — bisher nur Zahl.
- **Encounter-Resolver-Stub**: `world.js#resolveEncounter` ist weiterhin der Phase-1a-Stub mit `outcome: {0,0}`. Ohne echte Auflösung sterben weder Player-Herd-Member noch Predatoren während eines Encounters — Game-Over kann derzeit nur über echte Generationen-Selektion eintreten (Player-Herd-Pop wird in der `mutating`-Phase nicht reduziert, also faktisch nie). Phase 4/5.
- **Keepalive von `findEncounters` bei Cooldown**: korrekt, aber Implementierung verwendet eine neue State-Property `encounterCooldown`, die in `state.js#createState` initialisiert wird — falls jemand Tests gegen JSON-Snapshots schreibt, müssen sie das Feld kennen. Aktuelle 31 Tests sind davon nicht betroffen.

## Smoke-Test-Status

- `npm test` — 31 Tests grün (state/step/evo).
- `npm run dev` + Browser — Page lädt, Encounter-Modal erscheint früh (initial-pos), Flee → Wald-Biom-Card → Herde wandert, Score steigt 10 → 15 (1 → 2 Biome erkundet), Cleanup beim Route-Wechsel ok.

## Verbindliche Werte (aus Phase 0 + Architektur-Spec)

Schon hart in `src/games/dinos/logic/state.js` codiert (PR #28). Nur referenzhalber:

- **Genome (Float `[0,1]`)**: predator 7 Gene, herbivore 6, plant 4. Initial-Verteilung CLT (`(rand+rand+rand)/3`), Ausnahmen für `predator.pack_size`/`aggression` Mittel 0.35 und `plant.toxicity` 0.1.
- **GA**: BLX-α (α=0.3), Gauß-Mutation (σ=0.08, p=0.15), Tournament-Selection (k=3), 1-Elitismus.
- **Pop-Caps**: 250 bewegte Entitäten, 4 Biome simultan simuliert (nur aktives gerendert).
- **Score-Formel**: `gen·10 + biomes·5 + floor(peak_pop/50)`.
- **DB-Caps**: `dinos_realtime` ≤ 400 (`score/duration ≤ 0.4`), `dinos_turn` ≤ 5000. Kalibriert via `005_dinos_recalibrate.sql` (Issue #36); ältere Werte (200 / 0.05) waren Einheitenfehler.
- **Ticks**: Realtime 45–60 s pro Generation (`MIN_GEN_SECONDS=45`), Turn-Mode mind. 3 Spieler-Aktionen pro Generation.

## Kanonische Quellen

- [`docs/dinos-design.md`](dinos-design.md) — Vollkonzept.
- [`docs/phase1-spec.md`](phase1-spec.md) — Architektur-Spec für `logic/`-Submodule (Backup zum Issue-Kommentar).
- Issue-Kommentare in [#26](https://github.com/kangsdoteu/claude-game/issues/26): Architektur-Review, Phase-0-Brief, Phase-1-Spec.

## Risiken / offene Justierungen

- **Encounter-Resolver-Formel** ist in `world.js` (Phase 1a) nur Stub — echte Auflösung kommt in Phase 3 (oder spätestens Phase 5, falls Events das beeinflussen).
- **Score-Caps** sind großzügig gesetzt; nach erstem Playtest evtl. justieren (würde eine `005_dinos_recalibrate.sql` brauchen, alte Migrations nicht editieren).
- **Pflanzenwachstum + Pathfinding** in `step.js` haben TODO-Kommentare aus Phase 1a — Phase 3 oder 5 schließt sie.
- **Mobile-Eingabe Pikmin-Style**: Tap-to-Waypoint funktioniert auf Touch, aber Multi-Tap-Reihenfolge muss klar sein (UX-Test in Phase 3).
