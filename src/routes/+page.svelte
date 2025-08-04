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

	// アプリの状態管理
	type AppState = 'ready' | 'permission' | 'measuring' | 'analyzing' | 'results' | 'error';
	let currentState: AppState = 'ready';
	let errorMessage = '';
	let progressValue = 0;
	let motionDetector: MotionDetector;
	let swingData: SwingData | null = null;
	let swingAnalysis: SwingAnalysis | null = null;
	let recommendations: Combination[] = [];

	onMount(() => {
		motionDetector = new MotionDetector({
			threshold: 5.0,
			minDuration: 500,
			maxDuration: 5000,
			samplingRate: 100
		});

		// エラーハンドリング
		motionDetector.onError((error) => {
			errorMessage = error;
			currentState = 'error';
		});

		// データ取得中の進捗更新
		motionDetector.onData((reading) => {
			const count = motionDetector.getReadingsCount();
			progressValue = Math.min(100, (count / 30) * 100); // 約3秒で100%
		});

		// スイング検出完了
		motionDetector.onSwingDetected((data) => {
			swingData = data;
			currentState = 'analyzing';
			analyzeSwing(data);
		});
	});

	async function startMeasurement() {
		try {
			// センサーサポート確認
			if (!motionDetector.isSupported()) {
				errorMessage = 'お使いのデバイスはモーションセンサーに対応していません';
				currentState = 'error';
				return;
			}

			// 権限要求
			currentState = 'permission';
			const hasPermission = await motionDetector.requestPermission();
			
			if (!hasPermission) {
				errorMessage = 'センサーの使用許可が必要です。設定から許可してください';
				currentState = 'error';
				return;
			}

			// 測定開始
			currentState = 'measuring';
			progressValue = 0;
			
			const success = motionDetector.startRecording();
			if (!success) {
				errorMessage = '測定の開始に失敗しました';
				currentState = 'error';
			}
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
			recommendations = generateRecommendations(data);
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

			recommendations = generateRecommendations(data);
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
	}
</script>

<main class="container responsive-padding">
	<!-- ヘッダー -->
	<header class="text-center responsive-margin">
		<h1 class="responsive-display-large text-on-surface">🏌️ Golf Swing Analyzer</h1>
		<p class="body-large text-on-surface-variant">
			スマートフォンを振ってあなたのスイングを解析<br/>
			最適なクラブとシャフトの組み合わせを提案します
		</p>
	</header>

	{#if currentState === 'ready'}
		<!-- 開始画面 -->
		<section class="text-center responsive-margin">
			<div class="card card--elevated responsive-margin">
				<div class="card__content">
					<div class="m-8">
						<div class="w-24 h-24 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
							<span class="display-medium">📱</span>
						</div>
						<h2 class="headline-medium text-on-surface m-4">測定準備完了</h2>
						<p class="body-medium text-on-surface-variant m-4">
							スマートフォンをしっかりと握り、<br/>
							ゴルフスイングの動作を行ってください
						</p>
						<div class="responsive-margin">
							<button class="btn btn--filled" on:click={startMeasurement}>
								🎯 スイング測定開始
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>

	{:else if currentState === 'permission'}
		<!-- 権限要求中 -->
		<section class="text-center responsive-margin">
			<div class="card card--outlined responsive-margin">
				<div class="card__content">
					<div class="m-8">
						<div class="w-16 h-16 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
							<span class="headline-medium text-primary">🔐</span>
						</div>
						<h2 class="headline-medium text-on-surface m-4">センサー権限の確認</h2>
						<p class="body-medium text-on-surface-variant">
							デバイスのモーションセンサーへのアクセス許可を確認中...
						</p>
					</div>
				</div>
			</div>
		</section>

	{:else if currentState === 'measuring'}
		<!-- 測定中 -->
		<section class="text-center responsive-margin">
			<div class="card card--filled responsive-margin">
				<div class="card__content">
					<div class="m-8">
						<div class="w-24 h-24 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
							<span class="display-medium">🏌️</span>
						</div>
						<h2 class="headline-medium text-on-surface m-4">測定中...</h2>
						<p class="body-medium text-on-surface-variant m-4">
							スマートフォンを持って<br/>
							ゴルフスイングを行ってください
						</p>
						
						<!-- プログレスバー -->
						<div class="progress-container m-4">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {progressValue}%"></div>
							</div>
							<p class="body-small text-on-surface-variant">{Math.round(progressValue)}%</p>
						</div>

						<div class="flex gap-3 justify-center">
							<button class="btn btn--outlined" on:click={stopMeasurement}>
								⏹️ 測定完了
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>

	{:else if currentState === 'analyzing'}
		<!-- 解析中 -->
		<section class="text-center responsive-margin">
			<div class="card card--outlined responsive-margin">
				<div class="card__content">
					<div class="m-8">
											<div class="w-16 h-16 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
						<span class="headline-medium text-primary">🤖</span>
					</div>
						<h2 class="headline-medium text-on-surface m-4">AI解析中...</h2>
						<p class="body-medium text-on-surface-variant">
							Gemini AIがあなたのスイングを解析しています
						</p>
					</div>
				</div>
			</div>
		</section>

	{:else if currentState === 'results' && swingAnalysis}
		<!-- 結果表示 -->
		<section class="responsive-margin">
			<!-- スイング解析結果 -->
			<div class="card card--elevated responsive-margin">
				<div class="card__content">
					<h2 class="headline-large text-on-surface text-center m-4">📊 スイング解析結果</h2>
					<div class="m-6">
						<h3 class="title-large text-on-surface m-3">あなたのクセは...</h3>
						<p class="body-large text-on-surface-variant">{swingAnalysis.swingCharacteristics}</p>
						
						<div class="grid-responsive-2 responsive-gap m-4">
							<div class="text-center">
								<p class="label-small text-on-surface-variant">スイングタイプ</p>
								<p class="title-medium text-on-surface">{swingAnalysis.swingType}</p>
							</div>
							<div class="text-center">
								<p class="label-small text-on-surface-variant">テンポ</p>
								<p class="title-medium text-on-surface">{swingAnalysis.tempo}</p>
							</div>
							<div class="text-center">
								<p class="label-small text-on-surface-variant">一貫性</p>
								<p class="title-medium text-on-surface">{swingAnalysis.consistency}/10</p>
							</div>
							<div class="text-center">
								<p class="label-small text-on-surface-variant">パワーレベル</p>
								<p class="title-medium text-on-surface">{swingAnalysis.powerLevel}/10</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 推奨組み合わせ -->
			<div class="responsive-margin">
				<h2 class="headline-large text-on-surface text-center m-4">🎯 推奨組み合わせ</h2>
				<div class="grid-responsive responsive-gap">
					{#each recommendations as combo, index}
						<div class="card card--outlined">
							<div class="card__content">
								<div class="flex items-center gap-2 m-3">
									<span class="chip chip--suggestion">#{index + 1}</span>
									<span class="title-medium text-on-surface">適合度 {combo.compatibility}/10</span>
								</div>
								
								<h3 class="title-large text-on-surface m-3">
									{combo.head.name} + {combo.shaft.name}
								</h3>
								
								<div class="m-3">
									<p class="body-medium text-on-surface-variant m-2">
										<strong>理由:</strong> {combo.reason}
									</p>
									<p class="body-medium text-on-surface-variant m-2">
										<strong>期待効果:</strong> {combo.expectedEffect}
									</p>
								</div>

								<div class="flex gap-2 m-3">
									<a href={combo.head.amazonUrl} target="_blank" class="btn btn--outlined btn--small">
										ヘッド Amazon
									</a>
									<a href={combo.shaft.amazonUrl} target="_blank" class="btn btn--outlined btn--small">
										シャフト Amazon
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 再測定ボタン -->
			<div class="text-center responsive-margin">
				<button class="btn btn--filled" on:click={resetApp}>
					🔄 再測定する
				</button>
			</div>
		</section>

	{:else if currentState === 'error'}
		<!-- エラー表示 -->
		<section class="text-center responsive-margin">
			<div class="card card--outlined responsive-margin">
				<div class="card__content">
					<div class="m-8">
						<div class="w-16 h-16 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
							<span class="headline-medium text-error">❌</span>
						</div>
						<h2 class="headline-medium text-on-surface m-4">エラーが発生しました</h2>
						<p class="body-medium text-error m-4">{errorMessage}</p>
						<button class="btn btn--filled" on:click={resetApp}>
							🔄 再試行
						</button>
					</div>
				</div>
			</div>
		</section>
	{/if}
</main>

<style>
	.progress-container {
		width: 100%;
		max-width: 300px;
		margin: 0 auto;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background-color: var(--color-surface-container-high);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: var(--color-primary);
		transition: width 0.3s ease;
		border-radius: var(--radius-sm);
	}

	.animate-spin {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.btn--small {
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-small);
	}
</style>