export function mount(container) {
  const section = document.createElement('section');
  section.className = 'admin-tab admin-tab-games';
  const p = document.createElement('p');
  p.className = 'admin-placeholder-text';
  p.textContent = 'Spiele-Verwaltung — folgt in Phase 4.';
  section.appendChild(p);
  container.appendChild(section);
  return function destroy() {
    // Phase-2-Platzhalter: noch nichts zu cleanen
  };
}
