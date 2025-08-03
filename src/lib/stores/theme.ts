import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// テーマの型定義
export type ThemeColor = 'default' | 'ocean' | 'sunset' | 'purple' | 'forest' | 'monochrome' | 'rose';
export type ThemeMode = 'auto' | 'light' | 'dark';

export interface Theme {
  color: ThemeColor;
  mode: ThemeMode;
}

// デフォルトテーマ
const defaultTheme: Theme = {
  color: 'default',
  mode: 'auto'
};

// テーマストアの作成
function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>(defaultTheme);

  return {
    subscribe,
    
    // テーマの初期化（ローカルストレージから復元）
    init: () => {
      if (browser) {
        const savedTheme = localStorage.getItem('shunsaku-theme');
        if (savedTheme) {
          try {
            const theme = JSON.parse(savedTheme) as Theme;
            set(theme);
            applyTheme(theme);
          } catch (error) {
            console.warn('Failed to parse saved theme:', error);
          }
        } else {
          // 初回アクセス時はライトモードに設定
          const lightTheme = { color: 'ocean' as ThemeColor, mode: 'light' as ThemeMode };
          set(lightTheme);
          applyTheme(lightTheme);
        }
      }
    },
    
    // カラーテーマの変更
    setColor: (color: ThemeColor) => {
      update(theme => {
        const newTheme = { ...theme, color };
        if (browser) {
          localStorage.setItem('shunsaku-theme', JSON.stringify(newTheme));
          applyTheme(newTheme);
        }
        return newTheme;
      });
    },
    
    // ライト/ダークモードの変更
    setMode: (mode: ThemeMode) => {
      update(theme => {
        const newTheme = { ...theme, mode };
        if (browser) {
          localStorage.setItem('shunsaku-theme', JSON.stringify(newTheme));
          applyTheme(newTheme);
        }
        return newTheme;
      });
    },
    
    // テーマ全体の設定
    setTheme: (theme: Theme) => {
      if (browser) {
        localStorage.setItem('shunsaku-theme', JSON.stringify(theme));
        applyTheme(theme);
      }
      set(theme);
    }
  };
}

// テーマをDOMに適用する関数
function applyTheme(theme: Theme) {
  if (!browser) return;
  
  const html = document.documentElement;
  
  // 既存のテーマクラスを削除
  html.removeAttribute('data-theme');
  html.removeAttribute('data-theme-mode');
  
  // 新しいテーマを適用
  if (theme.color !== 'default') {
    html.setAttribute('data-theme', theme.color);
  }
  
  if (theme.mode !== 'auto') {
    html.setAttribute('data-theme-mode', theme.mode);
  }
}

// テーマストアのエクスポート
export const themeStore = createThemeStore();

// テーマ情報の定義
export const themeInfo = {
  colors: [
    {
      id: 'ocean' as ThemeColor,
      name: 'Ocean',
      description: 'さわやかで信頼感のあるブルー系テーマ',
      preview: '#006780',
      category: 'ビジネス'
    },
    {
      id: 'default' as ThemeColor,
      name: 'Nature',
      description: '自然で落ち着いたグリーン系テーマ',
      preview: '#006d46',
      category: 'ナチュラル'
    },
    {
      id: 'sunset' as ThemeColor,
      name: 'Sunset',
      description: '温かみのあるオレンジ系テーマ',
      preview: '#a23900',
      category: 'クリエイティブ'
    },
    {
      id: 'purple' as ThemeColor,
      name: 'Purple',
      description: '上品で創造的なパープル系テーマ',
      preview: '#6750a4',
      category: 'クリエイティブ'
    },
    {
      id: 'forest' as ThemeColor,
      name: 'Forest',
      description: '深い森をイメージしたグリーン系テーマ',
      preview: '#006e1c',
      category: 'ナチュラル'
    },
    {
      id: 'rose' as ThemeColor,
      name: 'Rose',
      description: '優雅で美しいピンク系テーマ',
      preview: '#a24162',
      category: 'エレガント'
    },
    {
      id: 'monochrome' as ThemeColor,
      name: 'Monochrome',
      description: 'シンプルで洗練されたモノクロテーマ',
      preview: '#424242',
      category: 'ミニマル'
    }
  ],
  modes: [
    {
      id: 'auto' as ThemeMode,
      name: 'Auto',
      description: 'システム設定に従う'
    },
    {
      id: 'light' as ThemeMode,
      name: 'Light',
      description: 'ライトモード'
    },
    {
      id: 'dark' as ThemeMode,
      name: 'Dark',
      description: 'ダークモード'
    }
  ]
};

// 便利関数
export function getThemeByName(name: string): ThemeColor | null {
  const theme = themeInfo.colors.find(t => t.name.toLowerCase() === name.toLowerCase());
  return theme ? theme.id : null;
}

export function setThemeByName(name: string) {
  const themeColor = getThemeByName(name);
  if (themeColor) {
    themeStore.setColor(themeColor);
    return true;
  }
  return false;
}