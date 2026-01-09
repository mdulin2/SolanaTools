interface NavItem {
  href: string;
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { href: '/SolanaTools/index.html', label: 'Home', id: 'home' },
  { href: '/SolanaTools/hex-base58.html', label: 'Hex ↔ Base58', id: 'hex-base58' },
  { href: '/SolanaTools/pda-derivation.html', label: 'PDA Derivation', id: 'pda' },
  { href: '/SolanaTools/ata-derivation.html', label: 'ATA Derivation', id: 'ata' },
  { href: '/SolanaTools/account-viewer.html', label: 'Account Viewer', id: 'account-viewer' },
  { href: '/SolanaTools/account-compare.html', label: 'Account Compare', id: 'account-compare' },
  { href: '/SolanaTools/core-addresses.html', label: 'Core Addresses', id: 'core-addresses' },
  { href: '/SolanaTools/tools.html', label: 'Tools', id: 'tools' },
  { href: '/SolanaTools/security.html', label: 'Security', id: 'security' },
  { href: '/SolanaTools/documentation.html', label: 'Documentation', id: 'docs' },
];

export function initNavigation(activePageId: string) {
  const navContainer = document.getElementById('nav-container');
  if (!navContainer) {
    console.error('Navigation container not found');
    return;
  }

  const navHTML = navItems
    .map(item => {
      const isActive = item.id === activePageId;
      return `<a href="${item.href}" class="tool-btn${isActive ? ' active' : ''}">${item.label}</a>`;
    })
    .join('\n        ');

  navContainer.innerHTML = `
    <nav class="tool-nav">
      ${navHTML}
    </nav>
  `;
}
