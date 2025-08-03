<script lang="ts">
	import { themeStore, setThemeByName } from '$lib/stores/theme';

	// テーマ変更のサンプル関数
	function changeTheme(themeName: string) {
		const success = setThemeByName(themeName);
		if (success) {
			console.log(`テーマを「${themeName}」に変更しました`);
		} else {
			console.warn(`テーマ「${themeName}」が見つかりませんでした`);
		}
	}

	// 使用例
	function demonstrateThemeChanges() {
		// ビジネス向けテーマ
		setTimeout(() => changeTheme('Ocean'), 1000);
		
		// クリエイティブ向けテーマ  
		setTimeout(() => changeTheme('Sunset'), 3000);
		
		// エレガント向けテーマ
		setTimeout(() => changeTheme('Rose'), 5000);
		
		// ナチュラル向けテーマ
		setTimeout(() => changeTheme('Forest'), 7000);
	}
</script>

<div class="theme-demo card card--elevated responsive-padding">
	<div class="card__content">
		<h3 class="title-large text-on-surface m-4">🎨 テーマシステム デモ</h3>
		<p class="body-medium text-on-surface-variant m-4">
			右上の🎨ボタンをクリックしてテーマを変更するか、以下のボタンで自動デモをお試しください。
		</p>
		
		<div class="flex gap-4 flex-wrap justify-center">
			<button class="btn btn--filled" onclick={() => changeTheme('Ocean')}>
				Ocean（ビジネス向け）
			</button>
			<button class="btn btn--filled" onclick={() => changeTheme('Sunset')}>
				Sunset（クリエイティブ向け）
			</button>
			<button class="btn btn--filled" onclick={() => changeTheme('Rose')}>
				Rose（エレガント向け）
			</button>
			<button class="btn btn--filled" onclick={() => changeTheme('Forest')}>
				Forest（ナチュラル向け）
			</button>
		</div>
		
		<div class="flex justify-center m-6">
			<button class="btn btn--tonal" onclick={demonstrateThemeChanges}>
				🎬 自動デモを開始
			</button>
		</div>
		
		<div class="m-4 p-4 surface-container-high rounded-md">
			<h4 class="title-small text-on-surface m-2">💡 使用方法</h4>
			<p class="body-small text-on-surface-variant">
				「<strong>Ocean というテーマで実装して</strong>」<br/>
				「<strong>Sunset というテーマで実装して</strong>」<br/>
				「<strong>Rose というテーマで実装して</strong>」<br/>
				このように指定することで、アプリの目的に応じたテーマを簡単に適用できます。
			</p>
		</div>
	</div>
</div>