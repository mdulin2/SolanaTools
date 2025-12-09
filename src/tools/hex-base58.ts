import bs58 from 'bs58';
import { showError, showSuccess, copyToClipboard } from '../utils/ui';
import { initNavigation } from '../components/nav';

function init() {
  // Initialize navigation
  initNavigation('hex-base58');
  const inputEl = document.getElementById('input') as HTMLInputElement;
  const outputEl = document.getElementById('output') as HTMLInputElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const formatInfo = document.getElementById('format-info') as HTMLSpanElement;
  const messageContainer = document.getElementById('message-container') as HTMLDivElement;

  if (!inputEl || !outputEl || !resultSection || !formatInfo || !messageContainer) {
    console.error('Required elements not found');
    return;
  }

  function convert() {
    const input = inputEl.value.trim();
    if (!input) {
      showError('Please enter a value to convert', messageContainer);
      return;
    }

    try {
      let result: string;
      let detectedFormat: string;

      // Check if input is hex
      if (input.startsWith('0x') || /^[0-9a-fA-F]+$/.test(input)) {
        // Hex to Base58
        const hexStr = input.startsWith('0x') ? input.slice(2) : input;

        if (hexStr.length % 2 !== 0) {
          throw new Error('Invalid hex string: odd length');
        }

        const bytes = new Uint8Array(hexStr.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        result = bs58.encode(bytes);
        detectedFormat = 'Hexadecimal → Base58';
      } else {
        // Base58 to Hex
        const bytes = bs58.decode(input);
        result = '0x' + Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        detectedFormat = 'Base58 → Hexadecimal';
      }

      outputEl.value = result;
      formatInfo.textContent = detectedFormat;
      resultSection.style.display = 'block';
    } catch (error) {
      showError(`Conversion error: ${error instanceof Error ? error.message : 'Invalid input'}`, messageContainer);
      resultSection.style.display = 'none';
    }
  }

  function clear() {
    inputEl.value = '';
    outputEl.value = '';
    resultSection.style.display = 'none';
    messageContainer.innerHTML = '';
  }

  async function copyResult() {
    const success = await copyToClipboard(outputEl.value);
    if (success) {
      showSuccess('Copied to clipboard!', messageContainer);
    } else {
      showError('Failed to copy to clipboard', messageContainer);
    }
  }

  // Event listeners
  document.getElementById('convert-btn')?.addEventListener('click', convert);
  document.getElementById('clear-btn')?.addEventListener('click', clear);
  document.getElementById('copy-btn')?.addEventListener('click', copyResult);

  // Convert on Enter key
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      convert();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
