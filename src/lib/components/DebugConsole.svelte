<!-- DebugConsole.svelte - シンプルなデバッグコンソール -->
<script lang="ts">
  import { debugMode, debugLogs } from '$lib/stores/debug.js';
  
  let isMinimized = true;
  
  function toggleMinimized() {
    isMinimized = !isMinimized;
  }
</script>

{#if $debugMode}
  <div class="debug-console" class:minimized={isMinimized}>
    <div class="console-header" on:click={toggleMinimized}>
      <span>🐛 Debug Console</span>
      <span class="toggle">{isMinimized ? '📈' : '📉'}</span>
    </div>
    
    {#if !isMinimized}
      <div class="console-content">
        {#each $debugLogs.slice(0, 5) as log}
          <div class="console-line console-{log.level}">
            [{log.timestamp.toLocaleTimeString()}] {log.message}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .debug-console {
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    font-family: monospace;
    font-size: 11px;
    border-radius: 6px;
    border: 1px solid #333;
    max-width: 300px;
    z-index: 9998;
  }
  
  .console-header {
    padding: 6px 10px;
    background: #1a1a1a;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    border-radius: 6px 6px 0 0;
    user-select: none;
  }
  
  .minimized .console-header {
    border-radius: 6px;
  }
  
  .console-content {
    padding: 8px;
    max-height: 150px;
    overflow-y: auto;
  }
  
  .console-line {
    margin-bottom: 2px;
    word-break: break-all;
  }
  
  .console-info {
    color: #00ff00;
  }
  
  .console-warn {
    color: #ffff00;
  }
  
  .console-error {
    color: #ff6666;
  }
  
  .toggle {
    opacity: 0.7;
  }
</style>