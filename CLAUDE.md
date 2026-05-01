# CLAUDE.md

Leitfaden für Claude (und andere Agenten) zur Arbeit an diesem Repository. Diese Datei wird automatisch in den Kontext geladen – sie sollte knapp, präzise und aktuell bleiben.

## Projektüberblick

Vanilla-JS-Webapp mit zwei Browser-Spielen (Tetris, Snake), Supabase-Backend für Auth & Leaderboard, Vite als Build-Tool, Auto-Deploy auf GitHub Pages. Keine Frontend-Frameworks, keine TypeScript, kein CSS-Preprocessor. Bewusst minimaler Stack.

## Schnellstart

```bash
npm install
cp .env.example .env       # mit Supabase-Credentials befüllen
npm run dev                # http://localhost:5173/claude-game/
npm run build              # Production-Build nach dist/
```

## Verzeichnis-Layout

```
src/
├── main.js              Hash-Router; ruft mount()/destroy() der Pages
├── api/                 dünner Wrapper um @supabase/supabase-js
│   ├── supabase.js      Client-Singleton (eine Instanz pro App)
│   ├── auth.js          signIn/Up/Out, getUser/getSession, onAuthChange
│   └── scores.js        saveScore, getLeaderboard
├── games/<name>/        reine Spiel-Implementierung, kein DOM-Code
│   ├── logic.js         pures State-Modell (Reducer-Stil)
│   ├── renderer.js      Canvas-Zeichnen, liest State, mutiert nichts
│   └── controls.js      Keyboard + Touch → Actions; gibt cleanup() zurück
├── pages/               Page-Komponenten mit mount(container) → destroy
├── ui/                  geteilte UI-Bausteine (nav, leaderboard, modal)
├── styles/main.css      einziges CSS, mit CSS-Custom-Properties
└── assets/              eingebundene Bilder

supabase/migrations/     SQL-Migrationen, manuell im Dashboard ausführen
.github/workflows/       deploy.yml + keepalive.yml
```

## Architektur-Konventionen

### Page-Lifecycle

Jede Page in `src/pages/` exportiert:

```js
export function mount(container) {
  // Setup: DOM, Listener, Game-Loop starten
  return function destroy() {
    // ALLES wieder abbauen: rafId canceln, removeEventListener, Timer clearen
  };
}
```

`main.js` ruft `destroy()` vor dem nächsten `mount()`. Wenn das nicht passiert, leaken Listener und Game-Loops laufen mehrfach. **Beim Hinzufügen neuer Pages oder Listener immer prüfen, dass die Cleanup vollständig ist.**

### Game-Module sind dreigeteilt

| Datei         | Was rein darf                              | Was nicht rein darf                |
| ------------- | ------------------------------------------ | ---------------------------------- |
| `logic.js`    | pure Funktionen, State-Transformationen    | DOM, Canvas, `Date.now`-Aufrufe außerhalb von `createState()`, Random außerhalb von Spawn-Logik |
| `renderer.js` | Canvas-Calls, liest aus State (z. B. `getGhostY`) | State-Mutation, Logik-Entscheidungen |
| `controls.js` | Event-Handler; ruft Logic-Funktion auf (Tetris: `dispatch(action)`, Snake: `setState(s => …)`) | direkte Property-Mutation, Render-Calls, eigene Spielregeln |

Diese Trennung ist die Grundlage dafür, dass die Spiele sich später ohne DOM testen lassen. **Nicht aufweichen.**

### State-Updates

State-Objekte werden **immer immutabel** behandelt: `{ ...state, foo: bar }`, nie `state.foo = bar`. Tetris-`board` und Snake-`snake` werden vor dem Schreiben kopiert (`.map(row => [...row])` bzw. neuer Array).

### Keyboard-Listener

Globale `keydown`-Handler **müssen** früh ausspringen, wenn das Event aus einem Input-Feld oder offenen Dialog kommt:

```js
if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('dialog[open]')) return;
```

Das ist bereits in beiden `controls.js` so umgesetzt – beim Ergänzen neuer Tasten-Bindings nicht vergessen. Hintergrund: Auth-Modal-Eingaben sollen nicht das Spiel steuern (siehe Commit `e9100e6`).

### Supabase / Sicherheit

- **Niemals** `user_id` aus dem Client schicken. Die Spalte hat `DEFAULT auth.uid()`. Wer das umgeht, öffnet ein Identity-Spoofing-Loch.
- **Nur den anon key** (`VITE_SUPABASE_ANON_KEY`) im Frontend verwenden. Service-Role-Key niemals committen oder importieren.
- **Score-Validierung gehört in die DB**, nicht ins Frontend (Client kann jeden Wert schicken). Aktuelle Limits in `supabase/migrations/002_rls.sql`: Score-Caps pro Spiel, Plausibilität (`score / duration_seconds <= 100000`), Rate-Limit (`< 10` Scores/h, `< 2` Scores/Minute, also faktisch max. 9/h und max. 1/min). Wer ein neues Spiel hinzufügt: Score-Cap und Plausibilitäts-Check sowohl in der CHECK-Constraint (`001_schema.sql`) als auch in der WITH-CHECK-Klausel (`002_rls.sql`) ergänzen.
- **Spielernamen** werden über `textContent` ins DOM gesetzt – nie `innerHTML` mit User-Input verwenden. Der DB-Constraint auf `^[a-zA-Z0-9_-]+$` ist eine Defense-in-Depth-Schicht, kein Ersatz.
- `getSession()` ist nur für UI-State („Login-Button anzeigen?"). Sicherheits­kritische Checks immer mit `getUser()` (validiert serverseitig).

### Routing

Hash-basiert (`#/tetris`, `#/snake`, leer = Home). Neue Routen in `src/main.js` im `routes`-Objekt registrieren. Lazy-Loading via dynamischem `import()` ist Pflicht, sonst werden alle Spiele bei jedem Page-Load mitgeladen.

## Stil & Code-Geschmack

- **Vanilla JS, keine Frameworks.** Keine Build-Schritte einbauen, die das ändern (kein React/Lit/Stimulus, kein TypeScript).
- **Keine neuen Runtime-Dependencies ohne Notwendigkeit.** Aktuell nur `@supabase/supabase-js`. Vor dem Hinzufügen einer Lib prüfen, ob 30 Zeilen Vanilla-Code reichen.
- **CSS in `src/styles/main.css`**, keine separaten Dateien pro Komponente. Nutzt CSS-Custom-Properties (`var(--accent)` etc.) – keine Hardcoded-Farben in neuen Regeln.
- **Deutsche UI-Texte**, englische Code-Identifier. Fehlermeldungen aus Supabase werden in `src/api/auth.js#ERROR_MAP` ins Deutsche gemappt.
- **Kommentare nur, wenn das Warum nicht offensichtlich ist.** Beispiele aus dem Bestand: „Prevent 180° turn", „user_id intentionally NOT sent". Keine Doku-Kommentare über jeden Funktionskopf.
- **Modulgrenzen respektieren.** `pages/` darf `games/`, `api/`, `ui/` importieren. `games/` darf nichts aus `pages/` oder `ui/` importieren. `api/` darf nichts aus `games/`/`pages/`/`ui/` importieren.

## Häufige Aufgaben

### Neues Spiel hinzufügen

1. `src/games/<name>/{logic,renderer,controls}.js` nach dem Tetris/Snake-Vorbild anlegen.
2. `src/pages/<name>.js` mit `mount/destroy` erstellen (Game-Loop, Score-Save, Leaderboard).
3. Route in `src/main.js` registrieren.
4. Nav-Link in `src/ui/nav.js` ergänzen.
5. Game-Card in `src/pages/home.js` ergänzen.
6. Neue Migration `supabase/migrations/004_<name>.sql` anlegen, die das ENUM erweitert (`ALTER TYPE public.game_type ADD VALUE '<name>'`) und sowohl die CHECK-Constraint auf `scores` als auch die WITH-CHECK-Klausel der Insert-Policy um Score-Cap und Plausibilität für das neue Spiel ergänzt. Alte Migrationen **nicht** editieren.
7. Leaderboard-Tabs in `src/ui/leaderboard.js` erweitern.

### Neue Migration

- Neue Datei `supabase/migrations/00X_<beschreibung>.sql` mit fortlaufender Nummer.
- Alte Migrationen sind eingespielt → **nie nachträglich editieren**, nur additiv arbeiten (neue Migration mit `ALTER`/`CREATE OR REPLACE`).
- Migration manuell im Supabase-SQL-Editor ausführen (es gibt aktuell keine Auto-Apply-Pipeline).

### Score-Limits ändern

Drei Stellen müssen konsistent bleiben, sonst landet man bei `42501`-Errors (Policy-Verletzung) oder Schema-CHECK-Fehlern:

1. CHECK-Constraint in `supabase/migrations/001_schema.sql` – aktualisiert die Vorlage für neue Projekte/Forks.
2. WITH-CHECK-Klausel der Insert-Policy in `supabase/migrations/002_rls.sql` – aktualisiert die Vorlage für neue Projekte/Forks.
3. Neue Migration `00X_*.sql` schreiben, die per `ALTER TABLE … DROP CONSTRAINT … ADD CONSTRAINT …` und `CREATE OR REPLACE`/`DROP POLICY` + `CREATE POLICY` die laufende DB tatsächlich umstellt. Schritte 1 und 2 allein wirken **nicht** auf bereits eingespielte Datenbanken.

### Deployment

Push auf `main` → GitHub Action baut und deployt nach `gh-pages`. Kein manueller Deploy nötig. Wenn Pages-URL/Repo-Name geändert wird, **`base` in `vite.config.js` mitziehen** – sonst brechen Asset-Pfade.

## Was nicht tun

- Keine `console.log`/`debugger` in Commits.
- Keine `innerHTML = userInput` – immer `textContent` für unvertraute Strings.
- Keine direkte State-Mutation in Logic/Renderer/Controls.
- Keine globalen Variablen außerhalb von Modulen.
- Kein Hinzufügen von Frameworks/Buildern/Linters ohne ausdrücklichen Wunsch des Maintainers.
- Keine Service-Role-Keys im Frontend; keine Secrets in `.env.example`.
- Keine bestehenden Migrationen editieren – nur neue anlegen.
- Keine Backwards-Compat-Hacks für ungenutzten Code; löschen ist meist die richtige Antwort.

## Externe Ressourcen

- [Vite Docs](https://vitejs.dev/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub Pages Action (peaceiris)](https://github.com/peaceiris/actions-gh-pages)
