import { PublicKey, Connection } from '@solana/web3.js';
import { initNavigation } from '../components/nav';
import { showError, showSuccess } from '../utils/ui';

const RPC_ENDPOINT = 'https://solana.drpc.org/';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

interface AccountData {
  owner: string;
  lamports: number;
  executable: boolean;
  data: Uint8Array;
}

interface TokenAccountData {
  mint: string;
  owner: string;
  amount: bigint;
  delegate: string | null;
  state: string;
  isNative: bigint | null;
  delegatedAmount: bigint;
  closeAuthority: string | null;
}

let currentAccountData: AccountData | null = null;

function init() {
  initNavigation('account-viewer');

  const accountAddressEl = document.getElementById('account-address') as HTMLInputElement;
  const rpcUrlEl = document.getElementById('rpc-url') as HTMLInputElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const messageContainer = document.getElementById('message-container') as HTMLDivElement;
  const explorerLink = document.getElementById('explorer-link') as HTMLAnchorElement;
  const ownerDisplay = document.getElementById('owner-display') as HTMLElement;
  const lamportsDisplay = document.getElementById('lamports-display') as HTMLElement;
  const executableDisplay = document.getElementById('executable-display') as HTMLElement;
  const dataPreview = document.getElementById('data-preview') as HTMLPreElement;
  const dataInfo = document.getElementById('data-info') as HTMLDivElement;
  const rawDataDisplay = document.getElementById('raw-data-display') as HTMLPreElement;
  const startByteEl = document.getElementById('start-byte') as HTMLInputElement;
  const endByteEl = document.getElementById('end-byte') as HTMLInputElement;

  if (!accountAddressEl || !resultSection || !messageContainer) {
    console.error('Required elements not found');
    return;
  }

  async function fetchTokenMetadata(mintAddress: string) {
    try {
      const rpcUrl = rpcUrlEl.value.trim() || RPC_ENDPOINT;
      const connection = new Connection(rpcUrl, 'confirmed');

      // Fetch mint account to get decimals
      const mintPubkey = new PublicKey(mintAddress);
      const mintAccount = await connection.getAccountInfo(mintPubkey);
      let decimals = 'N/A';
      if (mintAccount) {
        // Decimals is at byte 44 for SPL Token mints
        decimals = mintAccount.data[44].toString();
      }

      // Derive the metadata PDA
      const metadataProgramId = new PublicKey(METADATA_PROGRAM_ID);

      // Use TextEncoder for browser compatibility
      const textEncoder = new TextEncoder();
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          textEncoder.encode('metadata'),
          metadataProgramId.toBytes(),
          mintPubkey.toBytes(),
        ],
        metadataProgramId
      );

      console.log('Metadata PDA:', metadataPDA.toBase58());
      console.log('Mint:', mintAddress);

      const metadataAccount = await connection.getAccountInfo(metadataPDA);

      if (!metadataAccount) {
        console.log('No metadata account found for this token');
        return;
      }

      console.log('Metadata account data length:', metadataAccount.data.length);

      // Parse metadata - Metaplex uses Borsh serialization
      const data = metadataAccount.data;
      const textDecoder = new TextDecoder();

      // Skip the first byte (key discriminator)
      let offset = 1;

      // Parse update authority (32 bytes)
      const updateAuthorityBytes = data.subarray(offset, offset + 32);
      const updateAuthority = new PublicKey(updateAuthorityBytes).toBase58();
      offset += 32;

      // Skip mint (32 bytes)
      offset += 32;

      // Parse name (u32 length + string bytes)
      const nameLength = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
      offset += 4;
      const nameBytes = data.subarray(offset, offset + nameLength);
      const name = textDecoder.decode(nameBytes).replace(/\0/g, '').trim();
      offset += nameLength;

      // Parse symbol (u32 length + string bytes)
      const symbolLength = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
      offset += 4;
      const symbolBytes = data.subarray(offset, offset + symbolLength);
      const symbol = textDecoder.decode(symbolBytes).replace(/\0/g, '').trim();
      offset += symbolLength;

      // Parse URI (u32 length + string bytes)
      const uriLength = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
      offset += 4;
      const uriBytes = data.subarray(offset, offset + uriLength);
      const uri = textDecoder.decode(uriBytes).replace(/\0/g, '').trim();

      console.log('Parsed metadata:', { name, symbol, uri, updateAuthority, decimals });

      // Display metadata
      const metadataSection = document.getElementById('token-metadata-section');
      if (metadataSection) {
        document.getElementById('token-name-display')!.textContent = name || 'N/A';
        document.getElementById('token-symbol-display')!.textContent = symbol || 'N/A';
        document.getElementById('token-decimals-display')!.textContent = decimals;
        document.getElementById('token-uri-display')!.textContent = uri || 'N/A';
        document.getElementById('token-update-authority-display')!.textContent = updateAuthority;
        metadataSection.style.display = 'block';
      }
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      // Hide metadata section if there's an error
      const metadataSection = document.getElementById('token-metadata-section');
      if (metadataSection) {
        metadataSection.style.display = 'none';
      }
    }
  }

  async function fetchAccount() {
    const address = accountAddressEl.value.trim();
    if (!address) {
      showError('Please enter an account address', messageContainer);
      return;
    }

    try {
      const pubkey = new PublicKey(address);
      const rpcUrl = rpcUrlEl.value.trim() || RPC_ENDPOINT;
      const connection = new Connection(rpcUrl, 'confirmed');

      showSuccess('Fetching account data...', messageContainer);

      const accountInfo = await connection.getAccountInfo(pubkey);

      if (!accountInfo) {
        showError('Account not found', messageContainer);
        resultSection.style.display = 'none';
        return;
      }

      currentAccountData = {
        owner: accountInfo.owner.toBase58(),
        lamports: accountInfo.lamports,
        executable: accountInfo.executable,
        data: accountInfo.data,
      };

      // Update explorer link
      if (explorerLink) {
        explorerLink.href = `https://solscan.io/account/${address}`;
      }

      // Hide metadata section initially
      const metadataSection = document.getElementById('token-metadata-section');
      if (metadataSection) {
        metadataSection.style.display = 'none';
      }

      displayAccountInfo();
      showSuccess('Account data loaded successfully!', messageContainer);
    } catch (error) {
      showError(`Error fetching account: ${error instanceof Error ? error.message : 'Unknown error'}`, messageContainer);
      resultSection.style.display = 'none';
    }
  }

  function parseTokenAccount(data: Uint8Array): TokenAccountData | null {
    try {
      if (data.length < 165) return null; // Token account must be at least 165 bytes

      // Parse mint (bytes 0-31)
      const mint = new PublicKey(data.slice(0, 32)).toBase58();

      // Parse owner (bytes 32-63)
      const owner = new PublicKey(data.slice(32, 64)).toBase58();

      // Parse amount (bytes 64-71) - little endian u64
      const amountBytes = data.slice(64, 72);
      const amount = new DataView(amountBytes.buffer, amountBytes.byteOffset, 8).getBigUint64(0, true);

      // Parse delegate option (byte 72)
      const hasDelegateOption = data[72] === 1;
      const delegate = hasDelegateOption ? new PublicKey(data.slice(73, 105)).toBase58() : null;

      // Parse state (byte 105)
      const stateValue = data[105];
      const state = stateValue === 0 ? 'Uninitialized' : stateValue === 1 ? 'Initialized' : 'Frozen';

      // Parse isNative option (byte 106)
      const hasIsNativeOption = data[106] === 1;
      const isNative = hasIsNativeOption ? new DataView(data.slice(107, 115).buffer, data.slice(107, 115).byteOffset, 8).getBigUint64(0, true) : null;

      // Parse delegated amount (bytes 119-126)
      const delegatedAmountBytes = data.slice(119, 127);
      const delegatedAmount = new DataView(delegatedAmountBytes.buffer, delegatedAmountBytes.byteOffset, 8).getBigUint64(0, true);

      // Parse close authority option (byte 127)
      const hasCloseAuthorityOption = data[127] === 1;
      const closeAuthority = hasCloseAuthorityOption ? new PublicKey(data.slice(128, 160)).toBase58() : null;

      return {
        mint,
        owner,
        amount,
        delegate,
        state,
        isNative,
        delegatedAmount,
        closeAuthority,
      };
    } catch (error) {
      console.error('Error parsing token account:', error);
      return null;
    }
  }

  function displayAccountInfo() {
    if (!currentAccountData) return;

    ownerDisplay.textContent = currentAccountData.owner;
    lamportsDisplay.textContent = currentAccountData.lamports.toLocaleString();
    executableDisplay.textContent = currentAccountData.executable ? 'Yes' : 'No';
    document.getElementById('data-size-display')!.textContent = `${currentAccountData.data.length} bytes`;

    // Check if it's a token account
    let isTokenAccount = false;
    if (currentAccountData.owner === TOKEN_PROGRAM_ID) {
      isTokenAccount = true;
    } else if (currentAccountData.owner === TOKEN_2022_PROGRAM_ID) {
      isTokenAccount = true;
    }

    // Parse and display token account data if it's a token account
    const tokenInfoSection = document.getElementById('token-info-section');
    const tokenInfoHeader = document.getElementById('token-info-header');
    if (isTokenAccount && tokenInfoSection) {
      const tokenData = parseTokenAccount(currentAccountData.data);
      if (tokenData) {
        // Set header based on token type
        if (tokenInfoHeader) {
          if (currentAccountData.owner === TOKEN_PROGRAM_ID) {
            tokenInfoHeader.textContent = 'SPL Token Account Information';
          } else if (currentAccountData.owner === TOKEN_2022_PROGRAM_ID) {
            tokenInfoHeader.textContent = 'Token2022 Account Information';
          }
        }

        document.getElementById('token-mint-display')!.textContent = tokenData.mint;
        document.getElementById('token-owner-display')!.textContent = tokenData.owner;
        document.getElementById('token-amount-display')!.textContent = tokenData.amount.toString();
        document.getElementById('token-delegate-display')!.textContent = tokenData.delegate || 'None';
        document.getElementById('token-delegated-amount-display')!.textContent = tokenData.delegatedAmount.toString();
        document.getElementById('token-is-native-display')!.textContent = tokenData.isNative !== null ? 'Yes' : 'No';
        tokenInfoSection.style.display = 'block';

        // Fetch Metaplex metadata for SPL tokens and Token2022
        fetchTokenMetadata(tokenData.mint);
      } else {
        tokenInfoSection.style.display = 'none';
      }
    } else if (tokenInfoSection) {
      tokenInfoSection.style.display = 'none';
    }

    // Show discriminator button only for non-executable accounts not owned by system program
    const discriminatorBtn = document.getElementById('show-discriminator-btn');
    if (discriminatorBtn) {
      const shouldShowDiscriminator = !currentAccountData.executable &&
                                       currentAccountData.owner !== SYSTEM_PROGRAM_ID;
      discriminatorBtn.style.display = shouldShowDiscriminator ? 'inline-block' : 'none';
    }

    // Set end byte to data length
    endByteEl.max = currentAccountData.data.length.toString();
    endByteEl.value = Math.min(100, currentAccountData.data.length).toString();

    updateDataDisplay();
    resultSection.style.display = 'block';
  }

  function updateDataDisplay() {
    if (!currentAccountData) return;

    const startByte = parseInt(startByteEl.value) || 0;
    const endByte = parseInt(endByteEl.value) || currentAccountData.data.length;

    const displayMode = (document.querySelector('input[name="display-mode"]:checked') as HTMLInputElement)?.value || 'spaced';

    const slicedData = currentAccountData.data.slice(startByte, Math.min(endByte, currentAccountData.data.length));

    // Build HTML with tooltips for the sliced data
    const htmlParts: string[] = [];
    for (let i = 0; i < slicedData.length; i++) {
      const byteIndex = startByte + i;
      const hexByte = slicedData[i].toString(16).padStart(2, '0');
      htmlParts.push(`<span data-index="${byteIndex}">${hexByte}</span>`);
    }

    let hexString: string;
    if (displayMode === 'spaced') {
      hexString = htmlParts.join(' ');
    } else {
      hexString = htmlParts.join('');
    }

    dataPreview.innerHTML = hexString;
    dataInfo.textContent = `Showing bytes ${startByte} to ${Math.min(endByte, currentAccountData.data.length)} (${slicedData.length} bytes) of ${currentAccountData.data.length} total`;

    // Update full raw data with tooltips
    const fullHexParts: string[] = [];
    for (let i = 0; i < currentAccountData.data.length; i++) {
      const hexByte = currentAccountData.data[i].toString(16).padStart(2, '0');
      fullHexParts.push(`<span data-index="${i}">${hexByte}</span>`);
    }
    rawDataDisplay.innerHTML = fullHexParts.join(' ');
  }

  function showAllBytes() {
    if (!currentAccountData) return;
    startByteEl.value = '0';
    endByteEl.value = currentAccountData.data.length.toString();
    updateDataDisplay();
  }

  function showDiscriminator() {
    if (!currentAccountData) return;
    startByteEl.value = '0';
    endByteEl.value = '8';
    updateDataDisplay();
  }

  function clear() {
    accountAddressEl.value = '';
    rpcUrlEl.value = '';
    resultSection.style.display = 'none';
    messageContainer.innerHTML = '';
    currentAccountData = null;
    rawDataDisplay.style.display = 'none';
    const toggleBtn = document.getElementById('toggle-raw-btn');
    if (toggleBtn) {
      toggleBtn.textContent = 'Show Full Raw Data';
    }
    // Hide metadata section
    const metadataSection = document.getElementById('token-metadata-section');
    if (metadataSection) {
      metadataSection.style.display = 'none';
    }
  }

  function toggleRawData() {
    const isVisible = rawDataDisplay.style.display !== 'none';
    rawDataDisplay.style.display = isVisible ? 'none' : 'block';
    const toggleBtn = document.getElementById('toggle-raw-btn');
    if (toggleBtn) {
      toggleBtn.textContent = isVisible ? 'Show Full Raw Data' : 'Hide Full Raw Data';
    }
  }

  // Event listeners
  document.getElementById('fetch-btn')?.addEventListener('click', fetchAccount);
  document.getElementById('clear-btn')?.addEventListener('click', clear);
  document.getElementById('show-discriminator-btn')?.addEventListener('click', showDiscriminator);
  document.getElementById('show-all-btn')?.addEventListener('click', showAllBytes);
  document.getElementById('toggle-raw-btn')?.addEventListener('click', toggleRawData);

  startByteEl?.addEventListener('input', updateDataDisplay);
  endByteEl?.addEventListener('input', updateDataDisplay);

  document.querySelectorAll('input[name="display-mode"]').forEach(radio => {
    radio.addEventListener('change', updateDataDisplay);
  });

  // Fetch on Enter key
  accountAddressEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      fetchAccount();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
