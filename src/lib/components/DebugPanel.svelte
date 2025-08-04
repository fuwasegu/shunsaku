<script lang="ts">
	import { debugMode, addDebugLog } from '$lib/stores/debug.js';
	import { mockSwingPresets } from '$lib/sensors/mock-motion-generator.js';
	import type MotionDetector from '$lib/sensors/motion-detector.js';
	import { onMount } from 'svelte';

	export let motionDetector: MotionDetector | null = null;
	export let onMockSwingGenerated: ((swingData: any) => void) | null = null;
	
	onMount(() => {
		console.log('DebugPanel mounted');
		console.log('motionDetector:', motionDetector);
		console.log('debugMode:', $debugMode);
	});

	let selectedPreset: keyof typeof mockSwingPresets = 'intermediate';

	function toggleDebugMode() {
		debugMode.update((current: boolean) => !current);
		if (motionDetector) {
			motionDetector.setDebugMode(!motionDetector.getDebugMode());
		}
		addDebugLog('info', `デバッグモード${$debugMode ? '有効' : '無効'}に切り替え`);
	}

	function generateMockSwing() {
		console.log('generateMockSwing called');
		console.log('motionDetector:', motionDetector);
		console.log('selectedPreset:', selectedPreset);
		
		if (!motionDetector) {
			console.error('MotionDetectorが初期化されていません');
			addDebugLog('error', 'MotionDetectorが初期化されていません');
			return;
		}

		try {
			const swingData = motionDetector.generateMockSwing(selectedPreset);
			console.log('Generated swing data:', swingData);
			addDebugLog('info', `モックスイング生成: ${selectedPreset}`);
			
			if (onMockSwingGenerated) {
				onMockSwingGenerated(swingData);
			}
		} catch (error) {
			console.error('モックスイング生成エラー:', error);
			addDebugLog('error', 'モックスイング生成エラー', error);
		}
	}

	function testErrorLogging() {
		addDebugLog('info', 'テスト情報ログ');
		addDebugLog('warn', 'テスト警告ログ');
		addDebugLog('error', 'テストエラーログ', { testData: 'サンプルデータ' });
	}

	function simulatePermissionError() {
		addDebugLog('error', 'センサー権限エラーをシミュレート', {
			error: 'NotAllowedError',
			message: 'User denied permission'
		});
	}

	function simulateSwingDetection() {
		if (!motionDetector) return;
		
		addDebugLog('info', 'スイング検出シミュレーション開始');
		
		// 複数のセンサー読み取り値をシミュレート
		for (let i = 0; i < 5; i++) {
			setTimeout(() => {
				addDebugLog('info', `スイングデータ取得`, {
					gyro: { x: Math.random() * 20, y: Math.random() * 20, z: Math.random() * 20 },
					accel: { x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 },
					timestamp: Date.now()
				});
			}, i * 100);
		}
		
		setTimeout(() => {
			addDebugLog('info', 'スイング検出完了');
		}, 600);
	}
</script>

<div class="debug-panel">
	<div class="debug-panel-header">
		<h3>🛠️ デバッグパネル</h3>
		<label class="debug-toggle-switch">
			<input 
				type="checkbox" 
				bind:checked={$debugMode}
				on:change={toggleDebugMode}
			>
			<span class="slider"></span>
			デバッグモード
		</label>
	</div>

	{#if $debugMode}
		<div class="debug-panel-content">
			<!-- モックスイング生成 -->
			<div class="debug-section">
				<h4>📊 モックデータ生成</h4>
				<div class="debug-form-group">
					<label for="preset-select">スイングプリセット:</label>
					<select id="preset-select" bind:value={selectedPreset}>
						{#each Object.entries(mockSwingPresets) as [key, preset]}
							<option value={key}>
								{key} ({preset.swingPattern}, {preset.duration}ms)
							</option>
						{/each}
					</select>
				</div>
				<button class="debug-btn debug-btn--primary" on:click={generateMockSwing}>
					🎯 モックスイング生成
				</button>
			</div>

			<!-- デバッグテスト -->
			<div class="debug-section">
				<h4>🧪 デバッグテスト</h4>
				<div class="debug-btn-group">
					<button class="debug-btn debug-btn--secondary" on:click={testErrorLogging}>
						📝 ログテスト
					</button>
					<button class="debug-btn debug-btn--warning" on:click={simulatePermissionError}>
						⚠️ 権限エラー
					</button>
					<button class="debug-btn debug-btn--info" on:click={simulateSwingDetection}>
						🏌️ スイング検出
					</button>
				</div>
			</div>

			<!-- システム情報 -->
			<div class="debug-section">
				<h4>ℹ️ システム情報</h4>
				<div class="debug-info">
					<div class="debug-info-item">
						<span class="label">User Agent:</span>
						<span class="value">{navigator.userAgent.substring(0, 50)}...</span>
					</div>
					<div class="debug-info-item">
						<span class="label">DeviceMotionEvent:</span>
						<span class="value">{typeof DeviceMotionEvent !== 'undefined' ? '✅ サポート' : '❌ 未サポート'}</span>
					</div>
					<div class="debug-info-item">
						<span class="label">画面サイズ:</span>
						<span class="value">{window.innerWidth} × {window.innerHeight}</span>
					</div>
					{#if motionDetector}
						<div class="debug-info-item">
							<span class="label">記録中:</span>
							<span class="value">{motionDetector.getIsRecording() ? '🔴 記録中' : '⚫ 停止中'}</span>
						</div>
						<div class="debug-info-item">
							<span class="label">データ数:</span>
							<span class="value">{motionDetector.getReadingsCount()} 件</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="debug-panel-collapsed">
			<p>デバッグモードを有効にすると詳細情報が表示されます</p>
		</div>
	{/if}
</div>

<style>
	.debug-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		margin: 16px 0;
		overflow: hidden;
		font-family: 'Courier New', monospace;
		font-size: 13px;
	}

	.debug-panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.debug-panel-header h3 {
		margin: 0;
		color: #374151;
		font-size: 14px;
		font-weight: bold;
	}

	.debug-toggle-switch {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 12px;
		color: #6b7280;
	}

	.debug-toggle-switch input {
		position: relative;
		width: 40px;
		height: 20px;
		appearance: none;
		background: #d1d5db;
		border-radius: 10px;
		transition: background 0.3s;
	}

	.debug-toggle-switch input:checked {
		background: #3b82f6;
	}

	.debug-toggle-switch input::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: white;
		border-radius: 50%;
		transition: left 0.3s;
	}

	.debug-toggle-switch input:checked::before {
		left: 22px;
	}

	.debug-panel-content {
		padding: 16px;
	}

	.debug-panel-collapsed {
		padding: 16px;
		text-align: center;
		color: #6b7280;
	}

	.debug-section {
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid #f3f4f6;
	}

	.debug-section:last-child {
		margin-bottom: 0;
		border-bottom: none;
	}

	.debug-section h4 {
		margin: 0 0 12px 0;
		color: #374151;
		font-size: 13px;
		font-weight: bold;
	}

	.debug-form-group {
		margin-bottom: 12px;
	}

	.debug-form-group label {
		display: block;
		margin-bottom: 4px;
		color: #6b7280;
		font-size: 12px;
	}

	.debug-form-group select {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 12px;
		font-family: inherit;
	}

	.debug-btn {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		cursor: pointer;
		font-size: 11px;
		font-family: inherit;
		transition: all 0.2s;
		background: white;
	}

	.debug-btn:hover {
		background: #f9fafb;
	}

	.debug-btn--primary {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.debug-btn--primary:hover {
		background: #2563eb;
	}

	.debug-btn--secondary {
		background: #6b7280;
		color: white;
		border-color: #6b7280;
	}

	.debug-btn--warning {
		background: #f59e0b;
		color: white;
		border-color: #f59e0b;
	}

	.debug-btn--info {
		background: #06b6d4;
		color: white;
		border-color: #06b6d4;
	}

	.debug-btn-group {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.debug-info {
		background: #f9fafb;
		padding: 12px;
		border-radius: 4px;
		border: 1px solid #f3f4f6;
	}

	.debug-info-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
		font-size: 11px;
	}

	.debug-info-item:last-child {
		margin-bottom: 0;
	}

	.debug-info-item .label {
		color: #6b7280;
		font-weight: bold;
	}

	.debug-info-item .value {
		color: #374151;
		text-align: right;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 640px) {
		.debug-panel-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.debug-btn-group {
			flex-direction: column;
		}

		.debug-info-item {
			flex-direction: column;
			gap: 2px;
		}

		.debug-info-item .value {
			max-width: 100%;
			text-align: left;
		}
	}
</style>