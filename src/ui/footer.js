export function initFooter(host) {
  if (host.querySelector('.site-footer')) return;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';

  const copyright = document.createElement('span');
  copyright.textContent = '© 2026 GameHub';

  const sep1 = document.createElement('span');
  sep1.className = 'site-footer-sep';
  sep1.textContent = '·';

  const datenschutz = document.createElement('a');
  datenschutz.href = '#/datenschutz';
  datenschutz.textContent = 'Datenschutz';

  const sep2 = document.createElement('span');
  sep2.className = 'site-footer-sep';
  sep2.textContent = '·';

  const github = document.createElement('a');
  github.href = 'https://github.com/kangsdoteu/claude-game';
  github.target = '_blank';
  github.rel = 'noopener noreferrer';
  github.textContent = 'GitHub';

  footer.append(copyright, sep1, datenschutz, sep2, github);
  host.appendChild(footer);
}
