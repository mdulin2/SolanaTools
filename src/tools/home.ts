import { initNavigation } from '../components/nav';

function init() {
  // Initialize navigation
  initNavigation('home');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
