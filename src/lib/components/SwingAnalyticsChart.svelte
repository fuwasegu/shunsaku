<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SwingData } from '$lib/api/gemini.js';
	import Chart from 'chart.js/auto';

	export let swingData: SwingData;
	export let title = 'スイングデータ解析';

	let gyroCanvas: HTMLCanvasElement;
	let accelCanvas: HTMLCanvasElement;
	let analysisCanvas: HTMLCanvasElement;
	let gyroChart: Chart;
	let accelChart: Chart;
	let analysisChart: Chart;

	// スイング解析データ
	let swingPhases: { backswing: number; downswing: number; followthrough: number } = {
		backswing: 0,
		downswing: 0,
		followthrough: 0
	};
	let impactFrame = 0;
	let smoothnessScore = 0;
	let peakVelocity = 0;

	onMount(() => {
		if (swingData) {
			analyzeSwingData();
			createCharts();
		}
	});

	onDestroy(() => {
		if (gyroChart) gyroChart.destroy();
		if (accelChart) accelChart.destroy();
		if (analysisChart) analysisChart.destroy();
	});

	function analyzeSwingData() {
		const gyroMagnitudes = swingData.gyroscope.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.gyroscope.y[i] ** 2 + swingData.gyroscope.z[i] ** 2)
		);

		// インパクトポイントを検出（最大角速度の点）
		impactFrame = gyroMagnitudes.indexOf(Math.max(...gyroMagnitudes));
		peakVelocity = Math.max(...gyroMagnitudes);

		// スイングフェーズを分析
		const totalFrames = gyroMagnitudes.length;
		const thresholdStart = Math.max(...gyroMagnitudes) * 0.3;

		// バックスイング: 開始から最大値まで
		let backswingEnd = impactFrame;
		swingPhases.backswing = (backswingEnd / totalFrames) * 100;

		// ダウンスイング: 最大値から値が半分になるまで
		let downswingEnd = impactFrame;
		for (let i = impactFrame + 1; i < gyroMagnitudes.length; i++) {
			if (gyroMagnitudes[i] < peakVelocity * 0.5) {
				downswingEnd = i;
				break;
			}
		}
		swingPhases.downswing = ((downswingEnd - impactFrame) / totalFrames) * 100;

		// フォロースルー: 残り
		swingPhases.followthrough = ((totalFrames - downswingEnd) / totalFrames) * 100;

		// スイングの滑らかさ（標準偏差の逆数）
		const mean = gyroMagnitudes.reduce((a, b) => a + b) / gyroMagnitudes.length;
		const variance = gyroMagnitudes.reduce((sum, val) => sum + (val - mean) ** 2, 0) / gyroMagnitudes.length;
		const stdDev = Math.sqrt(variance);
		smoothnessScore = Math.max(0, 10 - stdDev);
	}

	function createCharts() {
		createGyroChart();
		createAccelChart();
		createAnalysisChart();
	}

	function createGyroChart() {
		const ctx = gyroCanvas.getContext('2d')!;
		
		gyroChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: swingData.timestamp,
				datasets: [
					{
						label: 'X軸 - 左右の回転 (deg/s)',
						data: swingData.gyroscope.x,
						borderColor: '#ef4444',
						backgroundColor: 'rgba(239, 68, 68, 0.1)',
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 2
					},
					{
						label: 'Y軸 - 上下の回転 (deg/s)',
						data: swingData.gyroscope.y,
						borderColor: '#10b981',
						backgroundColor: 'rgba(16, 185, 129, 0.1)',
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 2
					},
					{
						label: 'Z軸 - 前後の回転 (deg/s)',
						data: swingData.gyroscope.z,
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: 'index'
				},
				plugins: {
					title: {
						display: true,
						text: '🌪️ 角速度データ（ジャイロスコープ）',
						font: { size: 16, weight: 'bold' as const }
					},
					legend: {
						position: 'top' as const
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: '時間 (ms)'
						}
					},
					y: {
						title: {
							display: true,
							text: '角速度 (deg/s)'
						}
					}
				}
			}
		});
	}

	function createAccelChart() {
		const ctx = accelCanvas.getContext('2d')!;
		
		accelChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: swingData.timestamp,
				datasets: [
					{
						label: 'X軸 - 左右の加速度 (m/s²)',
						data: swingData.accelerometer.x,
						borderColor: '#ec4899',
						backgroundColor: 'rgba(236, 72, 153, 0.1)',
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 2
					},
					{
						label: 'Y軸 - 上下の加速度 (m/s²)',
						data: swingData.accelerometer.y,
						borderColor: '#8b5cf6',
						backgroundColor: 'rgba(139, 92, 246, 0.1)',
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 2
					},
					{
						label: 'Z軸 - 前後の加速度 (m/s²)',
						data: swingData.accelerometer.z,
						borderColor: '#06b6d4',
						backgroundColor: 'rgba(6, 182, 212, 0.1)',
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: 'index'
				},
				plugins: {
					title: {
						display: true,
						text: '🚀 加速度データ（アクセロメーター）',
						font: { size: 16, weight: 'bold' as const }
					},
					legend: {
						position: 'top' as const
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: '時間 (ms)'
						}
					},
					y: {
						title: {
							display: true,
							text: '加速度 (m/s²)'
						}
					}
				}
			}
		});
	}

	function createAnalysisChart() {
		const ctx = analysisCanvas.getContext('2d')!;
		
		analysisChart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['バックスイング', 'ダウンスイング', 'フォロースルー'],
				datasets: [{
					data: [swingPhases.backswing, swingPhases.downswing, swingPhases.followthrough],
					backgroundColor: [
						'rgba(59, 130, 246, 0.8)',   // 青 - バックスイング
						'rgba(239, 68, 68, 0.8)',    // 赤 - ダウンスイング
						'rgba(16, 185, 129, 0.8)'    // 緑 - フォロースルー
					],
					borderColor: [
						'rgba(59, 130, 246, 1)',
						'rgba(239, 68, 68, 1)',
						'rgba(16, 185, 129, 1)'
					],
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: '⏱️ スイングフェーズ分析',
						font: { size: 16, weight: 'bold' as const }
					},
					legend: {
						position: 'bottom' as const
					}
				}
			}
		});
	}

	$: if (swingData) {
		analyzeSwingData();
		// チャートが既に存在する場合は更新
		if (gyroChart) {
			gyroChart.destroy();
			accelChart.destroy();
			analysisChart.destroy();
			createCharts();
		}
	}
</script>

<div class="analytics-container">
	<h3 class="analytics-title">{title}</h3>
	
	<!-- 主要指標サマリー -->
	<div class="metrics-grid">
		<div class="metric-card">
			<div class="metric-value">{peakVelocity.toFixed(1)}</div>
			<div class="metric-label">最大角速度 (deg/s)</div>
		</div>
		<div class="metric-card">
			<div class="metric-value">{smoothnessScore.toFixed(1)}</div>
			<div class="metric-label">スムーズネス (/10)</div>
		</div>
		<div class="metric-card">
			<div class="metric-value">{swingData.duration.toFixed(0)}</div>
			<div class="metric-label">スイング時間 (ms)</div>
		</div>
		<div class="metric-card">
			<div class="metric-value">{swingData.gyroscope.x.length}</div>
			<div class="metric-label">データポイント</div>
		</div>
	</div>

	<!-- チャート表示 -->
	<div class="charts-grid">
		<!-- ジャイロスコープチャート -->
		<div class="chart-container">
			<canvas bind:this={gyroCanvas} width="400" height="250"></canvas>
		</div>

		<!-- アクセロメーターチャート -->
		<div class="chart-container">
			<canvas bind:this={accelCanvas} width="400" height="250"></canvas>
		</div>

		<!-- スイングフェーズ分析 -->
		<div class="chart-container chart-container--small">
			<canvas bind:this={analysisCanvas} width="300" height="250"></canvas>
		</div>

		<!-- スイング分析詳細 -->
		<div class="analysis-details">
			<h4 class="analysis-title">📊 詳細分析</h4>
			<div class="analysis-list">
				<div class="analysis-item">
					<span class="analysis-icon">🎯</span>
					<span class="analysis-text">インパクトタイミング: {((impactFrame / swingData.gyroscope.x.length) * 100).toFixed(1)}%</span>
				</div>
				<div class="analysis-item">
					<span class="analysis-icon">⚡</span>
					<span class="analysis-text">ピーク角速度: {peakVelocity.toFixed(1)} deg/s</span>
				</div>
				<div class="analysis-item">
					<span class="analysis-icon">⏰</span>
					<span class="analysis-text">バックスイング: {swingPhases.backswing.toFixed(1)}%</span>
				</div>
				<div class="analysis-item">
					<span class="analysis-icon">🎯</span>
					<span class="analysis-text">ダウンスイング: {swingPhases.downswing.toFixed(1)}%</span>
				</div>
				<div class="analysis-item">
					<span class="analysis-icon">🌊</span>
					<span class="analysis-text">スムーズネス: {smoothnessScore > 7 ? '良好' : smoothnessScore > 5 ? '普通' : '要改善'}</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.analytics-container {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.analytics-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 20px;
		text-align: center;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.metric-card {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border-radius: 8px;
		padding: 16px;
		text-align: center;
		border: 2px solid #e5e7eb;
	}

	.metric-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #3b82f6;
		margin-bottom: 4px;
	}

	.metric-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.chart-container {
		background: #fafafa;
		border-radius: 8px;
		padding: 16px;
		border: 1px solid #e5e7eb;
		position: relative;
		height: 280px;
	}

	.chart-container--small {
		grid-column: span 1;
	}

	.analysis-details {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border-radius: 8px;
		padding: 20px;
		border: 2px solid #0ea5e9;
	}

	.analysis-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #0c4a6e;
		margin-bottom: 16px;
	}

	.analysis-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.analysis-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 0;
	}

	.analysis-icon {
		font-size: 1.1rem;
		width: 24px;
		text-align: center;
	}

	.analysis-text {
		font-size: 0.9rem;
		color: #1e40af;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}

		.chart-container {
			height: 240px;
		}

		.metrics-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.analytics-container {
			padding: 16px;
		}
	}
</style>