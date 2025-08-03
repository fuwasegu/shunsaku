<svelte:head>
	<title>Shunsaku - Material Design 3 アプリケーション</title>
	<meta name="description" content="Material Design 3をベースとしたモダンなWebアプリケーション" />
</svelte:head>

<script>
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
</script>

<!-- ナビゲーション -->
<nav class="nav-responsive">
	<div class="nav__brand">Shunsaku</div>
	<div class="nav__menu">
		<a href="/" class="nav__item nav__item--active">ホーム</a>
		<a href="/about" class="nav__item">概要</a>
		<a href="/contact" class="nav__item">お問い合わせ</a>
		<a href="/internal/design-demo" class="nav__item">デザインシステム</a>
		<ThemeSelector />
	</div>
</nav>

<main class="container responsive-padding">
	<!-- ヒーローセクション -->
	<section class="responsive-margin text-center">
		<h1 class="responsive-display-large text-on-surface m-0">
			Welcome to Shunsaku
		</h1>
		<p class="body-large text-on-surface-variant responsive-margin">
			Material Design 3をベースとしたモダンなWebアプリケーション
		</p>
		<div class="flex gap-4 justify-center flex-col-compact flex-row-medium">
			<button class="btn btn--filled">はじめる</button>
			<button class="btn btn--outlined">詳細を見る</button>
		</div>
	</section>

	<!-- 機能紹介セクション -->
	<section class="responsive-margin">
		<h2 class="responsive-headline text-on-surface text-center m-4">主な機能</h2>
		<div class="grid-responsive-3 responsive-gap">
			<div class="card-responsive card--elevated text-center">
				<div class="card__content">
					<div class="w-16 h-16 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
						<span class="headline-medium text-primary">🎨</span>
					</div>
					<h3 class="title-large text-on-surface">Modern Design</h3>
					<p class="body-medium text-on-surface-variant">
						Material Design 3をベースとした美しく直感的なユーザーインターフェース
					</p>
				</div>
			</div>
			
			<div class="card-responsive card--elevated text-center">
				<div class="card__content">
					<div class="w-16 h-16 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
						<span class="headline-medium text-primary">📱</span>
					</div>
					<h3 class="title-large text-on-surface">Responsive</h3>
					<p class="body-medium text-on-surface-variant">
						あらゆるデバイスサイズに対応したレスポンシブデザイン
					</p>
				</div>
			</div>
			
			<div class="card-responsive card--elevated text-center">
				<div class="card__content">
					<div class="w-16 h-16 rounded-full surface-container-high flex items-center justify-center m-auto m-4">
						<span class="headline-medium text-primary">⚡</span>
					</div>
					<h3 class="title-large text-on-surface">Fast Performance</h3>
					<p class="body-medium text-on-surface-variant">
						SvelteKitによる高速なパフォーマンスと優れた開発体験
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- お問い合わせセクション -->
	<section class="responsive-margin">
		<div class="card-responsive card--outlined">
			<div class="card__content">
				<h2 class="responsive-headline text-on-surface text-center m-4">お問い合わせ</h2>
				<p class="body-large text-on-surface-variant text-center responsive-margin">
					ご質問やご要望がございましたら、お気軽にお問い合わせください。
				</p>
				
				<form class="flex flex-col gap-6 responsive-padding">
					<div class="grid-responsive-2 responsive-gap">
						<div class="form-field">
							<label for="contact-name" class="form-label">お名前 *</label>
							<input type="text" id="contact-name" class="form-input" placeholder="田中太郎" required />
						</div>
						<div class="form-field">
							<label for="contact-email" class="form-label">メールアドレス *</label>
							<input type="email" id="contact-email" class="form-input" placeholder="example@email.com" required />
						</div>
					</div>
					
					<div class="form-field">
						<label for="contact-subject" class="form-label">件名</label>
						<input type="text" id="contact-subject" class="form-input" placeholder="お問い合わせ件名" />
					</div>
					
					<div class="form-field">
						<label for="contact-message" class="form-label">メッセージ *</label>
						<textarea id="contact-message" class="form-textarea" placeholder="お問い合わせ内容をご記入ください" required></textarea>
					</div>
					
					<div class="flex gap-4 items-center">
						<input type="checkbox" id="contact-privacy" class="form-checkbox" required />
						<label for="contact-privacy" class="body-medium text-on-surface">
							プライバシーポリシーに同意します *
						</label>
					</div>
					
					<div class="flex gap-3 justify-center">
						<button type="submit" class="btn btn--filled">送信する</button>
						<button type="reset" class="btn btn--outlined">リセット</button>
					</div>
				</form>
			</div>
		</div>
	</section>

	<!-- フッター -->
	<footer class="responsive-margin text-center">
		<div class="flex gap-4 justify-center flex-wrap">
			<a href="/internal/design-demo" class="chip chip--suggestion">デザインシステム</a>
			<span class="chip chip--assist">Privacy Policy</span>
			<span class="chip chip--assist">Terms of Service</span>
		</div>
		<p class="body-small text-on-surface-variant m-8">
			© 2024 Shunsaku. All rights reserved.
		</p>
	</footer>
</main>