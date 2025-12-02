import { initHexBase58Tool } from './tools/hex-base58';
import { initPDADerivationTool } from './tools/pda-derivation';
import { initDocumentationTool } from './tools/documentation';

type ToolName = 'hex-base58' | 'pda' | 'docs';

const tools: Record<ToolName, () => void> = {
  'hex-base58': initHexBase58Tool,
  'pda': initPDADerivationTool,
  'docs': initDocumentationTool,
};

function switchTool(toolName: ToolName) {
  const container = document.getElementById('tool-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  // Update active button
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`[data-tool="${toolName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Initialize the selected tool
  tools[toolName]();
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Set up navigation
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const toolName = (e.target as HTMLElement).getAttribute('data-tool') as ToolName;
      if (toolName) {
        switchTool(toolName);
      }
    });
  });

  // Load first tool by default
  switchTool('hex-base58');
});
