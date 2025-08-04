<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SwingData } from '$lib/api/gemini.js';
	import * as THREE from 'three';

	export let swingData: SwingData;
	export let autoRotate = true;
	export let showGrid = true;

	let container: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let animationFrame: number;
	let swingCurve: THREE.CatmullRomCurve3;
	let swingLine: THREE.Line;
	let impactMarker: THREE.Mesh;
	let controls: any; // OrbitControls（型定義なしで使用）

	// アニメーション関連
	let isAnimating = false;
	let animationProgress = 0;
	let animatedLine: THREE.Line;
	let animatedMarker: THREE.Mesh;

	onMount(async () => {
		if (swingData && container) {
			await initThreeJS();
			createSwing3D();
			animate();
		}
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
		if (renderer) {
			renderer.dispose();
		}
	});

	function createCustomAxes() {
		const axisLength = 12;
		const axisThickness = 0.05;

		// X軸（赤）- 左右の動き
		const xGeometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength);
		const xMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x440000 });
		const xAxis = new THREE.Mesh(xGeometry, xMaterial);
		xAxis.rotation.z = Math.PI / 2;
		xAxis.position.x = axisLength / 2;
		scene.add(xAxis);

		// X軸の矢印
		const xArrowGeometry = new THREE.ConeGeometry(axisThickness * 3, axisThickness * 8);
		const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
		xArrow.rotation.z = -Math.PI / 2;
		xArrow.position.x = axisLength;
		scene.add(xArrow);

		// Y軸（緑）- 上下の動き
		const yGeometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength);
		const yMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x004400 });
		const yAxis = new THREE.Mesh(yGeometry, yMaterial);
		yAxis.position.y = axisLength / 2;
		scene.add(yAxis);

		// Y軸の矢印
		const yArrowGeometry = new THREE.ConeGeometry(axisThickness * 3, axisThickness * 8);
		const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
		yArrow.position.y = axisLength;
		scene.add(yArrow);

		// Z軸（青）- 前後の動き
		const zGeometry = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength);
		const zMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff, emissive: 0x000044 });
		const zAxis = new THREE.Mesh(zGeometry, zMaterial);
		zAxis.rotation.x = Math.PI / 2;
		zAxis.position.z = axisLength / 2;
		scene.add(zAxis);

		// Z軸の矢印
		const zArrowGeometry = new THREE.ConeGeometry(axisThickness * 3, axisThickness * 8);
		const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
		zArrow.rotation.x = -Math.PI / 2;
		zArrow.position.z = axisLength;
		scene.add(zArrow);

		// テキストラベルは CSS2DRenderer を使わずに、シンプルなジオメトリで表現
		// 各軸の端に小さな識別マーカーを追加
		addAxisLabel('X', axisLength + 1, 0, 0, 0xff0000);
		addAxisLabel('Y', 0, axisLength + 1, 0, 0x00ff00);
		addAxisLabel('Z', 0, 0, axisLength + 1, 0x0000ff);
	}

	function addAxisLabel(label: string, x: number, y: number, z: number, color: number) {
		// 簡単な球体でラベルポイントを表現
		const labelGeometry = new THREE.SphereGeometry(0.2);
		const labelMaterial = new THREE.MeshPhongMaterial({ 
			color: color, 
			emissive: color, 
			emissiveIntensity: 0.3 
		});
		const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
		labelMesh.position.set(x, y, z);
		scene.add(labelMesh);
	}

	async function initThreeJS() {
		// シーンの作成
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf8fafc);

		// カメラの設定
		camera = new THREE.PerspectiveCamera(
			75,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		camera.position.set(15, 10, 15);
		camera.lookAt(0, 0, 0);

		// レンダラーの設定
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);

		// ライティング
		const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(20, 20, 20);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		// グリッドの追加
		if (showGrid) {
			const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
			scene.add(gridHelper);

			// カスタム軸の表示（より明確に）
			createCustomAxes();
		}

		// OrbitControlsの追加（動的インポート）
		try {
			const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
			controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.05;
			controls.autoRotate = autoRotate;
			controls.autoRotateSpeed = 2.0;
		} catch (error) {
			console.warn('OrbitControls could not be loaded:', error);
		}
	}

	function createSwing3D() {
		// スイングデータから3D座標を計算
		const points: THREE.Vector3[] = [];
		
		for (let i = 0; i < swingData.gyroscope.x.length; i++) {
			// ジャイロスコープデータを3D座標に変換
			// より現実的なスイング軌道になるよう調整
			const t = i / swingData.gyroscope.x.length;
			const gyroX = swingData.gyroscope.x[i];
			const gyroY = swingData.gyroscope.y[i];
			const gyroZ = swingData.gyroscope.z[i];

			// スイング軌道を計算（円弧状の軌道をシミュレート）
			const radius = 8;
			const angle = (t - 0.5) * Math.PI; // -π/2 から π/2
			
			const x = radius * Math.sin(angle);
			const y = 2 + t * 6 - 3; // 上下の動き
			const z = radius * Math.cos(angle) - radius;

			// ジャイロデータによる微調整
			const adjustedX = x + gyroY * 0.05;
			const adjustedY = y + Math.abs(gyroX) * 0.03;
			const adjustedZ = z + gyroZ * 0.05;

			points.push(new THREE.Vector3(adjustedX, adjustedY, adjustedZ));
		}

		// スプライン曲線を作成
		swingCurve = new THREE.CatmullRomCurve3(points);

		// 完全なスイング軌道
		const curvePoints = swingCurve.getPoints(200);
		const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
		
		// グラデーション効果のためのカラー
		const colors = [];
		for (let i = 0; i < curvePoints.length; i++) {
			const t = i / curvePoints.length;
			// 青から緑、そして赤へのグラデーション
			const hue = (1 - t) * 0.6; // 青(0.6)から赤(0.0)
			const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
			colors.push(color.r, color.g, color.b);
		}
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		const material = new THREE.LineBasicMaterial({ 
			vertexColors: true,
			linewidth: 4
		});
		swingLine = new THREE.Line(geometry, material);
		scene.add(swingLine);

		// インパクトポイントのマーカー
		const impactIndex = findImpactPoint();
		const impactPoint = curvePoints[Math.floor(impactIndex * curvePoints.length)];
		
		const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
		const markerMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xff4444,
			emissive: 0x441111
		});
		impactMarker = new THREE.Mesh(markerGeometry, markerMaterial);
		impactMarker.position.copy(impactPoint);
		scene.add(impactMarker);

		// スイング開始・終了点のマーカー
		const startMarkerGeometry = new THREE.SphereGeometry(0.2, 12, 12);
		const startMarkerMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff });
		const startMarker = new THREE.Mesh(startMarkerGeometry, startMarkerMaterial);
		startMarker.position.copy(curvePoints[0]);
		scene.add(startMarker);

		const endMarkerGeometry = new THREE.SphereGeometry(0.2, 12, 12);
		const endMarkerMaterial = new THREE.MeshPhongMaterial({ color: 0x44ff44 });
		const endMarker = new THREE.Mesh(endMarkerGeometry, endMarkerMaterial);
		endMarker.position.copy(curvePoints[curvePoints.length - 1]);
		scene.add(endMarker);

		// ゴルフクラブ（簡易表現）の追加
		addGolfClub(curvePoints[0]);
	}

	function findImpactPoint(): number {
		// 最大角速度の点をインパクトポイントとする
		const gyroMagnitudes = swingData.gyroscope.x.map((x, i) => 
			Math.sqrt(x ** 2 + swingData.gyroscope.y[i] ** 2 + swingData.gyroscope.z[i] ** 2)
		);
		const maxIndex = gyroMagnitudes.indexOf(Math.max(...gyroMagnitudes));
		return maxIndex / gyroMagnitudes.length;
	}

	function addGolfClub(startPosition: THREE.Vector3) {
		// シャフト
		const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2);
		const shaftMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
		const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
		shaft.position.copy(startPosition);
		shaft.position.y -= 1;
		scene.add(shaft);

		// ヘッド
		const headGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
		const headMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
		const head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.copy(startPosition);
		head.position.y -= 2;
		scene.add(head);
	}

	function startAnimation() {
		if (isAnimating) return;
		
		isAnimating = true;
		animationProgress = 0;

		// アニメーション用の軌道ライン
		const animatedGeometry = new THREE.BufferGeometry();
		const animatedMaterial = new THREE.LineBasicMaterial({ 
			color: 0xff6b00,
			linewidth: 6
		});
		animatedLine = new THREE.Line(animatedGeometry, animatedMaterial);
		scene.add(animatedLine);

		// アニメーション用のマーカー
		const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
		const markerMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xff6b00,
			emissive: 0x332200
		});
		animatedMarker = new THREE.Mesh(markerGeometry, markerMaterial);
		scene.add(animatedMarker);

		animateSwing();
	}

	function animateSwing() {
		if (!isAnimating) return;

		animationProgress += 0.01;
		
		if (animationProgress >= 1) {
			animationProgress = 1;
			isAnimating = false;
		}

		// アニメーション軌道の更新
		const points = swingCurve.getPoints(Math.floor(200 * animationProgress));
		if (points.length > 1) {
			animatedLine.geometry.setFromPoints(points);
			animatedMarker.position.copy(points[points.length - 1]);
		}

		if (isAnimating) {
			setTimeout(animateSwing, 50);
		}
	}

	function stopAnimation() {
		isAnimating = false;
		if (animatedLine) {
			scene.remove(animatedLine);
		}
		if (animatedMarker) {
			scene.remove(animatedMarker);
		}
	}

	function animate() {
		animationFrame = requestAnimationFrame(animate);

		if (controls) {
			controls.update();
		}

		// インパクトマーカーの脈動効果
		if (impactMarker) {
			const scale = 1 + 0.2 * Math.sin(Date.now() * 0.005);
			impactMarker.scale.setScalar(scale);
		}

		renderer.render(scene, camera);
	}

	// ウィンドウリサイズ対応
	function handleResize() {
		if (camera && renderer && container) {
			camera.aspect = container.clientWidth / container.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
		}
	}

	$: if (swingData && scene) {
		// データが更新された場合の再描画
		scene.clear();
		createSwing3D();
	}
</script>

<svelte:window on:resize={handleResize} />

<div class="visualizer-3d">
	<div class="controls-panel">
		<h4 class="title">🎯 3Dスイング軌道</h4>
		<div class="controls">
			<button 
				class="btn btn--small {isAnimating ? 'btn--danger' : 'btn--primary'}"
				on:click={isAnimating ? stopAnimation : startAnimation}
			>
				{isAnimating ? '⏹️ 停止' : '▶️ アニメーション'}
			</button>
			<button 
				class="btn btn--small btn--outline"
				on:click={() => autoRotate = !autoRotate}
			>
				{autoRotate ? '🔄 自動回転ON' : '⏸️ 自動回転OFF'}
			</button>
		</div>
	</div>
	
	<div class="canvas-container" bind:this={container}></div>
	
	<div class="legend">
		<div class="legend-section">
			<h5 class="legend-title">🎯 スイングポイント</h5>
			<div class="legend-items">
				<div class="legend-item">
					<div class="legend-marker legend-marker--start"></div>
					<span>開始点</span>
				</div>
				<div class="legend-item">
					<div class="legend-marker legend-marker--impact"></div>
					<span>インパクト</span>
				</div>
				<div class="legend-item">
					<div class="legend-marker legend-marker--end"></div>
					<span>終了点</span>
				</div>
			</div>
		</div>
		
		<div class="legend-section">
			<h5 class="legend-title">📐 座標軸の説明</h5>
			<div class="legend-items">
				<div class="legend-item">
					<div class="axis-marker axis-marker--x"></div>
					<span><strong>X軸（赤）</strong>: 左右の動き</span>
				</div>
				<div class="legend-item">
					<div class="axis-marker axis-marker--y"></div>
					<span><strong>Y軸（緑）</strong>: 上下の動き</span>
				</div>
				<div class="legend-item">
					<div class="axis-marker axis-marker--z"></div>
					<span><strong>Z軸（青）</strong>: 前後の動き</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.visualizer-3d {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.controls-panel {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		color: white;
		padding: 16px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.controls {
		display: flex;
		gap: 8px;
	}

	.btn {
		padding: 6px 12px;
		border-radius: 6px;
		border: none;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn--small {
		padding: 4px 8px;
		font-size: 0.8rem;
	}

	.btn--primary {
		background: #3b82f6;
		color: white;
	}

	.btn--primary:hover {
		background: #2563eb;
	}

	.btn--danger {
		background: #ef4444;
		color: white;
	}

	.btn--danger:hover {
		background: #dc2626;
	}

	.btn--outline {
		background: transparent;
		color: white;
		border: 1px solid white;
	}

	.btn--outline:hover {
		background: white;
		color: #1e293b;
	}

	.canvas-container {
		width: 100%;
		height: 400px;
		position: relative;
	}

	.legend {
		background: #f8fafc;
		padding: 16px 20px;
		border-top: 1px solid #e2e8f0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}

	.legend-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.legend-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: #334155;
		margin: 0 0 8px 0;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 4px;
	}

	.legend-items {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: #475569;
	}

	.legend-marker {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-marker--start {
		background: #4444ff;
	}

	.legend-marker--impact {
		background: #ff4444;
		animation: pulse 2s infinite;
	}

	.legend-marker--end {
		background: #44ff44;
	}

	.axis-marker {
		width: 16px;
		height: 4px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.axis-marker--x {
		background: linear-gradient(90deg, #ff0000, #ff4444);
		box-shadow: 0 0 4px rgba(255, 0, 0, 0.3);
	}

	.axis-marker--y {
		background: linear-gradient(90deg, #00ff00, #44ff44);
		box-shadow: 0 0 4px rgba(0, 255, 0, 0.3);
	}

	.axis-marker--z {
		background: linear-gradient(90deg, #0000ff, #4444ff);
		box-shadow: 0 0 4px rgba(0, 0, 255, 0.3);
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.2); opacity: 0.7; }
	}

	@media (max-width: 768px) {
		.controls-panel {
			flex-direction: column;
			gap: 12px;
			text-align: center;
		}

		.canvas-container {
			height: 300px;
		}

		.legend {
			grid-template-columns: 1fr;
			gap: 16px;
			padding: 12px 16px;
		}

		.legend-items {
			gap: 4px;
		}

		.legend-item {
			font-size: 0.8rem;
		}
	}
</style>