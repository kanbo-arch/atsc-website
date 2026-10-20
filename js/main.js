// モバイル用ハンバーガーメニュー
(function () {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  if (!btn || !nav) return;

  function toggle() {
    const open = nav.classList.toggle('is-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  }

  btn.addEventListener('click', toggle);

  // メニュー内リンクをタップしたら閉じる
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && nav.classList.contains('is-open')) toggle();
  });
})();

// スクロールでセクションをフェードイン（全ページ共通）
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1つ目のセクション（ヒーロー／ページ見出し）はページ全体のフェードで表示するので除外
  const targets = Array.prototype.slice.call(document.querySelectorAll('main > section')).slice(1);
  if (!targets.length) return;

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  targets.forEach(function (el) {
    el.classList.add('fade-in');
    io.observe(el);
  });
})();
