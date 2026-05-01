# GameHub – Tetris & Snake

Eine schlanke Web-App mit den Klassikern **Tetris** und **Snake**, gebaut mit Vanilla JavaScript und Vite. Scores werden in **Supabase** persistiert und in einem öffentlichen Leaderboard angezeigt. Deployment erfolgt automatisch auf **GitHub Pages**.

Live-Demo: <https://kangsdoteu.github.io/claude-game/>

---

## Features

- **Tetris** mit 7-Bag-Randomizer, Hold-Funktion, Ghost-Piece, Wall-Kicks, Soft- & Hard-Drop, DAS (Delayed Auto Shift) und Level-basierter Drop-Speed.
- **Snake** mit Wand- und Selbstkollision sowie Geschwindigkeitsrampe (alle 50 Punkte −10 ms Tick, Mindest-Tick 60 ms).
- **Auth & Leaderboard** über Supabase (E-Mail/Passwort), Top-10 pro Spiel.
- **Touch-Steuerung** für mobile Geräte (eingeblendetes D-Pad bei Viewport ≤ 700 px).
- **Hash-Router** ohne Framework, Lazy-Loading der Seiten via dynamischem `import()`.
- **CI/CD**: Push auf `main` baut und deployt automatisch nach `gh-pages`.
- **Supabase-Keepalive**: Cron-Workflow pingt die Datenbank alle 5 Tage, damit das kostenlose Tier nicht pausiert wird.

## Tech-Stack

| Bereich       | Technologie                              |
| ------------- | ---------------------------------------- |
| Build         | [Vite 5](https://vitejs.dev/)            |
| Sprache       | Vanilla JavaScript (ES Modules)          |
| Rendering     | HTML5 Canvas 2D                          |
| Backend       | [Supabase](https://supabase.com/) (Postgres + Auth + RLS) |
| Hosting       | GitHub Pages                             |
| CI            | GitHub Actions                           |

Keine Framework-Dependencies (kein React/Vue/Svelte). Einzige Runtime-Abhängigkeit: `@supabase/supabase-js`.

## Voraussetzungen

- Node.js ≥ 18
- npm
- Ein Supabase-Projekt (kostenfreies Tier reicht)

## Setup

```bash
git clone git@github.com:kangsdoteu/claude-game.git
cd claude-game
npm install
cp .env.example .env
# .env mit den eigenen Supabase-Credentials befüllen
# Ohne befüllte .env startet die App im Konfigurations-Fehler-Modus und zeigt einen entsprechenden Banner.
npm run dev
```

Die App läuft danach auf <http://localhost:5173/claude-game/>.

### Supabase einrichten

Im Supabase-Projekt nacheinander die Migrationen aus `supabase/migrations/` im SQL-Editor ausführen:

1. `001_schema.sql` – Tabellen `profiles`, `scores`, View `leaderboard`, Score-Limits & Indizes
2. `002_rls.sql` – Row-Level-Security-Policies und Rate-Limiting-Funktion
3. `003_triggers.sql` – Auto-Anlage des Profils beim Sign-Up

Anschließend in den Supabase-**Auth-Settings** `http://localhost:5173/claude-game/` (für Dev) und die Pages-URL (für Prod) als erlaubte Redirect-URLs eintragen. Optional: E-Mail-Bestätigung deaktivieren, um den Login-Flow zu vereinfachen.

### Umgebungsvariablen

| Variable                   | Beschreibung                                |
| -------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`        | Projekt-URL (z. B. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY`   | Anon/Public Key aus den Supabase-Projektsettings |

> Variablen mit `VITE_`-Prefix landen im Client-Bundle. Niemals den Service-Role-Key hier verwenden – nur den **anon key**, der durch RLS abgesichert ist.

## NPM-Skripte

| Skript            | Zweck                                |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Vite-Dev-Server mit HMR              |
| `npm run build`   | Production-Build nach `dist/`        |
| `npm run preview` | Production-Build lokal vorschauen    |

## Projektstruktur

```
.
├── index.html                 # Single-Page-Entry, lädt main.js
├── vite.config.js             # base = '/claude-game/' (für GitHub Pages)
├── public/                    # statische Assets (Favicon, Icons)
├── src/
│   ├── main.js                # Hash-Router, Page-Lifecycle
│   ├── api/
│   │   ├── supabase.js        # Singleton-Client
│   │   ├── auth.js            # Sign-In/Up/Out, Session-Helper
│   │   └── scores.js          # saveScore, getLeaderboard
│   ├── games/
│   │   ├── tetris/            # logic.js · controls.js · renderer.js
│   │   └── snake/             # logic.js · controls.js · renderer.js
│   ├── pages/                 # home.js · tetris.js · snake.js (mount/destroy)
│   ├── ui/                    # nav.js · auth-modal.js · leaderboard.js
│   ├── styles/main.css        # globales CSS, Custom Properties, Responsive
│   └── assets/                # eingebundene Bilder/SVGs
├── supabase/migrations/       # Schema, RLS-Policies, Trigger
└── .github/workflows/
    ├── deploy.yml             # Build + Deploy nach gh-pages
    └── keepalive.yml          # Pingt Supabase alle 5 Tage
```

## Architektur

### Routing & Lifecycle

`src/main.js` ist ein einfacher Hash-Router. Routen mappen auf dynamische Imports, sodass jeder Page-Code erst beim Aufruf geladen wird.

Jede Page exportiert eine `mount(container)`-Funktion, die eine `destroy`-Funktion zurückgibt. Beim Routenwechsel wird zuerst `destroy()` aufgerufen – das stoppt `requestAnimationFrame`-Loops und entfernt globale Event-Listener. Dieses Pattern verhindert Memory-Leaks und doppelt registrierte Tasten-Handler.

### Game-Module

Jedes Spiel ist in drei reine Module aufgeteilt:

- **`logic.js`** – pures, framework-freies Spielmodell. Nimmt einen State, gibt einen neuen State zurück. Kein DOM, keine Seiteneffekte, keine Renderer-Aufrufe. Reducer-ähnlicher Stil (z. B. `dispatch(state, action)` bei Tetris).
- **`renderer.js`** – zeichnet einen gegebenen State auf ein `<canvas>`. Keine Logik, keine State-Mutation.
- **`controls.js`** – bindet Tastatur und Touch, dispatcht Aktionen an die Logic. Gibt eine Cleanup-Funktion zurück, die alle Listener entfernt.

Diese Trennung erlaubt es, Spiele-Logik zu testen, ohne DOM/Canvas zu mocken.

### Auth & Scores

- Der Supabase-Client wird als Singleton in `src/api/supabase.js` initialisiert.
- `getSession()` liefert die gecachte Session und ist **nicht** sicherheits­kritisch – nur für UI-Status (z. B. „angemeldet?"). Für Sicherheits-Checks `getUser()` verwenden, das den Token serverseitig validiert.
- `saveScore()` schickt **kein** `user_id` mit – die Spalte hat `DEFAULT auth.uid()`, sodass die Datenbank den eingeloggten Nutzer setzt. So kann ein böswilliger Client keine fremden IDs einschleusen.

### Sicherheit

- **Row-Level-Security** ist auf allen Tabellen aktiviert.
- `scores` ist **immutabel**: keine UPDATE/DELETE-Policies → Default-Deny.
- **Server-seitige Score-Validierung** in der INSERT-Policy:
  - Score-Obergrenzen pro Spiel (Tetris ≤ 10 000 000, Snake ≤ 100 000)
  - Plausibilitäts-Check: `score / duration_seconds ≤ 100 000`
  - `duration_seconds` muss zwischen 5 und 7200 liegen (Schema-CHECK)
  - Rate-Limit pro Nutzer: höchstens 9 Scores in der letzten Stunde und höchstens 1 Score in der letzten Minute (Policy verlangt `< 10` bzw. `< 2`)
- `display_name` ist auf `^[a-zA-Z0-9_-]+$` und `VARCHAR(30)` mit `char_length >= 3` beschränkt → keine Sonderzeichen, kein XSS-Vektor.
- Im Frontend wird Spielername immer per `textContent` gesetzt (nie `innerHTML`).

## Steuerung

### Tetris

| Taste            | Aktion           |
| ---------------- | ---------------- |
| ← / → / A / D    | Bewegen          |
| ↓ / S            | Soft Drop        |
| ↑ / W / Z        | Drehen           |
| Leertaste        | Hard Drop        |
| C / Shift        | Hold             |

Linke/rechte Pfeiltasten und A/D unterstützen DAS (170 ms Anlauf, 50 ms Wiederholung).

### Snake

| Taste              | Aktion          |
| ------------------ | --------------- |
| Pfeiltasten / WASD | Richtungswechsel |

Direkte 180°-Wenden werden ignoriert (sonst würde der Kopf sofort in den eigenen Hals laufen).

### Mobile

Bei Viewport-Breite ≤ 700 px wird ein Touch-D-Pad eingeblendet.

## Deployment

`main`-Pushes triggern `.github/workflows/deploy.yml`:

1. `npm ci` & `npm run build` mit den Repo-Variablen `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
2. `dist/` wird via `peaceiris/actions-gh-pages` nach `gh-pages` gepusht.
3. GitHub Pages serviert von dort.

In den Repo-Settings müssen unter **Settings → Secrets and variables → Actions → Variables** die beiden Variablen `SUPABASE_URL` und `SUPABASE_ANON_KEY` gesetzt sein. Sind die Variablen nicht gesetzt, baut die App trotzdem fehlerfrei durch – sie startet dann im Konfigurations-Fehler-Modus und zeigt einen entsprechenden Banner.

> **Hinweis:** `vite.config.js` setzt `base: '/claude-game/'`. Bei Fork mit anderem Repo-Namen muss dieser Wert angepasst werden, sonst brechen alle relativen Asset-Pfade auf Pages.

## Lizenz

MIT – ein eigener `LICENSE`-Text liegt noch nicht im Repository und sollte vor einer ersten Veröffentlichung ergänzt werden.
