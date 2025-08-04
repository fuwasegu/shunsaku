<svelte:head>
	<title>取扱機材一覧 - Golf Swing Analyzer</title>
	<meta name="description" content="推奨システムで選択される可能性のあるクラブヘッド・シャフト一覧" />
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { golfDB } from '$lib/database/pglite.js';
	import { loadMasterData } from '$lib/database/data-loader.js';
	import type { ClubHead, Shaft } from '$lib/database/pglite.js';

	let activeTab: 'heads' | 'shafts' = 'heads';
	let clubHeads: ClubHead[] = [];
	let shafts: Shaft[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			// データベースを確実に初期化
			await loadMasterData();
			
			// データ取得
			await loadEquipmentData();
			
		} catch (err) {
			console.error('Failed to load equipment data:', err);
			error = 'データの読み込みに失敗しました';
		} finally {
			loading = false;
		}
	});

	async function loadEquipmentData() {
		try {
			// クラブヘッド取得
			clubHeads = await golfDB.searchClubHeads({});
			
			// シャフト取得（直接SQLで取得）
			const db = golfDB.getDB();
			if (db) {
				const result = await db.query(`
					SELECT id, name, brand, flex, weight, torque, kick_point, characteristics, price, amazon_url
					FROM shafts 
					ORDER BY brand, name
				`);
				
				shafts = result.rows.map((row: any) => ({
					id: row.id,
					name: row.name,
					brand: row.brand,
					flex: row.flex,
					weight: row.weight,
					torque: row.torque,
					kick_point: row.kick_point,
					characteristics: row.characteristics,
					price: row.price,
					amazon_url: row.amazon_url
				}));
			}
			
			console.log('📊 Equipment loaded:', { heads: clubHeads.length, shafts: shafts.length });
			
		} catch (err) {
			console.error('Error loading equipment:', err);
			throw err;
		}
	}

	function switchTab(tab: 'heads' | 'shafts') {
		activeTab = tab;
	}

	function formatPrice(price: number): string {
		return `¥${price.toLocaleString()}`;
	}

	function getBrandColor(brand: string): string {
		const colors: { [key: string]: string } = {
			'TaylorMade': 'bg-blue-100 text-blue-800',
			'Callaway': 'bg-green-100 text-green-800',
			'PING': 'bg-yellow-100 text-yellow-800',
			'Titleist': 'bg-red-100 text-red-800',
			'DUNLOP': 'bg-purple-100 text-purple-800',
			'BRIDGESTONE': 'bg-orange-100 text-orange-800',
			'YAMAHA': 'bg-indigo-100 text-indigo-800',
			'ONOFF': 'bg-pink-100 text-pink-800',
			'HONMA': 'bg-gray-100 text-gray-800',
			'Mizuno': 'bg-cyan-100 text-cyan-800',
			'Fujikura': 'bg-emerald-100 text-emerald-800',
			'Mitsubishi Chemical': 'bg-violet-100 text-violet-800',
			'Graphite Design': 'bg-rose-100 text-rose-800',
			'UST Mamiya': 'bg-amber-100 text-amber-800'
		};
		return colors[brand] || 'bg-gray-100 text-gray-800';
	}
</script>

<main class="gradient-bg">
	<div class="mobile-container">
		<header class="mock-text-center mock-mb-8">
			<h1 class="mock-text-3xl mock-text-gray-900 mock-mb-2">取扱機材一覧</h1>
			<p class="mock-text-gray-600">推奨システムで選択される可能性のある機材です</p>
		</header>

		{#if loading}
			<section class="mock-text-center mock-mb-8">
				<div class="mock-card">
					<div class="icon-circle">
						<span class="mock-animate-spin">⚙️</span>
					</div>
					<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">データ読み込み中...</h2>
				</div>
			</section>
		{:else if error}
			<section class="mock-text-center mock-mb-8">
				<div class="mock-card">
					<div class="icon-circle">
						<span>❌</span>
					</div>
					<h2 class="mock-text-xl mock-text-gray-900 mock-mb-4">エラー</h2>
					<p class="mock-text-gray-600">{error}</p>
				</div>
			</section>
		{:else}
			<!-- タブナビゲーション -->
			<section class="mock-mb-8">
				<div class="equipment-tabs">
					<button 
						class="equipment-tab {activeTab === 'heads' ? 'equipment-tab--active' : ''}"
						on:click={() => switchTab('heads')}
					>
						🏌️ クラブヘッド ({clubHeads.length})
					</button>
					<button 
						class="equipment-tab {activeTab === 'shafts' ? 'equipment-tab--active' : ''}"
						on:click={() => switchTab('shafts')}
					>
						🎯 シャフト ({shafts.length})
					</button>
				</div>
			</section>

			{#if activeTab === 'heads'}
				<!-- クラブヘッド一覧 -->
				<section class="equipment-grid">
					{#each clubHeads as head}
						<div class="equipment-card">
							<div class="equipment-header">
								<div class="equipment-brand {getBrandColor(head.brand)}">
									{head.brand}
								</div>
								<div class="equipment-type">
									{head.type}
								</div>
							</div>
							
							<h3 class="equipment-name">{head.name}</h3>
							
							<div class="equipment-specs">
								<div class="spec-item">
									<span class="spec-label">ロフト:</span>
									<span class="spec-value">{head.loft}°</span>
								</div>
								<div class="spec-item">
									<span class="spec-label">価格:</span>
									<span class="spec-value">{formatPrice(head.price)}</span>
								</div>
							</div>

							<div class="equipment-characteristics">
								{#each head.characteristics.slice(0, 3) as char}
									<span class="characteristic-tag">{char}</span>
								{/each}
								{#if head.characteristics.length > 3}
									<span class="characteristic-more">+{head.characteristics.length - 3}</span>
								{/if}
							</div>

							<div class="equipment-actions">
								<a 
									href={head.amazon_url} 
									target="_blank" 
									rel="noopener noreferrer"
									class="equipment-link"
								>
									詳細を見る →
								</a>
							</div>
						</div>
					{/each}
				</section>
			{:else}
				<!-- シャフト一覧 -->
				<section class="equipment-grid">
					{#each shafts as shaft}
						<div class="equipment-card">
							<div class="equipment-header">
								<div class="equipment-brand {getBrandColor(shaft.brand)}">
									{shaft.brand}
								</div>
								<div class="equipment-flex">
									{shaft.flex}フレックス
								</div>
							</div>
							
							<h3 class="equipment-name">{shaft.name}</h3>
							
							<div class="equipment-specs">
								<div class="spec-item">
									<span class="spec-label">重量:</span>
									<span class="spec-value">{shaft.weight}g</span>
								</div>
								<div class="spec-item">
									<span class="spec-label">トルク:</span>
									<span class="spec-value">{shaft.torque}</span>
								</div>
								<div class="spec-item">
									<span class="spec-label">調子:</span>
									<span class="spec-value">{shaft.kick_point}</span>
								</div>
								<div class="spec-item">
									<span class="spec-label">価格:</span>
									<span class="spec-value">{formatPrice(shaft.price)}</span>
								</div>
							</div>

							<div class="equipment-characteristics">
								{#each shaft.characteristics.slice(0, 3) as char}
									<span class="characteristic-tag">{char}</span>
								{/each}
								{#if shaft.characteristics.length > 3}
									<span class="characteristic-more">+{shaft.characteristics.length - 3}</span>
								{/if}
							</div>

							<div class="equipment-actions">
								<a 
									href={shaft.amazon_url} 
									target="_blank" 
									rel="noopener noreferrer"
									class="equipment-link"
								>
									詳細を見る →
								</a>
							</div>
						</div>
					{/each}
				</section>
			{/if}

			<!-- 戻るボタン -->
			<section class="mock-text-center mock-mt-8">
				<a href="/" class="mock-btn mock-btn--outline">
					← スイング解析に戻る
				</a>
			</section>
		{/if}
	</div>
</main>

<style>
	/* タブナビゲーション */
	.equipment-tabs {
		display: flex;
		border-bottom: 2px solid rgb(229, 231, 235);
		margin-bottom: 2rem;
	}

	.equipment-tab {
		flex: 1;
		padding: 1rem;
		background: none;
		border: none;
		font-size: 1rem;
		font-weight: 500;
		color: rgb(107, 114, 128);
		cursor: pointer;
		transition: all 0.2s;
		border-bottom: 2px solid transparent;
	}

	.equipment-tab--active {
		color: rgb(59, 130, 246);
		border-bottom-color: rgb(59, 130, 246);
		background: rgb(239, 246, 255);
	}

	.equipment-tab:hover {
		background: rgb(249, 250, 251);
	}

	/* 機材グリッド */
	.equipment-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.equipment-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.equipment-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* 機材カード */
	.equipment-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		border: 1px solid rgb(229, 231, 235);
		transition: all 0.2s;
	}

	.equipment-card:hover {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		transform: translateY(-2px);
	}

	.equipment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.equipment-brand {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.equipment-type, .equipment-flex {
		font-size: 0.875rem;
		color: rgb(107, 114, 128);
		font-weight: 500;
		text-transform: uppercase;
	}

	.equipment-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: rgb(17, 24, 39);
		margin-bottom: 1rem;
		line-height: 1.4;
	}

	.equipment-specs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.spec-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.spec-label {
		font-size: 0.875rem;
		color: rgb(107, 114, 128);
	}

	.spec-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(17, 24, 39);
	}

	.equipment-characteristics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.characteristic-tag {
		padding: 0.25rem 0.5rem;
		background: rgb(243, 244, 246);
		color: rgb(55, 65, 81);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.characteristic-more {
		padding: 0.25rem 0.5rem;
		background: rgb(229, 231, 235);
		color: rgb(107, 114, 128);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.equipment-actions {
		border-top: 1px solid rgb(229, 231, 235);
		padding-top: 1rem;
	}

	.equipment-link {
		color: rgb(59, 130, 246);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: color 0.2s;
	}

	.equipment-link:hover {
		color: rgb(37, 99, 235);
		text-decoration: underline;
	}

	/* カラーパレット */
	.bg-blue-100 { background-color: rgb(219, 234, 254); }
	.text-blue-800 { color: rgb(30, 64, 175); }
	.bg-green-100 { background-color: rgb(220, 252, 231); }
	.text-green-800 { color: rgb(22, 101, 52); }
	.bg-yellow-100 { background-color: rgb(254, 249, 195); }
	.text-yellow-800 { color: rgb(133, 77, 14); }
	.bg-red-100 { background-color: rgb(254, 226, 226); }
	.text-red-800 { color: rgb(153, 27, 27); }
	.bg-purple-100 { background-color: rgb(243, 232, 255); }
	.text-purple-800 { color: rgb(107, 33, 168); }
	.bg-orange-100 { background-color: rgb(255, 237, 213); }
	.text-orange-800 { color: rgb(154, 52, 18); }
	.bg-indigo-100 { background-color: rgb(224, 231, 255); }
	.text-indigo-800 { color: rgb(55, 48, 163); }
	.bg-pink-100 { background-color: rgb(252, 231, 243); }
	.text-pink-800 { color: rgb(157, 23, 77); }
	.bg-gray-100 { background-color: rgb(243, 244, 246); }
	.text-gray-800 { color: rgb(31, 41, 55); }
	.bg-cyan-100 { background-color: rgb(207, 250, 254); }
	.text-cyan-800 { color: rgb(21, 94, 117); }
	.bg-emerald-100 { background-color: rgb(209, 250, 229); }
	.text-emerald-800 { color: rgb(6, 95, 70); }
	.bg-violet-100 { background-color: rgb(237, 233, 254); }
	.text-violet-800 { color: rgb(91, 33, 182); }
	.bg-rose-100 { background-color: rgb(255, 228, 230); }
	.text-rose-800 { color: rgb(159, 18, 57); }
	.bg-amber-100 { background-color: rgb(254, 243, 199); }
	.text-amber-800 { color: rgb(146, 64, 14); }
</style>