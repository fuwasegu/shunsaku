<!-- DebugPanel.svelte - デバッグ情報表示パネル -->
<script lang="ts">
  import { debugMode, debugLogs, getDebugInfo, addDebugLog } from '$lib/stores/debug.js';
  import { onMount } from 'svelte';
  
  let isExpanded = false;
  let debugInfo: any = null;
  
  onMount(() => {
    debugInfo = getDebugInfo();
    addDebugLog('info', 'DebugPanel初期化完了');
  });
  
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
  
  function clearLogs() {
    debugLogs.set([]);
    addDebugLog('info', 'デバッグログをクリアしました');
  }
  
  function copyDebugInfo() {
    if (debugInfo) {
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      addDebugLog('info', 'デバッグ情報をクリップボードにコピーしました');
    }
  }
</script>

{#if $debugMode}
  <div class="debug-panel">
    <div class="debug-header" on:click={toggleExpanded}>
      <span class="debug-title">🔧 Debug Panel</span>
      <span class="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
    </div>
    
    {#if isExpanded}
      <div class="debug-content">
        <!-- デバッグ情報サマリー -->
        <div class="debug-section">
          <h4>📱 環境情報</h4>
          {#if debugInfo}
            <div class="info-grid">
              <div class="info-item">
                <span class="label">環境:</span>
                <span class="value">{debugInfo.isPCEnvironment ? 'PC' : 'Mobile'}</span>
              </div>
              <div class="info-item">
                <span class="label">画面:</span>
                <span class="value">{debugInfo.screenInfo.width}×{debugInfo.screenInfo.height}</span>
              </div>
              <div class="info-item">
                <span class="label">DeviceMotion:</span>
                <span class="value">{debugInfo.supportInfo.deviceMotion ? '✅' : '❌'}</span>
              </div>
              <div class="info-item">
                <span class="label">Permission:</span>
                <span class="value">{debugInfo.supportInfo.requestPermission ? '要求必要' : '不要'}</span>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- アクションボタン -->
        <div class="debug-actions">
          <button class="debug-btn" on:click={clearLogs}>
            🗑️ ログクリア
          </button>
          <button class="debug-btn" on:click={copyDebugInfo}>
            📋 情報コピー
          </button>
        </div>
        
        <!-- ログ表示 -->
        <div class="debug-section">
          <h4>📝 デバッグログ ({$debugLogs.length})</h4>
          <div class="log-container">
            {#each $debugLogs.slice(0, 10) as log}
              <div class="log-entry log-{log.level}">
                <span class="log-time">{log.timestamp.toLocaleTimeString()}</span>
                <span class="log-level">[{log.level.toUpperCase()}]</span>
                <span class="log-message">{log.message}</span>
                {#if log.data}
                  <details class="log-data">
                    <summary>詳細</summary>
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </details>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .debug-panel {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    max-width: 400px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .debug-header {
    padding: 8px 12px;
    background: #1a1a1a;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
    user-select: none;
  }
  
  .debug-header:hover {
    background: #2a2a2a;
  }
  
  .debug-title {
    font-weight: bold;
  }
  
  .toggle-icon {
    color: #888;
    transition: transform 0.2s;
  }
  
  .debug-content {
    padding: 12px;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .debug-section {
    margin-bottom: 16px;
  }
  
  .debug-section h4 {
    margin: 0 0 8px 0;
    color: #ffff00;
    font-size: 14px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 2px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .label {
    color: #888;
  }
  
  .value {
    color: #00ff00;
    font-weight: bold;
  }
  
  .debug-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .debug-btn {
    background: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
  }
  
  .debug-btn:hover {
    background: #444;
  }
  
  .log-container {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #333;
    border-radius: 4px;
  }
  
  .log-entry {
    padding: 4px 8px;
    border-bottom: 1px solid #222;
    word-wrap: break-word;
  }
  
  .log-entry:last-child {
    border-bottom: none;
  }
  
  .log-info {
    background: rgba(0, 255, 0, 0.1);
  }
  
  .log-warn {
    background: rgba(255, 255, 0, 0.1);
    color: #ffff00;
  }
  
  .log-error {
    background: rgba(255, 0, 0, 0.1);
    color: #ff6666;
  }
  
  .log-time {
    color: #888;
    font-size: 10px;
  }
  
  .log-level {
    color: #fff;
    font-weight: bold;
    margin: 0 4px;
  }
  
  .log-message {
    color: inherit;
  }
  
  .log-data {
    margin-top: 4px;
  }
  
  .log-data summary {
    cursor: pointer;
    color: #888;
    font-size: 10px;
  }
  
  .log-data pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 4px;
    font-size: 10px;
    overflow-x: auto;
    margin: 4px 0 0 0;
  }
  
  /* モバイル対応 */
  @media (max-width: 600px) {
    .debug-panel {
      max-width: calc(100vw - 20px);
      font-size: 11px;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>