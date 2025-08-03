<script>
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import ThemeDemo from '$lib/components/ThemeDemo.svelte';
</script>

<svelte:head>
	<title>Design System Demo - Shunsaku</title>
	<meta name="description" content="Material Design 3ベースのデザインシステム デモページ" />
</svelte:head>

<!-- 独立したデモページヘッダー -->
<header class="demo-header">
	<div class="container flex justify-between items-center responsive-padding">
		<div>
			<h1 class="title-large text-on-surface">🎨 Design System Demo</h1>
			<p class="body-small text-on-surface-variant">Material Design 3 ベースのデザインシステム</p>
		</div>
		<div class="flex gap-4 items-center">
			<a href="/" class="btn btn--outlined">TOPに戻る</a>
			<ThemeSelector />
		</div>
	</div>
</header>

<main class="container responsive-padding">
	<!-- テーマデモセクション -->
	<section class="responsive-margin">
		<ThemeDemo />
	</section>

	<!-- ヒーローセクション -->
	<section class="responsive-margin text-center-compact text-left-medium">
		<h1 class="responsive-display-large text-primary m-0">
			Shunsaku Design System
		</h1>
		<p class="body-large text-on-surface-variant responsive-margin">
			Material Design 3をベースとしたシンプルでスタイリッシュなモダンなUIデザインシステム
		</p>
		<div class="flex gap-4 justify-center flex-col-compact flex-row-medium">
			<button class="btn btn--filled">Get Started</button>
			<button class="btn btn--outlined">Documentation</button>
		</div>
	</section>

	<!-- カラーシステムセクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface m-4">カラーシステム</h2>
		<div class="grid-responsive-3 responsive-gap">
			<div class="card-responsive card--elevated">
				<div class="card__header">
					<h3 class="title-large text-primary">Primary</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-2 flex-col">
						<div class="w-full h-12 rounded-sm" style="background-color: var(--color-primary);"></div>
						<p class="body-small text-on-surface-variant">メインアクション、重要な要素</p>
					</div>
				</div>
			</div>
			
			<div class="card-responsive card--elevated">
				<div class="card__header">
					<h3 class="title-large text-secondary">Secondary</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-2 flex-col">
						<div class="w-full h-12 rounded-sm" style="background-color: var(--color-secondary);"></div>
						<p class="body-small text-on-surface-variant">サブアクション、補助要素</p>
					</div>
				</div>
			</div>
			
			<div class="card-responsive card--elevated">
				<div class="card__header">
					<h3 class="title-large text-tertiary">Tertiary</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-2 flex-col">
						<div class="w-full h-12 rounded-sm" style="background-color: var(--color-tertiary);"></div>
						<p class="body-small text-on-surface-variant">アクセント、装飾要素</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- タイポグラフィセクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface m-4">タイポグラフィ</h2>
		<div class="card-responsive card--outlined">
			<div class="card__content flex flex-col gap-6">
				<div>
					<h1 class="display-large text-on-surface">Display Large</h1>
					<p class="body-small text-on-surface-variant">3.5rem / 56px - ヒーロータイトル、重要なメッセージ</p>
				</div>
				<div>
					<h2 class="headline-large text-on-surface">Headline Large</h2>
					<p class="body-small text-on-surface-variant">2rem / 32px - セクションタイトル、主要見出し</p>
				</div>
				<div>
					<h3 class="title-large text-on-surface">Title Large</h3>
					<p class="body-small text-on-surface-variant">1.375rem / 22px - カードタイトル、小見出し</p>
				</div>
				<div>
					<p class="body-large text-on-surface">Body Large - 1rem / 16px - 本文テキスト、説明文</p>
				</div>
				<div>
					<p class="label-large text-on-surface">Label Large - 0.875rem / 14px - ボタンラベル、フォームラベル</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ボタンコンポーネントセクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface m-4">ボタンコンポーネント</h2>
		<div class="grid-responsive-2 responsive-gap">
			<div class="card-responsive card--filled">
				<div class="card__header">
					<h3 class="title-medium text-on-surface">Filled Buttons</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-3 flex-col">
						<button class="btn btn--filled">Primary Action</button>
						<button class="btn btn--filled" disabled>Disabled</button>
					</div>
				</div>
			</div>
			
			<div class="card-responsive card--filled">
				<div class="card__header">
					<h3 class="title-medium text-on-surface">Outlined Buttons</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-3 flex-col">
						<button class="btn btn--outlined">Secondary Action</button>
						<button class="btn btn--outlined" disabled>Disabled</button>
					</div>
				</div>
			</div>
			
			<div class="card-responsive card--filled">
				<div class="card__header">
					<h3 class="title-medium text-on-surface">Text Buttons</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-3 flex-col">
						<button class="btn btn--text">Text Action</button>
						<button class="btn btn--text" disabled>Disabled</button>
					</div>
				</div>
			</div>
			
			<div class="card-responsive card--filled">
				<div class="card__header">
					<h3 class="title-medium text-on-surface">Tonal Buttons</h3>
				</div>
				<div class="card__content">
					<div class="flex gap-3 flex-col">
						<button class="btn btn--tonal">Tonal Action</button>
						<button class="btn btn--tonal" disabled>Disabled</button>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- チップコンポーネントセクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface m-4">チップコンポーネント</h2>
		<div class="card-responsive card--outlined">
			<div class="card__content flex flex-col gap-4">
				<div>
					<h4 class="title-small text-on-surface m-2">Filter Chips</h4>
					<div class="flex gap-2 flex-wrap">
						<span class="chip chip--filter chip--selected">選択済み</span>
						<span class="chip chip--filter">フィルター1</span>
						<span class="chip chip--filter">フィルター2</span>
						<span class="chip chip--filter">フィルター3</span>
					</div>
				</div>
				<div>
					<h4 class="title-small text-on-surface m-2">Input Chips</h4>
					<div class="flex gap-2 flex-wrap">
						<span class="chip chip--input">タグ1</span>
						<span class="chip chip--input">タグ2</span>
						<span class="chip chip--input chip--selected">選択済みタグ</span>
					</div>
				</div>
				<div>
					<h4 class="title-small text-on-surface m-2">Suggestion Chips</h4>
					<div class="flex gap-2 flex-wrap">
						<span class="chip chip--suggestion">提案1</span>
						<span class="chip chip--suggestion">提案2</span>
						<span class="chip chip--suggestion">提案3</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- フォームコンポーネントセクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface m-4">フォームコンポーネント</h2>
		<div class="card-responsive card--elevated">
			<div class="card__content">
				<form class="flex flex-col gap-6">
					<div class="grid-responsive-2 responsive-gap">
						<div class="form-field">
							<label for="demo-name" class="form-label">名前</label>
							<input type="text" id="demo-name" class="form-input" placeholder="お名前を入力してください" />
						</div>
						<div class="form-field">
							<label for="demo-email" class="form-label">メールアドレス</label>
							<input type="email" id="demo-email" class="form-input" placeholder="example@email.com" />
						</div>
					</div>
					
					<div class="form-field">
						<label for="demo-message" class="form-label">メッセージ</label>
						<textarea id="demo-message" class="form-textarea" placeholder="メッセージを入力してください"></textarea>
					</div>
					
					<div class="flex gap-4 items-center">
						<input type="checkbox" id="demo-agree" class="form-checkbox" />
						<label for="demo-agree" class="body-medium text-on-surface">利用規約に同意します</label>
					</div>
					
					<div class="flex gap-3">
						<button type="submit" class="btn btn--filled">送信</button>
						<button type="button" class="btn btn--outlined">キャンセル</button>
					</div>
				</form>
			</div>
		</div>
	</section>

	<!-- エレベーション（影）セクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface m-4">エレベーション</h2>
		<div class="grid-responsive responsive-gap">
			<div class="card p-4 elevation-0 surface-container">
				<h4 class="title-small text-on-surface">Elevation 0</h4>
				<p class="body-small text-on-surface-variant">ベースレベル</p>
			</div>
			<div class="card p-4 elevation-1 surface-container">
				<h4 class="title-small text-on-surface">Elevation 1</h4>
				<p class="body-small text-on-surface-variant">カード、ボタン</p>
			</div>
			<div class="card p-4 elevation-2 surface-container">
				<h4 class="title-small text-on-surface">Elevation 2</h4>
				<p class="body-small text-on-surface-variant">ホバー状態</p>
			</div>
			<div class="card p-4 elevation-3 surface-container">
				<h4 class="title-small text-on-surface">Elevation 3</h4>
				<p class="body-small text-on-surface-variant">FAB、ドロップダウン</p>
			</div>
			<div class="card p-4 elevation-4 surface-container">
				<h4 class="title-small text-on-surface">Elevation 4</h4>
				<p class="body-small text-on-surface-variant">モーダル</p>
			</div>
			<div class="card p-4 elevation-5 surface-container">
				<h4 class="title-small text-on-surface">Elevation 5</h4>
				<p class="body-small text-on-surface-variant">最高レベル</p>
			</div>
		</div>
	</section>

</main>

<style>
	.demo-header {
		background-color: var(--color-surface-container);
		border-bottom: 1px solid var(--color-outline-variant);
		padding: var(--spacing-4) 0;
		margin-bottom: var(--spacing-6);
	}
	
	@media (max-width: 599px) {
		.demo-header .flex {
			flex-direction: column;
			gap: var(--spacing-4);
			text-align: center;
		}
	}
</style>