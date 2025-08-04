<script lang="ts">
	import type { SwingData, SwingAnalysis } from '$lib/api/gemini.js';

	export let swingData: SwingData;
	export let swingAnalysis: SwingAnalysis | null = null;

	interface SwingInsight {
		type: 'strength' | 'improvement' | 'neutral';
		title: string;
		description: string;
		score: number; // 1-10
		icon: string;
		priority: 'high' | 'medium' | 'low';
	}

	let insights: SwingInsight[] = [];

	$: if (swingData) {
		insights = analyzeSwingInsights();
	}

	function analyzeSwingInsights(): SwingInsight[] {
		const results: SwingInsight[] = [];

		// ジャイロスコープデータから基本的な分析
		const gyroMagnitudes = swingData.gyroscope.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.gyroscope.y[i] ** 2 + swingData.gyroscope.z[i] ** 2)
		);
		
		const maxGyro = Math.max(...gyroMagnitudes);
		const avgGyro = gyroMagnitudes.reduce((a, b) => a + b) / gyroMagnitudes.length;
		const stdDev = calculateStandardDeviation(gyroMagnitudes);

		// 1. スイングスピード分析
		if (maxGyro > 25) {
			results.push({
				type: 'strength',
				title: 'パワフルなスイング',
				description: 'ヘッドスピードが十分に出ており、飛距離を稼げるスイングです。このパワーを活かすクラブセッティングがおすすめです。',
				score: 8,
				icon: '⚡',
				priority: 'high'
			});
		} else if (maxGyro < 8) {
			results.push({
				type: 'improvement',
				title: 'スイングスピードの向上',
				description: 'もう少しヘッドスピードを上げることで、飛距離アップが期待できます。軽量なシャフトやフレックスの調整を検討してみてください。',
				score: 4,
				icon: '🚀',
				priority: 'medium'
			});
		} else {
			results.push({
				type: 'neutral',
				title: 'バランスの取れたスピード',
				description: '適度なヘッドスピードでコントロールと飛距離のバランスが取れています。',
				score: 7,
				icon: '⚖️',
				priority: 'low'
			});
		}

		// 2. スイングの安定性分析
		const smoothness = calculateSmoothness(gyroMagnitudes);
		if (smoothness > 8) {
			results.push({
				type: 'strength',
				title: 'スムーズなスイング軌道',
				description: '非常に安定したスイングです。この一貫性を活かすために、精密性重視のクラブセッティングが向いています。',
				score: 9,
				icon: '🎯',
				priority: 'high'
			});
		} else if (smoothness < 5) {
			results.push({
				type: 'improvement',
				title: 'スイング軌道の安定化',
				description: 'スイングにブレが見られます。より寛容性の高いクラブヘッドや、安定性を重視したシャフトがおすすめです。',
				score: 3,
				icon: '🌊',
				priority: 'high'
			});
		}

		// 3. スイングテンポ分析
		const tempo = analyzeTempo();
		if (tempo.type === 'ideal') {
			results.push({
				type: 'strength',
				title: '理想的なスイングテンポ',
				description: `${tempo.ratio.toFixed(1)}:1の理想的なバックスイング/ダウンスイング比率です。このリズムを活かすクラブ選択をおすすめします。`,
				score: 8,
				icon: '⏱️',
				priority: 'medium'
			});
		} else if (tempo.type === 'fast') {
			results.push({
				type: 'improvement',
				title: 'スイングテンポの調整',
				description: 'やや速いテンポです。重めのヘッドや硬めのシャフトでタイミングを取りやすくすることを検討してください。',
				score: 5,
				icon: '⚡',
				priority: 'medium'
			});
		} else {
			results.push({
				type: 'improvement',
				title: 'スイングテンポの向上',
				description: 'ゆったりとしたテンポです。軽量化やフレックスの調整で、もう少しリズミカルなスイングを目指してみてください。',
				score: 5,
				icon: '🐌',
				priority: 'low'
			});
		}

		// 4. 加速度パターン分析
		const accelAnalysis = analyzeAcceleration();
		if (accelAnalysis.impact > 7) {
			results.push({
				type: 'strength',
				title: '効率的なインパクト',
				description: 'インパクト時の加速度が理想的です。ボールに効率よくエネルギーを伝達できています。',
				score: 8,
				icon: '💥',
				priority: 'high'
			});
		}

		// 5. AIからの分析結果を統合
		if (swingAnalysis) {
			// パワーレベル
			if (swingAnalysis.powerLevel >= 8) {
				results.push({
					type: 'strength',
					title: 'ハイパワーゴルファー',
					description: 'パワーがあるゴルファーです。パワーヒッター向けの硬いシャフトや低重心ヘッドが適しています。',
					score: swingAnalysis.powerLevel,
					icon: '💪',
					priority: 'high'
				});
			}

			// 一貫性
			if (swingAnalysis.consistency >= 8) {
				results.push({
					type: 'strength',
					title: '高い再現性',
					description: '一貫性の高いスイングができています。上級者向けの操作性重視クラブが使いこなせるでしょう。',
					score: swingAnalysis.consistency,
					icon: '🎪',
					priority: 'medium'
				});
			} else if (swingAnalysis.consistency < 6) {
				results.push({
					type: 'improvement',
					title: '再現性の向上',
					description: 'スイングの一貫性に改善の余地があります。寛容性の高いクラブがスコアアップに繋がるでしょう。',
					score: swingAnalysis.consistency,
					icon: '🔄',
					priority: 'high'
				});
			}
		}

		// スコアの高い順にソート、タイプ別に分類
		return results.sort((a, b) => {
			// まず優先度でソート
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
			if (priorityDiff !== 0) return priorityDiff;
			
			// 次にスコアでソート
			return b.score - a.score;
		});
	}

	function calculateStandardDeviation(values: number[]): number {
		const mean = values.reduce((a, b) => a + b) / values.length;
		const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
		return Math.sqrt(variance);
	}

	function calculateSmoothness(gyroMagnitudes: number[]): number {
		const stdDev = calculateStandardDeviation(gyroMagnitudes);
		// 標準偏差が小さいほどスムーズ（10点満点）
		return Math.max(0, 10 - stdDev);
	}

	function analyzeTempo(): { type: 'ideal' | 'fast' | 'slow', ratio: number } {
		const duration = swingData.duration;
		const gyroMagnitudes = swingData.gyroscope.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.gyroscope.y[i] ** 2 + swingData.gyroscope.z[i] ** 2)
		);
		
		// インパクトポイントを見つける
		const maxIndex = gyroMagnitudes.indexOf(Math.max(...gyroMagnitudes));
		const backswingTime = (maxIndex / gyroMagnitudes.length) * duration;
		const downswingTime = duration - backswingTime;
		
		const ratio = backswingTime / downswingTime;
		
		if (ratio >= 2.0 && ratio <= 3.5) {
			return { type: 'ideal', ratio };
		} else if (ratio < 2.0) {
			return { type: 'fast', ratio };
		} else {
			return { type: 'slow', ratio };
		}
	}

	function analyzeAcceleration(): { impact: number } {
		const accelMagnitudes = swingData.accelerometer.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.accelerometer.y[i] ** 2 + swingData.accelerometer.z[i] ** 2)
		);
		
		const maxAccel = Math.max(...accelMagnitudes);
		// 加速度の最大値を10点満点でスコア化
		return { impact: Math.min(10, maxAccel) };
	}

	function getInsightsByType(type: SwingInsight['type']): SwingInsight[] {
		return insights.filter(insight => insight.type === type);
	}

	function getScoreColor(score: number): string {
		if (score >= 8) return '#10b981'; // 緑
		if (score >= 6) return '#f59e0b'; // オレンジ
		return '#ef4444'; // 赤
	}

	function getPriorityIcon(priority: SwingInsight['priority']): string {
		switch (priority) {
			case 'high': return '🔥';
			case 'medium': return '⚠️';
			case 'low': return 'ℹ️';
		}
	}
</script>

<div class="insights-container">
	<h3 class="insights-title">📊 スイング分析レポート</h3>
	
	<!-- サマリー統計 -->
	<div class="summary-stats">
		<div class="stat-item stat-item--strengths">
			<div class="stat-number">{getInsightsByType('strength').length}</div>
			<div class="stat-label">強み</div>
		</div>
		<div class="stat-item stat-item--improvements">
			<div class="stat-number">{getInsightsByType('improvement').length}</div>
			<div class="stat-label">改善点</div>
		</div>
		<div class="stat-item stat-item--overall">
			<div class="stat-number">{(insights.reduce((sum, insight) => sum + insight.score, 0) / insights.length).toFixed(1)}</div>
			<div class="stat-label">総合スコア</div>
		</div>
	</div>

	<!-- 強み -->
	{#if getInsightsByType('strength').length > 0}
		<div class="insights-section">
			<h4 class="section-title section-title--strength">
				✨ あなたの強み
			</h4>
			<div class="insights-grid">
				{#each getInsightsByType('strength') as insight}
					<div class="insight-card insight-card--strength">
						<div class="insight-header">
							<div class="insight-icon-score">
								<span class="insight-icon">{insight.icon}</span>
								<span class="insight-score" style="color: {getScoreColor(insight.score)}">
									{insight.score}/10
								</span>
							</div>
							<span class="priority-badge">{getPriorityIcon(insight.priority)}</span>
						</div>
						<h5 class="insight-title">{insight.title}</h5>
						<p class="insight-description">{insight.description}</p>
						<div class="score-bar">
							<div class="score-fill" style="width: {insight.score * 10}%; background-color: {getScoreColor(insight.score)}"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 改善点 -->
	{#if getInsightsByType('improvement').length > 0}
		<div class="insights-section">
			<h4 class="section-title section-title--improvement">
				🎯 改善のポイント
			</h4>
			<div class="insights-grid">
				{#each getInsightsByType('improvement') as insight}
					<div class="insight-card insight-card--improvement">
						<div class="insight-header">
							<div class="insight-icon-score">
								<span class="insight-icon">{insight.icon}</span>
								<span class="insight-score" style="color: {getScoreColor(insight.score)}">
									{insight.score}/10
								</span>
							</div>
							<span class="priority-badge">{getPriorityIcon(insight.priority)}</span>
						</div>
						<h5 class="insight-title">{insight.title}</h5>
						<p class="insight-description">{insight.description}</p>
						<div class="score-bar">
							<div class="score-fill" style="width: {insight.score * 10}%; background-color: {getScoreColor(insight.score)}"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- その他の分析 -->
	{#if getInsightsByType('neutral').length > 0}
		<div class="insights-section">
			<h4 class="section-title section-title--neutral">
				📋 その他の分析
			</h4>
			<div class="insights-grid">
				{#each getInsightsByType('neutral') as insight}
					<div class="insight-card insight-card--neutral">
						<div class="insight-header">
							<div class="insight-icon-score">
								<span class="insight-icon">{insight.icon}</span>
								<span class="insight-score" style="color: {getScoreColor(insight.score)}">
									{insight.score}/10
								</span>
							</div>
						</div>
						<h5 class="insight-title">{insight.title}</h5>
						<p class="insight-description">{insight.description}</p>
						<div class="score-bar">
							<div class="score-fill" style="width: {insight.score * 10}%; background-color: {getScoreColor(insight.score)}"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.insights-container {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.insights-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 24px;
		text-align: center;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-item {
		text-align: center;
		padding: 16px;
		border-radius: 8px;
		border: 2px solid;
	}

	.stat-item--strengths {
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		border-color: #10b981;
	}

	.stat-item--improvements {
		background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
		border-color: #f59e0b;
	}

	.stat-item--overall {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-color: #3b82f6;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.insights-section {
		margin-bottom: 32px;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 16px;
		padding: 8px 16px;
		border-radius: 8px;
		display: inline-block;
	}

	.section-title--strength {
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		color: #065f46;
	}

	.section-title--improvement {
		background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
		color: #9a3412;
	}

	.section-title--neutral {
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
		color: #374151;
	}

	.insights-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.insight-card {
		border-radius: 8px;
		padding: 20px;
		border: 2px solid;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.insight-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.insight-card--strength {
		background: #f0fdf4;
		border-color: #22c55e;
	}

	.insight-card--improvement {
		background: #fffbeb;
		border-color: #f59e0b;
	}

	.insight-card--neutral {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.insight-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.insight-icon-score {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.insight-icon {
		font-size: 1.5rem;
	}

	.insight-score {
		font-weight: 700;
		font-size: 1rem;
	}

	.priority-badge {
		font-size: 1.2rem;
	}

	.insight-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 8px;
	}

	.insight-description {
		font-size: 0.9rem;
		color: #4b5563;
		line-height: 1.5;
		margin-bottom: 12px;
	}

	.score-bar {
		width: 100%;
		height: 4px;
		background: #e5e7eb;
		border-radius: 2px;
		overflow: hidden;
	}

	.score-fill {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: 2px;
	}

	@media (max-width: 768px) {
		.insights-container {
			padding: 16px;
		}

		.summary-stats {
			grid-template-columns: 1fr;
		}
	}
</style>