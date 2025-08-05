<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SwingData } from '$lib/api/gemini.js';
	import Chart from 'chart.js/auto';

	export let swingData: SwingData;
	export let title = 'スイングデータ解析';

	let gyroCanvas: HTMLCanvasElement;
	let accelCanvas: HTMLCanvasElement;
	let analysisCanvas: HTMLCanvasElement;
	let vectorCanvas: HTMLCanvasElement;
	let axisCompareCanvas: HTMLCanvasElement;
	let gyroChart: Chart;
	let accelChart: Chart;
	let analysisChart: Chart;
	let vectorChart: Chart;
	let axisCompareChart: Chart;

	// スイング解析データ
	let swingPhases: { backswing: number; downswing: number; followthrough: number } = {
		backswing: 0,
		downswing: 0,
		followthrough: 0
	};
	let impactFrame = 0;
	let smoothnessScore = 0;
	let peakVelocity = 0;
	
	// ゴルファー向け詳細フェーズ
	let detailedPhases = {
		address: 0,           // アドレス（構え）
		takeaway: 0,         // テークアウェイ開始
		backswingTop: 0,     // バックスイングトップ
		downswingStart: 0,   // ダウンスイング開始
		impact: 0,           // インパクト
		followStart: 0,      // フォロースルー開始
		finish: 0            // フィニッシュ
	};
	
	// スイングテンポ分析
	let tempoAnalysis = {
		backswingTime: 0,
		downswingTime: 0,
		ratio: 0,
		ideal: false
	};

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
		if (vectorChart) vectorChart.destroy();
		if (axisCompareChart) axisCompareChart.destroy();
	});

	function analyzeSwingData() {
		const gyroMagnitudes = swingData.gyroscope.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.gyroscope.y[i] ** 2 + swingData.gyroscope.z[i] ** 2)
		);

		// インパクトポイントを検出（最大角速度の点）
		impactFrame = gyroMagnitudes.indexOf(Math.max(...gyroMagnitudes));
		peakVelocity = Math.max(...gyroMagnitudes);

		// 詳細なスイングフェーズ分析
		analyzeDetailedPhases(gyroMagnitudes);
		
		// スイングテンポ分析
		analyzeSwingTempo();

		// 従来のスイングフェーズを分析（後方互換性のため）
		const totalFrames = gyroMagnitudes.length;
		swingPhases.backswing = (detailedPhases.backswingTop / totalFrames) * 100;
		swingPhases.downswing = ((detailedPhases.impact - detailedPhases.downswingStart) / totalFrames) * 100;
		swingPhases.followthrough = ((totalFrames - detailedPhases.impact) / totalFrames) * 100;

		// スイングの滑らかさ（標準偏差の逆数）
		const mean = gyroMagnitudes.reduce((a, b) => a + b) / gyroMagnitudes.length;
		const variance = gyroMagnitudes.reduce((sum, val) => sum + (val - mean) ** 2, 0) / gyroMagnitudes.length;
		const stdDev = Math.sqrt(variance);
		smoothnessScore = Math.max(0, 10 - stdDev);
	}

	function analyzeDetailedPhases(gyroMagnitudes: number[]) {
		const totalFrames = gyroMagnitudes.length;
		const threshold = Math.max(...gyroMagnitudes) * 0.1;
		
		// 1. アドレス（静止状態から動き始める点）
		detailedPhases.address = 0;
		
		// 2. テークアウェイ開始（動きが閾値を超えた点）
		for (let i = 1; i < totalFrames; i++) {
			if (gyroMagnitudes[i] > threshold) {
				detailedPhases.takeaway = i;
				break;
			}
		}
		
		// 3. バックスイングトップ（角速度が一時的に減少する点）
		let maxBackswingPoint = 0;
		let maxBackswingValue = 0;
		for (let i = detailedPhases.takeaway; i < impactFrame; i++) {
			// 移動平均で滑らかにして判定
			const avgCurrent = (gyroMagnitudes[i] + (gyroMagnitudes[i-1] || 0) + (gyroMagnitudes[i+1] || 0)) / 3;
			if (avgCurrent > maxBackswingValue) {
				maxBackswingValue = avgCurrent;
				maxBackswingPoint = i;
			}
		}
		detailedPhases.backswingTop = maxBackswingPoint;
		
		// 4. ダウンスイング開始（バックスイングトップから加速が始まる点）
		detailedPhases.downswingStart = detailedPhases.backswingTop;
		
		// 5. インパクト（最大角速度の点）
		detailedPhases.impact = impactFrame;
		
		// 6. フォロースルー開始（インパクト後）
		detailedPhases.followStart = impactFrame + 1;
		
		// 7. フィニッシュ（角速度が閾値以下に戻る点）
		detailedPhases.finish = totalFrames - 1;
		for (let i = impactFrame + 1; i < totalFrames; i++) {
			if (gyroMagnitudes[i] < threshold) {
				detailedPhases.finish = i;
				break;
			}
		}
	}

	function analyzeSwingTempo() {
		const timestamps = swingData.timestamp;
		
		// バックスイング時間（テークアウェイ〜トップ）
		tempoAnalysis.backswingTime = timestamps[detailedPhases.backswingTop] - timestamps[detailedPhases.takeaway];
		
		// ダウンスイング時間（トップ〜インパクト）
		tempoAnalysis.downswingTime = timestamps[detailedPhases.impact] - timestamps[detailedPhases.backswingTop];
		
		// 理想的な比率は3:1（バックスイング:ダウンスイング）
		tempoAnalysis.ratio = tempoAnalysis.backswingTime / tempoAnalysis.downswingTime;
		tempoAnalysis.ideal = tempoAnalysis.ratio >= 2.5 && tempoAnalysis.ratio <= 3.5;
	}

	// Chart.jsプラグイン：スイングフェーズの補助線
	function createPhaseLinePlugin() {
		return {
			id: 'swingPhaseLines',
			afterDraw: (chart: any) => {
				const ctx = chart.ctx;
				const chartArea = chart.chartArea;
				
				// フェーズ定義
				const phases = [
					{ frame: detailedPhases.takeaway, label: '🏌️ テークアウェイ', color: '#10b981' },
					{ frame: detailedPhases.backswingTop, label: '⬆️ トップ', color: '#3b82f6' },
					{ frame: detailedPhases.impact, label: '⚡ インパクト', color: '#ef4444' },
					{ frame: detailedPhases.finish, label: '🏁 フィニッシュ', color: '#8b5cf6' }
				];
				
				phases.forEach(phase => {
					const timestamp = swingData.timestamp[phase.frame];
					const x = chart.scales.x.getPixelForValue(timestamp);
					
					// 縦線を描画
					ctx.save();
					ctx.strokeStyle = phase.color;
					ctx.lineWidth = 2;
					ctx.setLineDash([5, 5]);
					ctx.beginPath();
					ctx.moveTo(x, chartArea.top);
					ctx.lineTo(x, chartArea.bottom);
					ctx.stroke();
					
					// ラベルを描画
					ctx.fillStyle = phase.color;
					ctx.font = '12px sans-serif';
					ctx.textAlign = 'center';
					ctx.fillText(phase.label, x, chartArea.top - 10);
					ctx.restore();
				});
				
				// フェーズ間の背景色
				ctx.save();
				const phaseColors = [
					{ start: 0, end: detailedPhases.takeaway, color: 'rgba(156, 163, 175, 0.1)', label: 'アドレス' },
					{ start: detailedPhases.takeaway, end: detailedPhases.backswingTop, color: 'rgba(16, 185, 129, 0.1)', label: 'バックスイング' },
					{ start: detailedPhases.backswingTop, end: detailedPhases.impact, color: 'rgba(59, 130, 246, 0.1)', label: 'ダウンスイング' },
					{ start: detailedPhases.impact, end: detailedPhases.finish, color: 'rgba(139, 92, 246, 0.1)', label: 'フォロー' }
				];
				
				phaseColors.forEach(phase => {
					const startX = chart.scales.x.getPixelForValue(swingData.timestamp[phase.start]);
					const endX = chart.scales.x.getPixelForValue(swingData.timestamp[phase.end]);
					
					ctx.fillStyle = phase.color;
					ctx.fillRect(startX, chartArea.top, endX - startX, chartArea.bottom - chartArea.top);
				});
				ctx.restore();
			}
		};
	}

	function createCharts() {
		createGyroChart();
		createAccelChart();
		createAnalysisChart();
		createVectorChart();
		createAxisCompareChart();
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
						text: '🌪️ 角速度データ（スイングフェーズ付き）',
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
			},
			plugins: [createPhaseLinePlugin()]
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

	function createVectorChart() {
		const ctx = vectorCanvas.getContext('2d')!;
		
		// 3軸の合成ベクトルを計算
		const gyroMagnitudes = swingData.gyroscope.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.gyroscope.y[i] ** 2 + swingData.gyroscope.z[i] ** 2)
		);
		
		const accelMagnitudes = swingData.accelerometer.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.accelerometer.y[i] ** 2 + swingData.accelerometer.z[i] ** 2)
		);
		
		vectorChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: swingData.timestamp,
				datasets: [
					{
						label: '🌪️ 角速度ベクトル合成値 (deg/s)',
						data: gyroMagnitudes,
						borderColor: '#7c3aed',
						backgroundColor: 'rgba(124, 58, 237, 0.1)',
						tension: 0.4,
						pointRadius: 1,
						borderWidth: 3,
						fill: true
					},
					{
						label: '🚀 加速度ベクトル合成値 (m/s²)',
						data: accelMagnitudes,
						borderColor: '#dc2626',
						backgroundColor: 'rgba(220, 38, 38, 0.1)',
						tension: 0.4,
						pointRadius: 1,
						borderWidth: 3,
						yAxisID: 'y1'
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
						text: '🎯 3軸合成ベクトル（総合的な動きの強さ）',
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
						type: 'linear',
						display: true,
						position: 'left' as const,
						title: {
							display: true,
							text: '角速度 (deg/s)'
						}
					},
					y1: {
						type: 'linear',
						display: true,
						position: 'right' as const,
						title: {
							display: true,
							text: '加速度 (m/s²)'
						},
						grid: {
							drawOnChartArea: false,
						},
					}
				}
			}
		});
	}

	function createAxisCompareChart() {
		const ctx = axisCompareCanvas.getContext('2d')!;
		
		// 各軸の最大値、平均値、標準偏差を計算
		const gyroStats = {
			x: {
				max: Math.max(...swingData.gyroscope.x.map(Math.abs)),
				avg: swingData.gyroscope.x.reduce((a, b) => a + Math.abs(b), 0) / swingData.gyroscope.x.length,
			},
			y: {
				max: Math.max(...swingData.gyroscope.y.map(Math.abs)),
				avg: swingData.gyroscope.y.reduce((a, b) => a + Math.abs(b), 0) / swingData.gyroscope.y.length,
			},
			z: {
				max: Math.max(...swingData.gyroscope.z.map(Math.abs)),
				avg: swingData.gyroscope.z.reduce((a, b) => a + Math.abs(b), 0) / swingData.gyroscope.z.length,
			}
		};
		
		axisCompareChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ['X軸 (左右)', 'Y軸 (上下)', 'Z軸 (前後)'],
				datasets: [
					{
						label: '最大角速度 (deg/s)',
						data: [gyroStats.x.max, gyroStats.y.max, gyroStats.z.max],
						backgroundColor: [
							'rgba(239, 68, 68, 0.8)',   // 赤
							'rgba(16, 185, 129, 0.8)',  // 緑
							'rgba(59, 130, 246, 0.8)'   // 青
						],
						borderColor: [
							'rgba(239, 68, 68, 1)',
							'rgba(16, 185, 129, 1)',
							'rgba(59, 130, 246, 1)'
						],
						borderWidth: 2
					},
					{
						label: '平均角速度 (deg/s)',
						data: [gyroStats.x.avg, gyroStats.y.avg, gyroStats.z.avg],
						backgroundColor: [
							'rgba(239, 68, 68, 0.4)',
							'rgba(16, 185, 129, 0.4)',
							'rgba(59, 130, 246, 0.4)'
						],
						borderColor: [
							'rgba(239, 68, 68, 0.8)',
							'rgba(16, 185, 129, 0.8)',
							'rgba(59, 130, 246, 0.8)'
						],
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: '📐 3軸別影響度比較',
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
							text: '軸の方向'
						}
					},
					y: {
						title: {
							display: true,
							text: '角速度 (deg/s)'
						},
						beginAtZero: true
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
			if (vectorChart) vectorChart.destroy();
			if (axisCompareChart) axisCompareChart.destroy();
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
		<!-- 3軸合成ベクトルチャート (新しく追加) -->
		<div class="chart-container chart-container--wide">
			<canvas bind:this={vectorCanvas} width="800" height="300"></canvas>
		</div>

		<!-- 3軸比較チャート (新しく追加) -->
		<div class="chart-container">
			<canvas bind:this={axisCompareCanvas} width="400" height="250"></canvas>
		</div>

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

		<!-- ゴルファー向け分析詳細 -->
		<div class="golf-analysis">
			<h4 class="analysis-title">⛳ ゴルファー向け分析</h4>
			
			<!-- スイングテンポ分析 -->
			<div class="tempo-analysis">
				<h5 class="tempo-title">
					⏱️ スイングテンポ
					<span class="tempo-status {tempoAnalysis.ideal ? 'ideal' : 'needs-work'}">
						{tempoAnalysis.ideal ? '理想的' : '要調整'}
					</span>
				</h5>
				<div class="tempo-details">
					<div class="tempo-item">
						<span class="tempo-label">バックスイング時間:</span>
						<span class="tempo-value">{(tempoAnalysis.backswingTime / 1000).toFixed(2)}秒</span>
					</div>
					<div class="tempo-item">
						<span class="tempo-label">ダウンスイング時間:</span>
						<span class="tempo-value">{(tempoAnalysis.downswingTime / 1000).toFixed(2)}秒</span>
					</div>
					<div class="tempo-item">
						<span class="tempo-label">テンポ比率:</span>
						<span class="tempo-value">{tempoAnalysis.ratio.toFixed(1)}:1</span>
						<span class="tempo-advice">
							{#if tempoAnalysis.ratio < 2.5}
								（もう少しゆっくりバックスイングを）
							{:else if tempoAnalysis.ratio > 3.5}
								（ダウンスイングをもう少し素早く）
							{:else}
								（理想的なテンポです！）
							{/if}
						</span>
					</div>
				</div>
			</div>

			<!-- フェーズ別分析 -->
			<div class="phase-analysis">
				<h5 class="phase-title">🎯 フェーズ別アドバイス</h5>
				<div class="phase-grid">
					<div class="phase-card">
						<div class="phase-name">🏌️ テークアウェイ</div>
						<div class="phase-time">{swingData.timestamp[detailedPhases.takeaway]}ms</div>
						<div class="phase-advice">ゆっくり始動</div>
					</div>
					<div class="phase-card">
						<div class="phase-name">⬆️ トップ</div>
						<div class="phase-time">{swingData.timestamp[detailedPhases.backswingTop]}ms</div>
						<div class="phase-advice">一瞬の溜め</div>
					</div>
					<div class="phase-card impact">
						<div class="phase-name">⚡ インパクト</div>
						<div class="phase-time">{swingData.timestamp[detailedPhases.impact]}ms</div>
						<div class="phase-advice">最重要ポイント</div>
					</div>
					<div class="phase-card">
						<div class="phase-name">🏁 フィニッシュ</div>
						<div class="phase-time">{swingData.timestamp[detailedPhases.finish]}ms</div>
						<div class="phase-advice">大きく振り抜く</div>
					</div>
				</div>
			</div>

			<!-- 改善ポイント -->
			<div class="improvement-tips">
				<h5 class="tips-title">💡 次回の改善ポイント</h5>
				<div class="tips-list">
					{#if !tempoAnalysis.ideal}
						<div class="tip-item">
							<span class="tip-icon">⏰</span>
							<span class="tip-text">
								スイングテンポを調整しましょう（理想は3:1）
							</span>
						</div>
					{/if}
					{#if smoothnessScore < 7}
						<div class="tip-item">
							<span class="tip-icon">🌊</span>
							<span class="tip-text">
								より滑らかなスイングを心がけましょう
							</span>
						</div>
					{/if}
					<div class="tip-item">
						<span class="tip-icon">🎯</span>
						<span class="tip-text">
							インパクト時の角速度: {peakVelocity.toFixed(1)} deg/s
						</span>
					</div>
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
		grid-template-columns: 1fr;
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

	.chart-container--wide {
		grid-column: span 1;
		height: 320px;
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

	/* ゴルファー向け分析スタイル */
	.golf-analysis {
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
		border-radius: 12px;
		padding: 24px;
		border: 2px solid #22c55e;
		grid-column: span 2;
	}

	.tempo-analysis {
		margin-bottom: 24px;
		padding: 16px;
		background: white;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
	}

	.tempo-title {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		color: #1e40af;
	}

	.tempo-status {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.tempo-status.ideal {
		background: #dcfce7;
		color: #166534;
	}

	.tempo-status.needs-work {
		background: #fed7aa;
		color: #9a3412;
	}

	.tempo-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tempo-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
	}

	.tempo-label {
		font-weight: 500;
		color: #374151;
		min-width: 140px;
	}

	.tempo-value {
		font-weight: 700;
		color: #1e40af;
	}

	.tempo-advice {
		font-size: 0.8rem;
		color: #6b7280;
		font-style: italic;
	}

	.phase-analysis {
		margin-bottom: 24px;
	}

	.phase-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1e40af;
		margin-bottom: 16px;
	}

	.phase-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.phase-card {
		background: white;
		border-radius: 8px;
		padding: 12px;
		text-align: center;
		border: 2px solid #e5e7eb;
		transition: all 0.2s;
	}

	.phase-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.phase-card.impact {
		border-color: #ef4444;
		background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
	}

	.phase-name {
		font-weight: 600;
		color: #374151;
		margin-bottom: 4px;
	}

	.phase-time {
		font-size: 0.8rem;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.phase-advice {
		font-size: 0.75rem;
		color: #059669;
		font-weight: 500;
	}

	.improvement-tips {
		padding: 16px;
		background: white;
		border-radius: 8px;
		border-left: 4px solid #f59e0b;
	}

	.tips-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #92400e;
		margin-bottom: 12px;
	}

	.tips-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tip-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px;
		background: #fffbeb;
		border-radius: 6px;
	}

	.tip-icon {
		font-size: 1.1rem;
	}

	.tip-text {
		font-size: 0.9rem;
		color: #92400e;
	}

	@media (max-width: 768px) {
		.chart-container {
			height: 240px;
		}

		.metrics-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.analytics-container {
			padding: 16px;
		}

		.golf-analysis {
			grid-column: span 1;
			padding: 16px;
		}

		.phase-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.tempo-details {
			gap: 6px;
		}

		.tempo-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}

		.tempo-label {
			min-width: auto;
		}
	}
</style>