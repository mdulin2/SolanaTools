import { PublicKey } from '@solana/web3.js';
import { showError, showSuccess, copyToClipboard } from '../utils/ui';
import { initNavigation } from '../components/nav';

// Associated Token Program ID
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function init() {
  // Initialize navigation
  initNavigation('ata');
  const ownerAddressEl = document.getElementById('owner-address') as HTMLInputElement;
  const mintAddressEl = document.getElementById('mint-address') as HTMLInputElement;
  const tokenProgramEl = document.getElementById('token-program') as HTMLSelectElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const ataOutputEl = document.getElementById('ata-output') as HTMLInputElement;
  const messageContainer = document.getElementById('message-container') as HTMLDivElement;

  if (!ownerAddressEl || !mintAddressEl || !tokenProgramEl || !resultSection || !ataOutputEl || !messageContainer) {
    console.error('Required elements not found');
    return;
  }

  async function deriveATA() {
    try {
      // Validate owner address
      const ownerStr = ownerAddressEl.value.trim();
      if (!ownerStr) {
        showError('Please enter a token owner address', messageContainer);
        return;
      }

      const owner = new PublicKey(ownerStr);

      // Validate mint address
      const mintStr = mintAddressEl.value.trim();
      if (!mintStr) {
        showError('Please enter a mint address', messageContainer);
        return;
      }

      const mint = new PublicKey(mintStr);

      // Get selected token program
      const tokenProgramId = new PublicKey(tokenProgramEl.value);

      // Derive the ATA address
      // Seeds: [owner, token_program_id, mint]
      const seeds = [
        owner.toBuffer(),
        tokenProgramId.toBuffer(),
        mint.toBuffer(),
      ];

      const [ataAddress] = PublicKey.findProgramAddressSync(
        seeds,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      ataOutputEl.value = ataAddress.toBase58();
      resultSection.style.display = 'block';

      showSuccess('ATA address derived successfully!', messageContainer);
    } catch (error) {
      showError(`Derivation error: ${error instanceof Error ? error.message : 'Unknown error'}`, messageContainer);
      resultSection.style.display = 'none';
    }
  }

  function clear() {
    ownerAddressEl.value = '';
    mintAddressEl.value = '';
    tokenProgramEl.selectedIndex = 0;
    ataOutputEl.value = '';
    resultSection.style.display = 'none';
    messageContainer.innerHTML = '';
  }

  async function copyATA() {
    const success = await copyToClipboard(ataOutputEl.value);
    if (success) {
      showSuccess('ATA address copied to clipboard!', messageContainer);
    } else {
      showError('Failed to copy to clipboard', messageContainer);
    }
  }

  // Event listeners
  document.getElementById('derive-btn')?.addEventListener('click', deriveATA);
  document.getElementById('clear-btn')?.addEventListener('click', clear);
  document.getElementById('copy-btn')?.addEventListener('click', copyATA);

  // Derive on Enter key in input fields
  ownerAddressEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      deriveATA();
    }
  });

  mintAddressEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      deriveATA();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
