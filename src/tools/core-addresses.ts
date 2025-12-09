import { initNavigation } from '../components/nav';
import { copyToClipboard, showSuccess, showError } from '../utils/ui';

interface CoreAddress {
  name: string;
  purpose: string;
  address: string;
}

// Configuration: Add or modify addresses here
const coreAddresses: CoreAddress[] = [
  {
    name: 'System Program',
    purpose: 'Creates accounts, allocates account data, assigns programs to accounts, and transfers lamports',
    address: '11111111111111111111111111111111',
  },
  {
    name: 'SPL Token Program',
    purpose: 'Standard token program for creating and managing fungible and non-fungible tokens',
    address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },
  {
    name: 'Token2022 Program (Token Extensions)',
    purpose: 'Enhanced token program with additional features like transfer fees, confidential transfers, etc.',
    address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  },
  {
    name: 'Associated Token Program',
    purpose: 'Creates deterministic token accounts (ATAs) for holding SPL tokens',
    address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  },
  {
    name: 'BPF Loader',
    purpose: 'Loads and executes BPF (Berkeley Packet Filter) programs',
    address: 'BPFLoader2111111111111111111111111111111111',
  },
  {
    name: 'BPF Loader Upgradeable',
    purpose: 'Loads upgradeable BPF programs',
    address: 'BPFLoaderUpgradeab1e11111111111111111111111',
  },
  {
    name: 'Compute Budget Program',
    purpose: 'Allows programs to request additional compute units',
    address: 'ComputeBudget111111111111111111111111111111',
  },
  {
    name: 'Address Lookup Table Program',
    purpose: 'Manages address lookup tables for transaction size optimization',
    address: 'AddressLookupTab1e1111111111111111111111111',
  },
  {
    name: 'Ed25519 Program',
    purpose: 'Verifies Ed25519 signatures',
    address: 'Ed25519SigVerify111111111111111111111111111',
  },
  {
    name: 'Secp256k1 Program',
    purpose: 'Verifies secp256k1 signatures (Ethereum-style)',
    address: 'KeccakSecp256k11111111111111111111111111111',
  },
  {
    name: 'Metaplex Token Metadata Program',
    purpose: 'Manages metadata for SPL tokens and NFTs',
    address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  },
  {
    name: 'Wrapped SOL (WSOL)',
    purpose: 'SPL token representation of native SOL',
    address: 'So11111111111111111111111111111111111111112',
  },
  {
    name: 'Sysvar',
    purpose: 'Generic sysvar address for system variables',
    address: 'Sysvar1111111111111111111111111111111111111',
  },
  {
    name: 'Sysvar: Clock',
    purpose: 'Provides access to current cluster time and slot information',
    address: 'SysvarC1ock11111111111111111111111111111111',
  },
  {
    name: 'Sysvar: Rent',
    purpose: 'Provides rent configuration and calculation information',
    address: 'SysvarRent111111111111111111111111111111111',
  },
  {
    name: 'Sysvar: Epoch Schedule',
    purpose: 'Provides epoch and slot schedule information',
    address: 'SysvarEpochSchedu1e111111111111111111111111',
  },
  {
    name: 'Sysvar: Fees',
    purpose: 'Provides fee calculation information',
    address: 'SysvarFees111111111111111111111111111111111',
  },
  {
    name: 'Sysvar: Instructions',
    purpose: 'Provides access to instructions in the current transaction',
    address: 'Sysvar1nstructions1111111111111111111111111',
  },
  {
    name: 'Sysvar: Recent Blockhashes',
    purpose: 'Provides recent blockhashes for transaction validation',
    address: 'SysvarRecentB1ockHashes11111111111111111111',
  },
  {
    name: 'Sysvar: Rewards',
    purpose: 'Provides staking rewards information',
    address: 'SysvarRewards111111111111111111111111111111',
  },
  {
    name: 'Sysvar: Slot Hashes',
    purpose: 'Provides recent slot hashes',
    address: 'SysvarS1otHashes111111111111111111111111111',
  },
  {
    name: 'Sysvar: Slot History',
    purpose: 'Provides historical slot information',
    address: 'SysvarS1otHistory11111111111111111111111111',
  },
  {
    name: 'Sysvar: Stake History',
    purpose: 'Provides historical stake information',
    address: 'SysvarStakeHistory1111111111111111111111111',
  },
];

function init() {
  // Initialize navigation
  initNavigation('core-addresses');

  const addressesContainer = document.getElementById('addresses-container');
  const messageContainer = document.getElementById('message-container');

  if (!addressesContainer || !messageContainer) {
    console.error('Required elements not found');
    return;
  }

  // Render addresses as a table
  const tableHTML = `
    <div class="addresses-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Purpose</th>
            <th>Address</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${coreAddresses.map((item, index) => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td>${item.purpose}</td>
              <td><code class="address-code">${item.address}</code></td>
              <td>
                <button
                  class="icon-btn copy-address-btn"
                  data-index="${index}"
                  title="Copy address"
                >
                  📋
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  addressesContainer.innerHTML = tableHTML;

  // Add copy event listeners
  const copyButtons = addressesContainer.querySelectorAll('.copy-address-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const index = parseInt((e.currentTarget as HTMLButtonElement).getAttribute('data-index')!);
      const address = coreAddresses[index].address;

      const success = await copyToClipboard(address);
      if (success) {
        showSuccess(`Copied ${coreAddresses[index].name} address!`, messageContainer);
      } else {
        showError('Failed to copy to clipboard', messageContainer);
      }
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
