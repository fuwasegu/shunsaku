<script lang="ts">
	import { debugLogs, clearDebugLogs } from '$lib/stores/debug.js';
	import { onMount } from 'svelte';

	let isExpanded = false;
	let logContainer: HTMLDivElement;
	let autoScroll = true;

	// ログが更新されたら自動スクロール
	$: if ($debugLogs && autoScroll && logContainer) {
		setTimeout(() => {
			logContainer.scrollTop = logContainer.scrollHeight;
		}, 0);
	}

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('ja-JP', { 
			hour12: false
		});
	}

	function getLogIcon(level: string): string {
		switch (level) {
			case 'error': return '❌';
			case 'warn': return '⚠️';
			case 'info': return 'ℹ️';
			default: return '📝';
		}
	}

	function getLogColorClass(level: string): string {
		switch (level) {
			case 'error': return 'text-red-600';
			case 'warn': return 'text-yellow-600';
			case 'info': return 'text-blue-600';
			default: return 'text-gray-600';
		}
	}

	function exportLogs() {
		const logText = $debugLogs
			.map(log => `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`)
			.join('\n\n');
		
		const blob = new Blob([logText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="debug-console">
	<div 
		class="debug-header" 
		on:click={() => isExpanded = !isExpanded}
		on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') isExpanded = !isExpanded }}
		role="button"
		tabindex="0"
	>
		<div class="debug-title">
			<span class="debug-icon">🐛</span>
			<span>デバッグコンソール</span>
			<span class="debug-count">({$debugLogs.length})</span>
		</div>
		<div class="debug-controls">
			{#if isExpanded}
				<button 
					class="debug-btn debug-btn--small"
					on:click|stopPropagation={clearDebugLogs}
					title="ログをクリア"
				>
					🗑️
				</button>
				<button 
					class="debug-btn debug-btn--small"
					on:click|stopPropagation={exportLogs}
					title="ログをエクスポート"
				>
					💾
				</button>
				<button 
					class="debug-btn debug-btn--small"
					on:click|stopPropagation={() => autoScroll = !autoScroll}
					title="自動スクロール"
					class:active={autoScroll}
				>
					📜
				</button>
			{/if}
			<span class="debug-toggle">
				{isExpanded ? '▼' : '▶'}
			</span>
		</div>
	</div>

	{#if isExpanded}
		<div class="debug-content">
			<div class="debug-logs" bind:this={logContainer}>
				{#each $debugLogs as log, index (log.timestamp)}
					<div class="debug-log debug-log--{log.level}">
						<div class="debug-log-header">
							<span class="debug-log-icon">{getLogIcon(log.level)}</span>
							<span class="debug-log-time">{formatTimestamp(log.timestamp)}</span>
							<span class="debug-log-level {getLogColorClass(log.level)}">
								{log.level.toUpperCase()}
							</span>
						</div>
						<div class="debug-log-message">
							{log.message}
						</div>
						{#if log.data}
							<details class="debug-log-data">
								<summary>データを表示</summary>
								<pre>{JSON.stringify(log.data, null, 2)}</pre>
							</details>
						{/if}
					</div>
				{:else}
					<div class="debug-empty">
						<span>📝</span>
						<p>ログがありません</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.debug-console {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 1000;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		font-family: 'Courier New', monospace;
		font-size: 12px;
		max-width: 90vw;
		max-height: 70vh;
	}

	.debug-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		cursor: pointer;
		user-select: none;
	}

	.debug-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: bold;
		color: #374151;
	}

	.debug-icon {
		font-size: 16px;
	}

	.debug-count {
		color: #6b7280;
		font-weight: normal;
	}

	.debug-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.debug-btn {
		background: none;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		padding: 4px 8px;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s;
	}

	.debug-btn:hover {
		background: #f3f4f6;
	}

	.debug-btn.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.debug-btn--small {
		padding: 2px 6px;
		font-size: 10px;
	}

	.debug-toggle {
		color: #6b7280;
		margin-left: 8px;
	}

	.debug-content {
		width: 100%;
		min-width: 400px;
	}

	.debug-logs {
		max-height: 300px;
		overflow-y: auto;
		padding: 8px;
	}

	.debug-log {
		margin-bottom: 8px;
		padding: 8px;
		border-left: 3px solid #e5e7eb;
		background: #f9fafb;
		border-radius: 4px;
	}

	.debug-log--error {
		border-left-color: #ef4444;
		background: #fef2f2;
	}

	.debug-log--warn {
		border-left-color: #f59e0b;
		background: #fffbeb;
	}

	.debug-log--info {
		border-left-color: #3b82f6;
		background: #eff6ff;
	}

	.debug-log-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.debug-log-icon {
		font-size: 12px;
	}

	.debug-log-time {
		color: #6b7280;
		font-size: 10px;
	}

	.debug-log-level {
		font-weight: bold;
		font-size: 10px;
	}

	.debug-log-message {
		color: #374151;
		line-height: 1.4;
		margin-bottom: 4px;
	}

	.debug-log-data {
		margin-top: 8px;
	}

	.debug-log-data summary {
		cursor: pointer;
		color: #6b7280;
		font-size: 10px;
		margin-bottom: 4px;
	}

	.debug-log-data pre {
		background: #f3f4f6;
		padding: 8px;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 10px;
		color: #374151;
		max-height: 150px;
		overflow-y: auto;
	}

	.debug-empty {
		text-align: center;
		padding: 32px 16px;
		color: #6b7280;
	}

	.debug-empty span {
		font-size: 24px;
		display: block;
		margin-bottom: 8px;
	}

	@media (max-width: 640px) {
		.debug-console {
			bottom: 10px;
			left: 10px;
			right: 10px;
			max-width: none;
		}
		
		.debug-content {
			min-width: auto;
		}
		
		.debug-logs {
			max-height: 200px;
		}
	}
</style>