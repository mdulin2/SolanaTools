import { PublicKey } from '@solana/web3.js';
import { showError, showSuccess, copyToClipboard } from '../utils/ui';
import { Buffer } from 'buffer';

interface Seed {
  id: number;
  type: 'string' | 'hex' | 'pubkey' | 'u8' | 'u16' | 'u32' | 'u64' | 'u128' | 'i8' | 'i16' | 'i32' | 'i64' | 'i128';
  value: string;
}

let seedCounter = 0;
const seeds: Seed[] = [];

export function initPDADerivationTool() {
  const container = document.getElementById('tool-container');
  if (!container) return;

  // Reset state
  seedCounter = 0;
  seeds.length = 0;

  container.innerHTML = `
    <div class="tool-content">
      <h2>PDA Derivation</h2>
      <p class="tool-description">
        Derive Program Derived Addresses (PDAs) from a program ID and seeds
      </p>

      <div class="form-group">
        <label for="program-id">Program ID</label>
        <input
          type="text"
          id="program-id"
          placeholder="Enter program address (base58)"
          class="input-field"
        />
      </div>

      <div class="seeds-section">
        <div class="seeds-header">
          <label>Seeds</label>
          <button id="add-seed-btn" class="secondary-btn">+ Add Seed</button>
        </div>
        <div id="seeds-container">
          <p class="empty-message">No seeds added yet. Click "Add Seed" to start.</p>
        </div>
      </div>

      <div class="form-group">
        <label for="bump-input">Bump (optional)</label>
        <input
          type="number"
          id="bump-input"
          placeholder=""
          class="input-field small"
          min="0"
          max="255"
        />
        <p class="field-hint">Leave empty to find the canonical bump automatically</p>
      </div>

      <div class="button-group">
        <button id="derive-btn" class="primary-btn">Derive PDA</button>
        <button id="clear-all-btn" class="secondary-btn">Clear All</button>
      </div>

      <div class="result-section" id="result-section" style="display: none;">
        <div class="form-group">
          <label>Derived PDA</label>
          <div class="result-display">
            <input
              type="text"
              id="pda-output"
              readonly
              class="input-field"
            />
            <button id="copy-pda-btn" class="icon-btn" title="Copy PDA">
              📋
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Bump</label>
          <input
            type="text"
            id="bump-output"
            readonly
            class="input-field small"
          />
        </div>
      </div>

      <div id="message-container"></div>
    </div>
  `;

  const programIdEl = document.getElementById('program-id') as HTMLInputElement;
  const bumpInputEl = document.getElementById('bump-input') as HTMLInputElement;
  const seedsContainer = document.getElementById('seeds-container') as HTMLDivElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const pdaOutputEl = document.getElementById('pda-output') as HTMLInputElement;
  const bumpOutputEl = document.getElementById('bump-output') as HTMLInputElement;
  const messageContainer = document.getElementById('message-container') as HTMLDivElement;

  function addSeed() {
    const seed: Seed = {
      id: seedCounter++,
      type: 'string',
      value: '',
    };
    seeds.push(seed);

    renderSeeds();
  }

  function removeSeed(id: number) {
    const index = seeds.findIndex(s => s.id === id);
    if (index !== -1) {
      seeds.splice(index, 1);
      renderSeeds();
    }
  }

  function updateSeedType(id: number, type: Seed['type']) {
    const seed = seeds.find(s => s.id === id);
    if (seed) {
      seed.type = type;
      renderSeeds();
    }
  }

  function updateSeedValue(id: number, value: string) {
    const seed = seeds.find(s => s.id === id);
    if (seed) {
      seed.value = value;
    }
  }

  function renderSeeds() {
    if (seeds.length === 0) {
      seedsContainer.innerHTML = '<p class="empty-message">No seeds added yet. Click "Add Seed" to start.</p>';
      return;
    }

    seedsContainer.innerHTML = seeds.map(seed => `
      <div class="seed-item" data-id="${seed.id}">
        <div class="seed-controls">
          <select class="seed-type-select" data-id="${seed.id}">
            <option value="string" ${seed.type === 'string' ? 'selected' : ''}>String</option>
            <option value="hex" ${seed.type === 'hex' ? 'selected' : ''}>Hex</option>
            <option value="pubkey" ${seed.type === 'pubkey' ? 'selected' : ''}>PublicKey</option>
            <option value="u8" ${seed.type === 'u8' ? 'selected' : ''}>u8</option>
            <option value="u16" ${seed.type === 'u16' ? 'selected' : ''}>u16</option>
            <option value="u32" ${seed.type === 'u32' ? 'selected' : ''}>u32</option>
            <option value="u64" ${seed.type === 'u64' ? 'selected' : ''}>u64</option>
            <option value="u128" ${seed.type === 'u128' ? 'selected' : ''}>u128</option>
            <option value="i8" ${seed.type === 'i8' ? 'selected' : ''}>i8</option>
            <option value="i16" ${seed.type === 'i16' ? 'selected' : ''}>i16</option>
            <option value="i32" ${seed.type === 'i32' ? 'selected' : ''}>i32</option>
            <option value="i64" ${seed.type === 'i64' ? 'selected' : ''}>i64</option>
            <option value="i128" ${seed.type === 'i128' ? 'selected' : ''}>i128</option>
          </select>
          <input
            type="text"
            class="seed-value-input"
            data-id="${seed.id}"
            placeholder="${getSeedPlaceholder(seed.type)}"
            value="${seed.value}"
          />
          <button class="remove-seed-btn" data-id="${seed.id}" title="Remove seed">
            ✕
          </button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    seedsContainer.querySelectorAll('.seed-type-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = parseInt((e.target as HTMLSelectElement).getAttribute('data-id')!);
        const type = (e.target as HTMLSelectElement).value as 'string' | 'hex' | 'pubkey';
        updateSeedType(id, type);
      });
    });

    seedsContainer.querySelectorAll('.seed-value-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = parseInt((e.target as HTMLInputElement).getAttribute('data-id')!);
        const value = (e.target as HTMLInputElement).value;
        updateSeedValue(id, value);
      });
    });

    seedsContainer.querySelectorAll('.remove-seed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt((e.target as HTMLButtonElement).getAttribute('data-id')!);
        removeSeed(id);
      });
    });
  }

  function getSeedPlaceholder(type: string): string {
    switch (type) {
      case 'string':
        return 'Enter string';
      case 'hex':
        return 'Enter hex (0x... or raw hex)';
      case 'pubkey':
        return 'Enter public key (base58)';
      case 'u8':
        return 'Enter number (0-255)';
      case 'u16':
        return 'Enter number (0-65535)';
      case 'u32':
        return 'Enter number (0-4294967295)';
      case 'u64':
        return 'Enter number (0-18446744073709551615)';
      case 'u128':
        return 'Enter number (0-340282366920938463463374607431768211455)';
      case 'i8':
        return 'Enter number (-128 to 127)';
      case 'i16':
        return 'Enter number (-32768 to 32767)';
      case 'i32':
        return 'Enter number (-2147483648 to 2147483647)';
      case 'i64':
        return 'Enter number (-9223372036854775808 to 9223372036854775807)';
      case 'i128':
        return 'Enter number';
      default:
        return '';
    }
  }

  function convertSeedToBuffer(seed: Seed): Buffer {
    switch (seed.type) {
      case 'string':
        return Buffer.from(seed.value, 'utf8');

      case 'hex': {
        const hexStr = seed.value.startsWith('0x') ? seed.value.slice(2) : seed.value;
        if (hexStr.length % 2 !== 0) {
          throw new Error(`Invalid hex in seed: odd length`);
        }
        return Buffer.from(hexStr, 'hex');
      }

      case 'pubkey': {
        const pubkey = new PublicKey(seed.value);
        return pubkey.toBuffer();
      }

      case 'u8': {
        const num = parseInt(seed.value);
        if (isNaN(num) || num < 0 || num > 255) {
          throw new Error(`u8 must be between 0 and 255`);
        }
        const buf = Buffer.allocUnsafe(1);
        buf.writeUInt8(num, 0);
        return buf;
      }

      case 'u16': {
        const num = parseInt(seed.value);
        if (isNaN(num) || num < 0 || num > 65535) {
          throw new Error(`u16 must be between 0 and 65535`);
        }
        const buf = Buffer.allocUnsafe(2);
        buf.writeUInt16LE(num, 0);
        return buf;
      }

      case 'u32': {
        const num = parseInt(seed.value);
        if (isNaN(num) || num < 0 || num > 4294967295) {
          throw new Error(`u32 must be between 0 and 4294967295`);
        }
        const buf = Buffer.allocUnsafe(4);
        buf.writeUInt32LE(num, 0);
        return buf;
      }

      case 'u64': {
        const num = BigInt(seed.value);
        if (num < 0n || num > 18446744073709551615n) {
          throw new Error(`u64 must be between 0 and 18446744073709551615`);
        }
        const buf = Buffer.allocUnsafe(8);
        buf.writeBigUInt64LE(num, 0);
        return buf;
      }

      case 'u128': {
        const num = BigInt(seed.value);
        if (num < 0n || num > 340282366920938463463374607431768211455n) {
          throw new Error(`u128 must be between 0 and 340282366920938463463374607431768211455`);
        }
        const buf = Buffer.allocUnsafe(16);
        // Write as little-endian 128-bit
        buf.writeBigUInt64LE(num & 0xFFFFFFFFFFFFFFFFn, 0);
        buf.writeBigUInt64LE(num >> 64n, 8);
        return buf;
      }

      case 'i8': {
        const num = parseInt(seed.value);
        if (isNaN(num) || num < -128 || num > 127) {
          throw new Error(`i8 must be between -128 and 127`);
        }
        const buf = Buffer.allocUnsafe(1);
        buf.writeInt8(num, 0);
        return buf;
      }

      case 'i16': {
        const num = parseInt(seed.value);
        if (isNaN(num) || num < -32768 || num > 32767) {
          throw new Error(`i16 must be between -32768 and 32767`);
        }
        const buf = Buffer.allocUnsafe(2);
        buf.writeInt16LE(num, 0);
        return buf;
      }

      case 'i32': {
        const num = parseInt(seed.value);
        if (isNaN(num) || num < -2147483648 || num > 2147483647) {
          throw new Error(`i32 must be between -2147483648 and 2147483647`);
        }
        const buf = Buffer.allocUnsafe(4);
        buf.writeInt32LE(num, 0);
        return buf;
      }

      case 'i64': {
        const num = BigInt(seed.value);
        if (num < -9223372036854775808n || num > 9223372036854775807n) {
          throw new Error(`i64 must be between -9223372036854775808 and 9223372036854775807`);
        }
        const buf = Buffer.allocUnsafe(8);
        buf.writeBigInt64LE(num, 0);
        return buf;
      }

      case 'i128': {
        const num = BigInt(seed.value);
        const min = -170141183460469231731687303715884105728n;
        const max = 170141183460469231731687303715884105727n;
        if (num < min || num > max) {
          throw new Error(`i128 must be between ${min} and ${max}`);
        }
        const buf = Buffer.allocUnsafe(16);
        // Convert to unsigned for writing
        const unsigned = num < 0n ? (1n << 128n) + num : num;
        buf.writeBigUInt64LE(unsigned & 0xFFFFFFFFFFFFFFFFn, 0);
        buf.writeBigUInt64LE(unsigned >> 64n, 8);
        return buf;
      }

      default:
        throw new Error(`Unknown seed type: ${seed.type}`);
    }
  }

  async function derivePDA() {
    try {
      // Validate program ID
      const programIdStr = programIdEl.value.trim();
      if (!programIdStr) {
        showError('Please enter a program ID', messageContainer);
        return;
      }

      const programId = new PublicKey(programIdStr);

      // Validate seeds
      if (seeds.length === 0) {
        showError('Please add at least one seed', messageContainer);
        return;
      }

      // Convert seeds to buffers
      const seedBuffers: Buffer[] = [];
      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        if (!seed.value.trim()) {
          showError(`Seed ${i + 1} is empty`, messageContainer);
          return;
        }

        try {
          const buffer = convertSeedToBuffer(seed);
          seedBuffers.push(buffer);
        } catch (error) {
          showError(`Error in seed ${i + 1}: ${error instanceof Error ? error.message : 'Invalid value'}`, messageContainer);
          return;
        }
      }

      // Derive PDA
      let pda: PublicKey;
      let bump: number;

      const bumpInputValue = bumpInputEl.value.trim();
      if (bumpInputValue !== '') {
        // Use custom bump
        const customBump = parseInt(bumpInputValue);
        if (isNaN(customBump) || customBump < 0 || customBump > 255) {
          showError('Bump must be a number between 0 and 255', messageContainer);
          return;
        }

        // Create PDA with custom bump by adding bump to seeds
        const seedsWithBump = [...seedBuffers, Buffer.from([customBump])];
        try {
          pda = await PublicKey.createProgramAddress(seedsWithBump, programId);
          bump = customBump;
        } catch (error) {
          showError(`Invalid PDA with bump ${customBump}: ${error instanceof Error ? error.message : 'Invalid combination'}`, messageContainer);
          return;
        }
      } else {
        // Find canonical bump
        [pda, bump] = PublicKey.findProgramAddressSync(seedBuffers, programId);
      }

      pdaOutputEl.value = pda.toBase58();
      bumpOutputEl.value = bump.toString();
      resultSection.style.display = 'block';

      showSuccess('PDA derived successfully!', messageContainer);
    } catch (error) {
      showError(`Derivation error: ${error instanceof Error ? error.message : 'Unknown error'}`, messageContainer);
      resultSection.style.display = 'none';
    }
  }

  function clearAll() {
    programIdEl.value = '';
    bumpInputEl.value = '';
    seeds.length = 0;
    seedCounter = 0;
    renderSeeds();
    resultSection.style.display = 'none';
    messageContainer.innerHTML = '';
  }

  async function copyPDA() {
    const success = await copyToClipboard(pdaOutputEl.value);
    if (success) {
      showSuccess('PDA copied to clipboard!', messageContainer);
    } else {
      showError('Failed to copy to clipboard', messageContainer);
    }
  }

  // Event listeners
  document.getElementById('add-seed-btn')?.addEventListener('click', addSeed);
  document.getElementById('derive-btn')?.addEventListener('click', derivePDA);
  document.getElementById('clear-all-btn')?.addEventListener('click', clearAll);
  document.getElementById('copy-pda-btn')?.addEventListener('click', copyPDA);

  // Initialize with empty seeds
  renderSeeds();
}
