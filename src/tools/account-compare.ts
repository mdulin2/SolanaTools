import { PublicKey, Connection } from '@solana/web3.js';
import { initNavigation } from '../components/nav';
import { showError, showSuccess } from '../utils/ui';

const RPC_ENDPOINT = 'https://solana.drpc.org/';

interface AccountData {
  owner: string;
  lamports: number;
  executable: boolean;
  data: Uint8Array;
}

let account1Data: AccountData | null = null;
let account2Data: AccountData | null = null;

function init() {
  initNavigation('account-compare');

  const address1El = document.getElementById('account-address-1') as HTMLInputElement;
  const address2El = document.getElementById('account-address-2') as HTMLInputElement;
  const rpcUrlEl = document.getElementById('rpc-url') as HTMLInputElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const messageContainer = document.getElementById('message-container') as HTMLDivElement;
  const startByteEl = document.getElementById('start-byte') as HTMLInputElement;
  const endByteEl = document.getElementById('end-byte') as HTMLInputElement;

  if (!address1El || !address2El || !resultSection || !messageContainer) {
    console.error('Required elements not found');
    return;
  }

  async function compareAccounts() {
    const address1 = address1El.value.trim();
    const address2 = address2El.value.trim();

    if (!address1 || !address2) {
      showError('Please enter both account addresses', messageContainer);
      return;
    }

    if (address1 === address2) {
      showError('Please enter two different account addresses', messageContainer);
      return;
    }

    try {
      const rpcUrl = rpcUrlEl.value.trim() || RPC_ENDPOINT;
      const connection = new Connection(rpcUrl, 'confirmed');

      showSuccess('Fetching accounts...', messageContainer);

      const [accountInfo1, accountInfo2] = await Promise.all([
        connection.getAccountInfo(new PublicKey(address1)),
        connection.getAccountInfo(new PublicKey(address2)),
      ]);

      if (!accountInfo1) {
        showError(`Account 1 (${address1}) not found`, messageContainer);
        resultSection.style.display = 'none';
        return;
      }

      if (!accountInfo2) {
        showError(`Account 2 (${address2}) not found`, messageContainer);
        resultSection.style.display = 'none';
        return;
      }

      account1Data = {
        owner: accountInfo1.owner.toBase58(),
        lamports: accountInfo1.lamports,
        executable: accountInfo1.executable,
        data: accountInfo1.data,
      };

      account2Data = {
        owner: accountInfo2.owner.toBase58(),
        lamports: accountInfo2.lamports,
        executable: accountInfo2.executable,
        data: accountInfo2.data,
      };

      // Update explorer links
      const explorerLink1 = document.getElementById('explorer-link-1') as HTMLAnchorElement;
      const explorerLink2 = document.getElementById('explorer-link-2') as HTMLAnchorElement;
      if (explorerLink1) explorerLink1.href = `https://solscan.io/account/${address1}`;
      if (explorerLink2) explorerLink2.href = `https://solscan.io/account/${address2}`;

      // Set up byte range controls
      const maxLength = Math.max(account1Data.data.length, account2Data.data.length);
      if (endByteEl) {
        endByteEl.max = maxLength.toString();
        endByteEl.value = Math.min(100, maxLength).toString();
      }
      if (startByteEl) {
        startByteEl.value = '0';
        startByteEl.max = maxLength.toString();
      }

      displayAccountInfo();
      displayDataComparison();
      resultSection.style.display = 'block';
      showSuccess('Accounts compared successfully!', messageContainer);
    } catch (error) {
      showError(`Error comparing accounts: ${error instanceof Error ? error.message : 'Unknown error'}`, messageContainer);
      resultSection.style.display = 'none';
    }
  }

  function displayAccountInfo() {
    if (!account1Data || !account2Data) return;

    // Account 1
    document.getElementById('owner-display-1')!.textContent = account1Data.owner;
    document.getElementById('lamports-display-1')!.textContent = account1Data.lamports.toLocaleString();
    document.getElementById('executable-display-1')!.textContent = account1Data.executable ? 'Yes' : 'No';
    document.getElementById('data-size-display-1')!.textContent = `${account1Data.data.length} bytes`;

    // Account 2
    document.getElementById('owner-display-2')!.textContent = account2Data.owner;
    document.getElementById('lamports-display-2')!.textContent = account2Data.lamports.toLocaleString();
    document.getElementById('executable-display-2')!.textContent = account2Data.executable ? 'Yes' : 'No';
    document.getElementById('data-size-display-2')!.textContent = `${account2Data.data.length} bytes`;
  }

  function displayDataComparison() {
    if (!account1Data || !account2Data) return;

    const data1 = account1Data.data;
    const data2 = account2Data.data;

    const startByte = parseInt(startByteEl.value) || 0;
    const endByte = parseInt(endByteEl.value) || Math.max(data1.length, data2.length);

    const maxLength = Math.min(endByte, Math.max(data1.length, data2.length));

    let differenceCount = 0;
    const data1Html: string[] = [];
    const data2Html: string[] = [];

    for (let i = startByte; i < maxLength; i++) {
      const byte1 = i < data1.length ? data1[i] : null;
      const byte2 = i < data2.length ? data2[i] : null;

      const isDifferent = byte1 !== byte2;
      if (isDifferent) differenceCount++;

      // Format byte1
      if (byte1 !== null) {
        const hexByte = byte1.toString(16).padStart(2, '0');
        if (isDifferent) {
          data1Html.push(`<span class="diff-byte" data-index="${i}" title="Byte ${i}">${hexByte}</span>`);
        } else {
          data1Html.push(`<span data-index="${i}" title="Byte ${i}">${hexByte}</span>`);
        }
      } else {
        data1Html.push(`<span class="missing-byte" data-index="${i}" title="Byte ${i}">--</span>`);
      }

      // Format byte2
      if (byte2 !== null) {
        const hexByte = byte2.toString(16).padStart(2, '0');
        if (isDifferent) {
          data2Html.push(`<span class="diff-byte" data-index="${i}" title="Byte ${i}">${hexByte}</span>`);
        } else {
          data2Html.push(`<span data-index="${i}" title="Byte ${i}">${hexByte}</span>`);
        }
      } else {
        data2Html.push(`<span class="missing-byte" data-index="${i}" title="Byte ${i}">--</span>`);
      }
    }

    // Display with spaces between bytes
    const data1Display = document.getElementById('data-display-1') as HTMLPreElement;
    const data2Display = document.getElementById('data-display-2') as HTMLPreElement;
    const comparisonInfo = document.getElementById('comparison-info') as HTMLParagraphElement;

    data1Display.innerHTML = data1Html.join(' ');
    data2Display.innerHTML = data2Html.join(' ');

    const totalBytes = maxLength - startByte;
    const percentDiff = totalBytes > 0 ? ((differenceCount / totalBytes) * 100).toFixed(2) : '0';
    comparisonInfo.textContent = `Showing bytes ${startByte} to ${maxLength}. Found ${differenceCount} different bytes out of ${totalBytes} displayed (${percentDiff}% different)`;
  }

  function showAllBytes() {
    if (!account1Data || !account2Data) return;
    const maxLength = Math.max(account1Data.data.length, account2Data.data.length);
    startByteEl.value = '0';
    endByteEl.value = maxLength.toString();
    displayDataComparison();
  }

  function clear() {
    address1El.value = '';
    address2El.value = '';
    rpcUrlEl.value = '';
    resultSection.style.display = 'none';
    messageContainer.innerHTML = '';
    account1Data = null;
    account2Data = null;
  }

  // Event listeners
  document.getElementById('compare-btn')?.addEventListener('click', compareAccounts);
  document.getElementById('clear-btn')?.addEventListener('click', clear);
  document.getElementById('show-all-btn')?.addEventListener('click', showAllBytes);

  startByteEl?.addEventListener('input', displayDataComparison);
  endByteEl?.addEventListener('input', displayDataComparison);

  // Compare on Enter key
  address1El.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') compareAccounts();
  });

  address2El.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') compareAccounts();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
