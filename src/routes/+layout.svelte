<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/index.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Shunsaku - Material Design 3 デザインシステム</title>
	<meta name="description" content="Material Design 3をベースとしたシンプルでスタイリッシュなモダンなUIデザインシステム" />
</svelte:head>

{@render children?.()}
