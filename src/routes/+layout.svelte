<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
	/* PostCSS / autoprefixer + nesting テスト用のスタイル */
	:global(body) {
		margin: 0;
		padding: 2rem;
		font-family: system-ui, sans-serif;
		
		/* autoprefixer によってベンダープレフィックスが自動追加されるプロパティ */
		display: flex;
		flex-direction: column;
		user-select: none;
		transform: scale(1);
	}
	
	/* postcss-nesting のテスト - 入れ子記法 */
	:global(h1) {
		color: #4a90e2;
		transition: transform 0.3s ease;
		
		&:hover {
			transform: scale(1.05);
			color: #357abd;
		}
		
		@media (max-width: 768px) {
			font-size: 1.5rem;
		}
	}
	
	:global(p) {
		line-height: 1.6;
		
		& a {
			color: #4a90e2;
			text-decoration: none;
			
			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>
