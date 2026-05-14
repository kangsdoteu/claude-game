export function mount(container) {
  const section = document.createElement('section');
  section.className = 'admin-tab admin-tab-moderation';
  const p = document.createElement('p');
  p.className = 'admin-placeholder-text';
  p.textContent = 'Moderation — folgt in Phase 8.';
  section.appendChild(p);
  container.appendChild(section);
  return function destroy() {
    // Phase-2-Platzhalter: noch nichts zu cleanen
  };
}
