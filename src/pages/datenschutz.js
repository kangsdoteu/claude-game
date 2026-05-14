export function mount(container) {
  const article = document.createElement('article');
  article.className = 'datenschutz';

  function section(titleText, paragraphs) {
    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    article.appendChild(h2);
    for (const text of paragraphs) {
      const p = document.createElement('p');
      p.textContent = text;
      article.appendChild(p);
    }
  }

  const h1 = document.createElement('h1');
  h1.textContent = 'Datenschutzerklärung';
  article.appendChild(h1);

  section('1. Verantwortlicher', [
    'Dieses Projekt ist ein privates Hobby-Projekt ohne kommerziellen Hintergrund. Für Fragen zum Datenschutz wende dich bitte per E-Mail an: datenschutz@example.com (Platzhalter – Kontaktadresse folgt).',
  ]);

  section('2. Erhobene Daten', [
    'Bei der Registrierung und Nutzung des Dienstes werden folgende Daten erhoben: E-Mail-Adresse (Pflichtfeld für die Anmeldung), ein frei wählbarer Anzeigename (Display-Name), Spielstand-Scores sowie die Spieldauer je Runde.',
    'Weitere personenbezogene Daten werden nicht aktiv erhoben.',
  ]);

  section('3. Verarbeitung und Dienstleister', [
    'Die Daten werden über Supabase (https://supabase.com) gespeichert und verarbeitet. Supabase betreibt Server in der EU (AWS Frankfurt). Die Nutzungsbedingungen und Datenschutzrichtlinien von Supabase gelten zusätzlich.',
    'Die Webanwendung selbst wird statisch über GitHub Pages (https://pages.github.com) ausgeliefert. GitHub kann dabei technische Zugriffsprotokolle (IP-Adresse, Zeitstempel) erfassen; diese werden von GitHub erhoben und unterliegen Githubs Datenschutzrichtlinien.',
  ]);

  section('4. Speicherdauer', [
    'Deine Daten werden so lange gespeichert, wie dein Konto existiert. Nach einer Kontolöschung werden alle zugehörigen Scores und Profildaten gelöscht. Wende dich dazu an die oben genannte Kontaktadresse.',
  ]);

  section('5. Deine Rechte', [
    'Du hast jederzeit das Recht auf Auskunft über die zu deiner Person gespeicherten Daten, auf Berichtigung unrichtiger Daten sowie auf Löschung deiner Daten. Sende dazu eine formlose E-Mail an die oben genannte Kontaktadresse.',
  ]);

  section('6. Cookies und lokale Speicherung', [
    'Diese Anwendung verwendet kein Third-Party-Tracking und keine Werbe-Cookies. Im lokalen Browserspeicher (localStorage) werden ausschließlich technisch notwendige Daten abgelegt: Auth-Session-Token (Supabase) sowie Dismiss-Status für Wartungshinweise (Maintenance-Banner).',
    'Es werden keine Daten an Werbenetzwerke oder Analyse-Dienste übermittelt.',
  ]);

  section('7. Stand', [
    'Stand dieser Datenschutzerklärung: 14.05.2026.',
  ]);

  container.appendChild(article);

  return function destroy() {
    // Keine Listener oder Loops zu bereinigen
  };
}
