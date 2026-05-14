export function mount(container) {
  const section = document.createElement('section');
  section.className = 'admin-tab admin-tab-announcements';
  const p = document.createElement('p');
  p.className = 'admin-placeholder-text';
  p.textContent = 'Banner-Verwaltung — folgt in Phase 9.';
  section.appendChild(p);
  container.appendChild(section);
  return function destroy() {
    // Phase-2-Platzhalter: noch nichts zu cleanen
  };
}
