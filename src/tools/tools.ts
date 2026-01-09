import { initNavigation } from '../components/nav';

function init() {
  // Initialize navigation
  initNavigation('tools');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
