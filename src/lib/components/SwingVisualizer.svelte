<script lang="ts">
	import { onMount } from 'svelte';
	import type { MotionReading } from '$lib/sensors/motion-detector.js';
	import type { SwingData } from '$lib/api/gemini.js';

	export let swingData: SwingData | null = null;
	export let isRealtime = false;
	export let isPlaying = false;
	
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationId: number;
	let currentFrame = 0;
	let maxFrames = 0;
	
	// 軌道の可視化用データ
	let trail: { x: number; y: number; intensity: number; timestamp: number }[] = [];
	let centerX = 200;
	let centerY = 200;
	
	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d')!;
			centerX = canvas.width / 2;
			centerY = canvas.height / 2;
			
			if (swingData && !isRealtime) {
				maxFrames = swingData.gyroscope.x.length;
				if (isPlaying) {
					playAnimation();
				} else {
					drawCompleteSwing();
				}
			} else {
				// リアルタイム描画の準備
				drawBackground();
			}
		}
	});

	// リアルタイムでのデータ更新
	export function addRealtimeData(reading: MotionReading) {
		if (!ctx || !isRealtime) return;
		
		// ジャイロスコープデータから軌道を計算
		const gyroMagnitude = Math.sqrt(
			reading.gyroscope.x ** 2 + 
			reading.gyroscope.y ** 2 + 
			reading.gyroscope.z ** 2
		);
		
		// 加速度データから位置を推定
		const x = centerX + (reading.gyroscope.y * 10);
		const y = centerY + (reading.gyroscope.x * 10);
		const intensity = Math.min(1, gyroMagnitude / 30);
		
		trail.push({ x, y, intensity, timestamp: reading.timestamp });
		
		// 軌道の長さを制限（最大50ポイント）
		if (trail.length > 50) {
			trail.shift();
		}
		
		drawRealtimeFrame();
	}

	function drawBackground() {
		if (!ctx) return;
		
		// 背景をクリア
		ctx.fillStyle = '#f5f5f5';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		// 中心点
		ctx.fillStyle = '#666';
		ctx.beginPath();
		ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
		ctx.fill();
		
		// グリッド線
		ctx.strokeStyle = '#e0e0e0';
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);
		
		// 垂直線
		ctx.beginPath();
		ctx.moveTo(centerX, 0);
		ctx.lineTo(centerX, canvas.height);
		ctx.stroke();
		
		// 水平線
		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(canvas.width, centerY);
		ctx.stroke();
		
		ctx.setLineDash([]);
	}

	function drawRealtimeFrame() {
		if (!ctx) return;
		
		drawBackground();
		
		// 軌道を描画
		if (trail.length > 1) {
			for (let i = 1; i < trail.length; i++) {
				const prev = trail[i - 1];
				const curr = trail[i];
				const alpha = (i / trail.length) * curr.intensity;
				
				ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
				ctx.lineWidth = 2 + curr.intensity * 3;
				ctx.lineCap = 'round';
				
				ctx.beginPath();
				ctx.moveTo(prev.x, prev.y);
				ctx.lineTo(curr.x, curr.y);
				ctx.stroke();
			}
		}
		
		// 現在位置を強調
		if (trail.length > 0) {
			const current = trail[trail.length - 1];
			ctx.fillStyle = `rgba(59, 130, 246, ${current.intensity})`;
			ctx.beginPath();
			ctx.arc(current.x, current.y, 3 + current.intensity * 5, 0, 2 * Math.PI);
			ctx.fill();
		}
	}

	function drawCompleteSwing() {
		if (!ctx || !swingData) return;
		
		drawBackground();
		
		const points = [];
		for (let i = 0; i < swingData.gyroscope.x.length; i++) {
			const gyroX = swingData.gyroscope.x[i];
			const gyroY = swingData.gyroscope.y[i];
			const gyroZ = swingData.gyroscope.z[i];
			
			const magnitude = Math.sqrt(gyroX ** 2 + gyroY ** 2 + gyroZ ** 2);
			const x = centerX + (gyroY * 8);
			const y = centerY + (gyroX * 8);
			const intensity = Math.min(1, magnitude / 25);
			
			points.push({ x, y, intensity, index: i });
		}
		
		// 軌道を描画
		if (points.length > 1) {
			for (let i = 1; i < points.length; i++) {
				const prev = points[i - 1];
				const curr = points[i];
				const progress = i / points.length;
				
				// グラデーション効果
				const hue = 200 + (progress * 60); // 青から緑へ
				ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${curr.intensity * 0.8})`;
				ctx.lineWidth = 1 + curr.intensity * 4;
				ctx.lineCap = 'round';
				
				ctx.beginPath();
				ctx.moveTo(prev.x, prev.y);
				ctx.lineTo(curr.x, curr.y);
				ctx.stroke();
			}
		}
		
		// インパクトポイントを強調（最大強度の点）
		let maxIntensity = 0;
		let impactPoint = null;
		for (const point of points) {
			if (point.intensity > maxIntensity) {
				maxIntensity = point.intensity;
				impactPoint = point;
			}
		}
		
		if (impactPoint) {
			ctx.fillStyle = '#ef4444';
			ctx.beginPath();
			ctx.arc(impactPoint.x, impactPoint.y, 8, 0, 2 * Math.PI);
			ctx.fill();
			
			ctx.fillStyle = '#ffffff';
			ctx.font = '12px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText('⚡', impactPoint.x, impactPoint.y + 4);
		}
	}

	function playAnimation() {
		if (!ctx || !swingData || currentFrame >= maxFrames) {
			currentFrame = 0;
			return;
		}
		
		drawBackground();
		
		// 現在のフレームまでの軌道を描画
		const points = [];
		for (let i = 0; i <= currentFrame && i < swingData.gyroscope.x.length; i++) {
			const gyroX = swingData.gyroscope.x[i];
			const gyroY = swingData.gyroscope.y[i];
			const gyroZ = swingData.gyroscope.z[i];
			
			const magnitude = Math.sqrt(gyroX ** 2 + gyroY ** 2 + gyroZ ** 2);
			const x = centerX + (gyroY * 8);
			const y = centerY + (gyroX * 8);
			const intensity = Math.min(1, magnitude / 25);
			
			points.push({ x, y, intensity });
		}
		
		// 軌道を描画
		if (points.length > 1) {
			for (let i = 1; i < points.length; i++) {
				const prev = points[i - 1];
				const curr = points[i];
				const alpha = i / points.length;
				
				ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * curr.intensity})`;
				ctx.lineWidth = 1 + curr.intensity * 3;
				ctx.lineCap = 'round';
				
				ctx.beginPath();
				ctx.moveTo(prev.x, prev.y);
				ctx.lineTo(curr.x, curr.y);
				ctx.stroke();
			}
		}
		
		// 現在位置
		if (points.length > 0) {
			const current = points[points.length - 1];
			ctx.fillStyle = '#3b82f6';
			ctx.beginPath();
			ctx.arc(current.x, current.y, 4 + current.intensity * 4, 0, 2 * Math.PI);
			ctx.fill();
		}
		
		currentFrame++;
		
		if (isPlaying && currentFrame < maxFrames) {
			animationId = requestAnimationFrame(() => {
				setTimeout(playAnimation, 50); // 50ms間隔でアニメーション
			});
		}
	}

	export function startAnimation() {
		if (swingData) {
			currentFrame = 0;
			isPlaying = true;
			playAnimation();
		}
	}

	export function stopAnimation() {
		isPlaying = false;
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	}

	export function resetAnimation() {
		currentFrame = 0;
		trail = [];
		if (ctx) {
			drawBackground();
		}
	}
</script>

<div class="swing-visualizer">
	<canvas
		bind:this={canvas}
		width="400"
		height="400"
		class="swing-canvas"
	></canvas>
	
	{#if !isRealtime && swingData}
		<div class="controls">
			<button 
				class="btn btn--outlined btn--small"
				on:click={startAnimation}
				disabled={isPlaying}
			>
				▶️ 再生
			</button>
			<button 
				class="btn btn--outlined btn--small"
				on:click={stopAnimation}
				disabled={!isPlaying}
			>
				⏸️ 停止
			</button>
			<button 
				class="btn btn--outlined btn--small"
				on:click={resetAnimation}
			>
				🔄 リセット
			</button>
		</div>
		
		{#if maxFrames > 0}
			<div class="progress-info">
				<p class="body-small text-on-surface-variant">
					フレーム: {currentFrame} / {maxFrames}
				</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.swing-visualizer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-4);
	}

	.swing-canvas {
		border: 2px solid var(--color-outline-variant);
		border-radius: var(--radius-md);
		background: #f8f9fa;
		max-width: 100%;
		height: auto;
	}

	.controls {
		display: flex;
		gap: var(--spacing-2);
		flex-wrap: wrap;
		justify-content: center;
	}

	.progress-info {
		text-align: center;
	}

	@media (max-width: 480px) {
		.swing-canvas {
			width: 100%;
			max-width: 350px;
		}
	}
</style>