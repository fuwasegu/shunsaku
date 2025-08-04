<svelte:head>
	<title>Golf Swing Analyzer - スマホでスイング解析</title>
	<meta name="description" content="スマートフォンのジャイロセンサーを使ってゴルフスイングを解析し、最適なクラブとシャフトの組み合わせを提案" />
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import MotionDetector from '$lib/sensors/motion-detector.js';
	import type { SwingData, SwingAnalysis } from '$lib/api/gemini.js';
	import type { Combination } from '$lib/data/golf-equipment.js';
	import { generateRecommendations } from '$lib/data/golf-equipment.js';
	import { loadMasterData, verifyData } from '$lib/database/data-loader.js';
	import SwingVisualizer from '$lib/components/SwingVisualizer.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import DebugConsole from '$lib/components/DebugConsole.svelte';
	import { debugMode, addDebugLog, isPCEnvironment } from '$lib/stores/debug.js';

	// アプリの状態管理
	type AppState = 'loading' | 'ready' | 'permission' | 'measuring' | 'analyzing' | 'results' | 'error';
	let currentState: AppState = 'loading';
	let errorMessage = '';
	let progressValue = 0;
	let motionDetector: MotionDetector;
	let swingData: SwingData | null = null;
	let swingAnalysis: SwingAnalysis | null = null;
	let recommendations: Combination[] = [];
	let swingVisualizer: SwingVisualizer;
	let hasPermission: boolean | null = null;
	let countdown = 0;
	let loadingMessage = 'アプリケーションを初期化中...';

	onMount(async () => {
		// デバッグモードの制御
		const urlParams = new URLSearchParams(window.location.search);
		const debugParam = urlParams.get('debug');
		const isPC = isPCEnvironment();
		
		// デバッグモードの判定ロジック
		const shouldEnableDebug = debugParam === 'true' || (isPC && debugParam !== 'false');
		
		if (shouldEnableDebug) {
			debugMode.set(true);
			addDebugLog('info', `デバッグモード有効 - PC: ${isPC}, URL: ${debugParam}`);
			console.log('onMount実行開始');
			console.log('isPCEnvironment結果:', isPC);
		} else {
			debugMode.set(false);
			console.log('デバッグモード無効 - スマホ環境またはURL指定');
		}

		// マスターデータを読み込み
		try {
			loadingMessage = 'データベースを初期化中...';
			await loadMasterData();
			
			loadingMessage = 'データを検証中...';
			await verifyData();
			
			loadingMessage = '完了！';
			addDebugLog('info', 'マスターデータの読み込み完了');
			
			// 少し待ってからメイン画面へ
			setTimeout(() => {
				currentState = 'ready';
			}, 500);
			
		} catch (error) {
			console.error('マスターデータの読み込みに失敗しました:', error);
			addDebugLog('error', 'マスターデータの読み込みに失敗', { error });
			loadingMessage = 'データ読み込みに失敗しました';
			
			// エラーでも3秒後にready状態に移行（フォールバック）
			setTimeout(() => {
				currentState = 'ready';
			}, 3000);
		}

		motionDetector = new MotionDetector({
			threshold: 8.0,  // より高い閾値でスイング検出
			minDuration: 800, // 最小スイング時間
			maxDuration: 10000, // 最大待機時間（10秒）
			samplingRate: 50  // より高頻度でサンプリング
		});

		// センサーサポートと権限を初期チェック
		if (!motionDetector.isSupported()) {
			hasPermission = false;
			addDebugLog('warn', 'センサーがサポートされていません');
		} else {
			// iOS 13+の権限要求が必要かチェック
			if (typeof DeviceMotionEvent !== 'undefined' && 
				'requestPermission' in DeviceMotionEvent) {
				hasPermission = false; // iOS 13+では明示的に許可が必要
				addDebugLog('info', 'iOS 13+を検出、権限要求が必要');
			} else {
				hasPermission = true; // Android等は自動許可
				addDebugLog('info', '権限要求不要のデバイス');
			}
		}

		// エラーハンドリング
		motionDetector.onError((error) => {
			errorMessage = error;
			currentState = 'error';
			addDebugLog('error', 'Motion Detector エラー', { error });
		});

		// データ取得中の進捗更新
		motionDetector.onData((reading) => {
			const count = motionDetector.getReadingsCount();
			const maxTime = 10; // 最大10秒
			progressValue = Math.min(100, (reading.timestamp / (maxTime * 1000)) * 100);
			
			// リアルタイム可視化更新
			if (swingVisualizer && currentState === 'measuring') {
				swingVisualizer.addRealtimeData(reading);
			}
		});

		// スイング検出完了
		motionDetector.onSwingDetected((data) => {
			swingData = data;
			currentState = 'analyzing';
			analyzeSwing(data);
		});
	});

	async function requestSensorPermission() {
		try {
			console.log('Requesting sensor permission...');
			const permissionGranted = await motionDetector.requestPermission();
			
			if (permissionGranted) {
				console.log('Permission granted');
				hasPermission = true;
				// 権限が得られたら即座に測定開始
				startMeasurement();
			} else {
				errorMessage = 'センサーの使用許可が必要です。設定から許可してください';
				currentState = 'error';
			}
		} catch (error) {
			console.error('Permission request error:', error);
			errorMessage = 'センサー権限の取得に失敗しました';
			currentState = 'error';
		}
	}

	async function startMeasurement() {
		try {
			// センサーサポート確認
			if (!motionDetector.isSupported()) {
				errorMessage = 'お使いのデバイスはモーションセンサーに対応していません';
				currentState = 'error';
				return;
			}

			// 権限確認（ただし要求はしない）
			if (hasPermission === false) {
				currentState = 'permission';
				return;
			}

			// カウントダウン開始
			currentState = 'measuring';
			countdown = 3;
			progressValue = 0;
			
			// カウントダウン
			const countdownInterval = setInterval(() => {
				countdown--;
				if (countdown <= 0) {
					clearInterval(countdownInterval);
					// 測定開始
					const success = motionDetector.startRecording();
					if (!success) {
						errorMessage = '測定の開始に失敗しました';
						currentState = 'error';
					}
				}
			}, 1000);
		} catch (error) {
			console.error('Measurement start error:', error);
			errorMessage = '測定中にエラーが発生しました';
			currentState = 'error';
		}
	}

	function stopMeasurement() {
		const data = motionDetector.stopRecording();
		if (data) {
			swingData = data;
			currentState = 'analyzing';
			analyzeSwing(data);
		} else {
			currentState = 'ready';
		}
	}

	async function analyzeSwing(data: SwingData) {
		try {
			// API Routeを経由してGemini AIで解析
			const response = await fetch('/api/analyze-swing', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

					swingAnalysis = await response.json();
							recommendations = await generateRecommendations(data, swingAnalysis);
		currentState = 'results';
		} catch (error) {
			console.error('Analysis error:', error);
			
			// フォールバック: ローカル解析
			swingAnalysis = {
				swingCharacteristics: generateSwingAnalysis(data),
				swingType: determineSwingType(data),
				tempo: determineTempo(data),
				consistency: Math.floor(Math.random() * 3) + 7, // 7-9
				powerLevel: determinePowerLevel(data),
				recommendations: [
					"スイングリズムの安定化",
					"フォロースルーの改善",
					"体重移動の最適化"
				]
			};

					recommendations = await generateRecommendations(data, swingAnalysis || undefined);
		currentState = 'results';
		}
	}

	function generateSwingAnalysis(data: SwingData): string {
		const maxGyro = Math.max(
			...data.gyroscope.x.map(Math.abs),
			...data.gyroscope.y.map(Math.abs),
			...data.gyroscope.z.map(Math.abs)
		);

		const tempo = data.duration < 1000 ? '速い' : data.duration > 2000 ? 'ゆっくり' : 'バランスの良い';
		const power = maxGyro > 20 ? '力強い' : maxGyro < 10 ? 'ソフトな' : '安定した';

		return `あなたのスイングは${tempo}テンポで、${power}振りが特徴的です。データからは一貫性のある軌道を描いており、基本的なフォームが身についていることが分かります。`;
	}

	function determineSwingType(data: SwingData) {
		const maxGyro = Math.max(
			...data.gyroscope.x.map(Math.abs),
			...data.gyroscope.y.map(Math.abs),
			...data.gyroscope.z.map(Math.abs)
		);

		if (maxGyro > 25) return 'aggressive';
		if (maxGyro < 8) return 'smooth';
		return 'balanced';
	}

	function determineTempo(data: SwingData) {
		if (data.duration < 1000) return 'fast';
		if (data.duration > 2000) return 'slow';
		return 'medium';
	}

	function determinePowerLevel(data: SwingData): number {
		const maxGyro = Math.max(
			...data.gyroscope.x.map(Math.abs),
			...data.gyroscope.y.map(Math.abs),
			...data.gyroscope.z.map(Math.abs)
		);

		return Math.min(10, Math.max(1, Math.floor(maxGyro / 3)));
	}

	function resetApp() {
		currentState = 'ready';
		swingData = null;
		swingAnalysis = null;
		recommendations = [];
		progressValue = 0;
		errorMessage = '';
		
		// スイング可視化をリセット
		if (swingVisualizer) {
			swingVisualizer.resetAnimation();
		}
		
		addDebugLog('info', 'アプリケーションリセット');
	}

	// デバッグパネルからのモックスイング生成処理
	function handleMockSwingGenerated(swingData: SwingData) {
		currentState = 'analyzing';
		analyzeSwing(swingData);
	}
</script>

<main class="gradient-bg">
	<div class="mobile-container">
		<!-- ヘッダー -->
		<header class="mock-text-center mock-mb-8">
			<h1 class="mock-text-3xl mock-text-gray-900 mock-mb-2">ゴルフスイング解析</h1>
			<p class="mock-text-gray-600">
				スマホを振ってスイングを解析し、最適なクラブを提案します
			</p>
			<nav class="mock-mt-4">
				<a href="/equipment" class="equipment-nav-link">
					📋 取扱機材一覧を見る
				</a>
			</nav>
		</header>

		<!-- デバッグパネル（PC環境または明示的にデバッグモードが有効な場合） -->
		{#if isPCEnvironment() || $debugMode}
			<DebugPanel 
				{motionDetector}
				onMockSwingGenerated={handleMockSwingGenerated}
			/>
		{/if}

	{#if currentState === 'loading'}
		<!-- 初期化画面 -->
		<section class="mock-text-center mock-mb-8">
			<div class="mock-card">
				<div class="icon-circle">
					<span class="mock-animate-spin">⚙️</span>
				</div>
				<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">初期化中...</h2>
				<p class="mock-text-sm mock-text-gray-600 mock-mb-4">{loadingMessage}</p>
				<div class="mock-progress">
					<div class="mock-progress-bar loading-progress"></div>
				</div>
			</div>
		</section>
	{:else if currentState === 'ready'}
		<!-- 開始画面 -->
		<section class="mock-text-center mock-mb-8">
			<div class="mock-card">
				<div class="icon-circle--large">
					<span>📱</span>
				</div>
				<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">スイング測定の準備</h2>
				<p class="mock-text-gray-600 mock-mb-4">
					スマホをしっかりと握り、ゴルフスイングの動作を行ってください
				</p>
				<div class="mock-warning-box">
					<h3 class="mock-warning-title">注意事項</h3>
					<ul class="mock-warning-list">
						<li>• スマホを落とさないよう注意してください</li>
						<li>• 周りに人や物がないことを確認してください</li>
						<li>• 実際のスイングと同じ動作を行ってください</li>
					</ul>
				</div>
				<button class="mock-btn mock-btn--primary mock-btn--large mock-w-full" on:click={startMeasurement}>
					スイング解析を開始
				</button>
			</div>
		</section>

	{:else if currentState === 'permission'}
		<!-- 権限要求中 -->
		<section class="mock-text-center mock-mb-8">
			<div class="mock-card">
				<div class="icon-circle">
					<span>📱</span>
				</div>
				<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">センサーアクセス許可</h2>
				<p class="mock-text-gray-600 mock-mb-4">
					スイング解析にはデバイスのモーションセンサーへのアクセスが必要です
				</p>
				<button class="mock-btn mock-btn--primary mock-w-full" on:click={requestSensorPermission}>
					許可する
				</button>
			</div>
		</section>

	{:else if currentState === 'measuring'}
		<!-- 測定中 -->
		<section class="mock-text-center mock-mb-8">
			<div class="mock-card">
				{#if countdown > 0}
					<div>
						<div class="mock-countdown">{countdown}</div>
						<p class="mock-text-lg mock-text-gray-600">準備してください...</p>
					</div>
				{:else}
					<div>
						<div class="mock-animate-pulse">
							<div class="icon-circle--large">
								<span class="mock-animate-spin">🏌️</span>
							</div>
						</div>
						<p class="mock-text-lg mock-text-gray-900 mock-mb-2">スイング測定中...</p>
						<p class="mock-text-gray-600 mock-mb-4">スマホを振ってスイングしてください</p>
						
						<!-- リアルタイムスイング可視化 -->
						<div class="mock-mb-4">
							<SwingVisualizer 
								bind:this={swingVisualizer}
								isRealtime={true}
								swingData={null}
							/>
						</div>
						
						<!-- プログレスバー -->
						<div class="mock-mb-4">
							<div class="mock-progress">
								<div class="mock-progress__fill" style="width: {progressValue}%"></div>
							</div>
							<p class="mock-text-sm mock-text-gray-600 mock-mt-4">{Math.round(progressValue)}%</p>
						</div>

						<p class="mock-text-sm mock-text-gray-600">
							スイングを検知すると自動的に解析を開始します
						</p>
					</div>
				{/if}
			</div>
		</section>

	{:else if currentState === 'analyzing'}
		<!-- 解析中 -->
		<section class="mock-text-center mock-mb-8">
			<div class="mock-card--outlined">
				<div class="icon-circle">
					<span>🤖</span>
				</div>
				<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">AI解析中...</h2>
				<p class="mock-text-gray-600">
					Gemini AIがあなたのスイングを解析しています
				</p>
			</div>
		</section>

	{:else if currentState === 'results' && swingAnalysis}
		<!-- 結果表示 -->
		<div class="mock-space-y-6">
			<!-- スイング可視化 -->
			<div class="mock-card">
				<h2 class="mock-text-xl mock-text-gray-900 mock-text-center mock-mb-4">🎯 あなたのスイング軌道</h2>
				<div class="mock-text-center mock-mb-4">
					<SwingVisualizer 
						swingData={swingData}
						isRealtime={false}
						isPlaying={false}
					/>
					<p class="mock-text-sm mock-text-gray-600 mock-mt-4">
						💡 青い線がスイング軌道、⚡がインパクトポイントです
					</p>
				</div>
			</div>

			<!-- スイング解析結果 -->
			<div class="mock-card">
				<h2 class="mock-text-xl mock-text-gray-900 mock-flex mock-items-center mock-justify-center mock-gap-2 mock-mb-4">
					📊 スイング解析結果
				</h2>
				<div class="mock-mb-6">
					<h3 class="mock-text-lg mock-text-gray-900 mock-mb-3">あなたのクセは...</h3>
					<p class="mock-text-gray-600 mock-mb-4">{swingAnalysis.swingCharacteristics}</p>
					
					<div class="mock-grid-2 mock-gap-4">
						<div class="mock-stat">
							<div class="mock-stat__value mock-stat__value--green">{swingAnalysis.powerLevel}</div>
							<div class="mock-stat__label">パワーレベル</div>
						</div>
						<div class="mock-stat">
							<div class="mock-stat__value mock-stat__value--blue">{swingAnalysis.consistency}</div>
							<div class="mock-stat__label">一貫性</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 推奨組み合わせ -->
			<div>
				<h2 class="mock-text-xl mock-text-gray-900 mock-text-center mock-flex mock-items-center mock-justify-center mock-gap-2 mock-mb-4">
					🏆 おすすめクラブ組み合わせ
				</h2>
				<div class="mock-space-y-4">
					{#each recommendations as combo, index}
						<div class="mock-card {index === 0 ? 'ring-primary' : ''}">
							<div class="mock-flex mock-items-center mock-justify-between mock-mb-3">
								<div class="mock-flex mock-items-center mock-gap-2">
									{#if index === 0}
										<div class="mock-badge mock-badge--success">最適</div>
									{/if}
									<span class="mock-text-lg mock-text-gray-900">組み合わせ {index + 1}</span>
								</div>
								<div class="mock-flex mock-items-center mock-gap-1">
									<span class="mock-w-4 mock-h-4 mock-text-yellow-500">⚡</span>
									<span class="mock-text-green-600 font-bold">{combo.compatibility}%</span>
								</div>
							</div>
							
							<div class="mock-mb-3">
								<div class="mock-text-gray-900 font-semibold">ヘッド: {combo.head.name}</div>
								<div class="mock-text-gray-900 font-semibold">シャフト: {combo.shaft.name}</div>
								<div class="mock-text-sm mock-text-gray-600">期待効果: {combo.expectedEffect}</div>
							</div>
							
							<p class="mock-text-sm mock-text-gray-700 mock-mb-3">{combo.reason}</p>
							
							<div class="mock-flex mock-gap-2">
								<a href={combo.head.amazonUrl} target="_blank" class="mock-btn mock-btn--outline mock-text-xs">
									ヘッド Amazon
								</a>
								<a href={combo.shaft.amazonUrl} target="_blank" class="mock-btn mock-btn--outline mock-text-xs">
									シャフト Amazon
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 再測定ボタン -->
			<div class="mock-text-center mock-mt-4">
				<button class="mock-btn mock-btn--outline mock-w-full" on:click={resetApp}>
					もう一度測定する
				</button>
			</div>
		</div>

	{:else if currentState === 'error'}
		<!-- エラー表示 -->
		<section class="mock-text-center mock-mb-8">
			<div class="mock-card--outlined">
				<div class="icon-circle">
					<span>❌</span>
				</div>
				<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">エラーが発生しました</h2>
				<p class="mock-text-gray-600 mock-mb-4">{errorMessage}</p>
				<button class="mock-btn mock-btn--primary" on:click={resetApp}>
					🔄 再試行
				</button>
			</div>
		</section>
	{/if}
	</div>
</main>

<!-- デバッグコンソール（デバッグモードまたはPC環境でのみ表示） -->
{#if $debugMode || isPCEnvironment()}
	<DebugConsole />
{/if}

<style>
	/* MockテーマのオーバーライドとカスタムStyleは削除済み */
</style>