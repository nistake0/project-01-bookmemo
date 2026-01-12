import { useEffect } from 'react';

/**
 * 背景パターンをスクロールに合わせて少し動かす（ガラスの視認性向上）
 * - 見た目（CSS）は theme 側に寄せ、ここは「動き」だけを担当
 *
 * @param {Object} options
 * @param {string} options.containerId - スクロールコンテナのid
 * @param {string} options.cssVarName - 反映するCSS変数名（例: --bg-offset）
 * @param {number} options.factor - パララックス強度（0で固定）
 */
export function useBackgroundParallax({
  containerId = 'app-scroll-container',
  cssVarName = '--bg-offset',
  factor = 0.45,
} = {}) {
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;

    // ユーザーが「動きを減らす」を有効にしている場合は固定にする
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const y = el.scrollTop || 0;
        const offset = prefersReducedMotion ? 0 : Math.round(y * factor);
        el.style.setProperty(cssVarName, `${offset}px`);
      });
    };

    // 初期化
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [containerId, cssVarName, factor]);
}

