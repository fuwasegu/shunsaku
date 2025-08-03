<script lang="ts">
	import { themeStore, themeInfo, type ThemeColor, type ThemeMode } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let { isOpen = false } = $props();

	let currentTheme = $state($themeStore);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		themeStore.init();
	});

	// ストアの変更を監視
	$effect(() => {
		currentTheme = $themeStore;
	});

	function handleColorChange(color: ThemeColor) {
		themeStore.setColor(color);
	}

	function handleModeChange(mode: ThemeMode) {
		themeStore.setMode(mode);
	}

	function toggleSelector() {
		isOpen = !isOpen;
	}
</script>

<div class="theme-selector">
	<!-- テーマ切り替えボタン -->
	<button 
		class="btn btn--icon theme-selector__trigger"
		onclick={toggleSelector}
		aria-label="テーマを変更"
		title="テーマを変更"
	>
		🎨
	</button>

	<!-- テーマ選択パネル -->
	{#if isOpen}
		<div class="theme-selector__panel card card--elevated">
			<div class="card__header">
				<h3 class="title-medium text-on-surface">テーマを選択</h3>
				<button 
					class="btn btn--icon"
					onclick={toggleSelector}
					aria-label="閉じる"
				>
					✕
				</button>
			</div>
			
			<div class="card__content">
				<!-- モード選択 -->
				<div class="theme-selector__section">
					<h4 class="title-small text-on-surface m-2">表示モード</h4>
					<div class="theme-selector__modes">
						{#each themeInfo.modes as mode}
							<button
								class="chip {currentTheme.mode === mode.id ? 'chip--filter chip--selected' : 'chip--filter'}"
								onclick={() => handleModeChange(mode.id)}
							>
								{mode.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- カラーテーマ選択 -->
				<div class="theme-selector__section">
					<h4 class="title-small text-on-surface m-2">カラーテーマ</h4>
					
					<!-- カテゴリ別にグループ化 -->
					{#each ['ビジネス', 'ナチュラル', 'クリエイティブ', 'エレガント', 'ミニマル'] as category}
						{@const categoryThemes = themeInfo.colors.filter(theme => theme.category === category)}
						{#if categoryThemes.length > 0}
							<div class="theme-selector__category">
								<h5 class="label-large text-on-surface-variant m-1">{category}</h5>
								<div class="theme-selector__themes">
									{#each categoryThemes as theme}
										<button
											class="theme-selector__theme {currentTheme.color === theme.id ? 'theme-selector__theme--selected' : ''}"
											onclick={() => handleColorChange(theme.id)}
											title={theme.description}
										>
											<div 
												class="theme-selector__preview"
												style="background-color: {theme.preview};"
											></div>
											<div class="theme-selector__info">
												<span class="label-medium text-on-surface">{theme.name}</span>
												<span class="body-small text-on-surface-variant">{theme.description}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- クリック外しで閉じる -->
{#if isOpen}
	<div 
		class="theme-selector__backdrop"
		role="button"
		tabindex="0"
		onclick={toggleSelector}
		onkeydown={(e) => e.key === 'Escape' && toggleSelector()}
		aria-label="テーマセレクターを閉じる"
	></div>
{/if}

<style>
	.theme-selector {
		position: relative;
		z-index: var(--z-dropdown);
	}

	.theme-selector__trigger {
		font-size: 1.2rem;
	}

	.theme-selector__panel {
		position: absolute;
		top: calc(100% + var(--spacing-2));
		right: 0;
		width: 320px;
		max-height: 80vh;
		overflow-y: auto;
		z-index: var(--z-dropdown);
		
		@media (max-width: 599px) {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: calc(100vw - var(--spacing-8));
			max-width: 400px;
		}
	}

	.theme-selector__backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.3);
		z-index: calc(var(--z-dropdown) - 1);
	}

	.theme-selector__section {
		margin-bottom: var(--spacing-6);
		
		&:last-child {
			margin-bottom: 0;
		}
	}

	.theme-selector__modes {
		display: flex;
		gap: var(--spacing-2);
		flex-wrap: wrap;
	}

	.theme-selector__category {
		margin-bottom: var(--spacing-4);
		
		&:last-child {
			margin-bottom: 0;
		}
	}

	.theme-selector__themes {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.theme-selector__theme {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		padding: var(--spacing-3);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-standard);
		background-color: transparent;
		border: 1px solid var(--color-outline-variant);
		
		&:hover {
			background-color: var(--color-surface-container-high);
		}
		
		&.theme-selector__theme--selected {
			background-color: var(--color-primary-container);
			border-color: var(--color-primary);
			color: var(--color-on-primary-container);
		}
	}

	.theme-selector__preview {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		border: 2px solid var(--color-outline-variant);
		flex-shrink: 0;
	}

	.theme-selector__info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-1);
		text-align: left;
	}

	.card__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>