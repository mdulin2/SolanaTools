import bs58 from 'bs58';
import { showError, showSuccess, copyToClipboard } from '../utils/ui';

export function initHexBase58Tool() {
  const container = document.getElementById('tool-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <h2>Hex ↔ Base58 Converter</h2>
      <p class="tool-description">
        Convert between hexadecimal and Base58 encoding (used for Solana addresses)
      </p>

      <div class="form-group">
        <label for="input">Input (Hex or Base58)</label>
        <input
          type="text"
          id="input"
          placeholder="Enter hex (0x...) or base58 string"
          class="input-field"
        />
      </div>

      <div class="button-group">
        <button id="convert-btn" class="primary-btn">Convert</button>
        <button id="clear-btn" class="secondary-btn">Clear</button>
      </div>

      <div class="result-section" id="result-section" style="display: none;">
        <div class="form-group">
          <label>Result</label>
          <div class="result-display">
            <input
              type="text"
              id="output"
              readonly
              class="input-field"
            />
            <button id="copy-btn" class="icon-btn" title="Copy to clipboard">
              📋
            </button>
          </div>
        </div>

        <div class="info-box">
          <strong>Detected format:</strong> <span id="format-info"></span>
        </div>
      </div>

      <div id="message-container"></div>
    </div>
  `;

  const inputEl = document.getElementById('input') as HTMLInputElement;
  const outputEl = document.getElementById('output') as HTMLInputElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const formatInfo = document.getElementById('format-info') as HTMLSpanElement;
  const messageContainer = document.getElementById('message-container') as HTMLDivElement;

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
