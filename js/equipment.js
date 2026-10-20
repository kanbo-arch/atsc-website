/**
 * 機材リスト：管理サーバーから最新のリストを読み込み、タブと表を作り直す
 *
 * 使い方（各機材リストページのタブを囲む要素に指定）：
 *   <div class="band-inner" data-equipment-api="https://www.news.ats-c.co.jp/api/equipment.php" data-equipment-list="pa">
 * list は pa / lighting / visual。
 * 読み込めなかった場合は、HTMLに書いてある表をそのまま表示します。
 */
(function () {
  var root = document.querySelector('[data-equipment-api][data-equipment-list]');
  if (!root || !window.fetch) return;


  // Macで確認するとき（MAMP・ファイルを直接開いたとき）は、MAMPの管理サーバーから読む
  function resolveApi(url) {
    var h = location.hostname;
    if (location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1') {
      return url.replace(/^https?:\/\/[^/]+\/api\//, 'http://localhost:8888/news-cms/api/');
    }
    return url;
  }

  var url = resolveApi(root.getAttribute('data-equipment-api')) + '?list=' + encodeURIComponent(root.getAttribute('data-equipment-list'));

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  function slugify(name, i, used) {
    var s = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cat-' + (i + 1);
    var base = s, n = 2;
    while (used[s]) s = base + '-' + (n++);
    used[s] = true;
    return s;
  }

  function buildTable(cat, noteLabel) {
    var table = el('table', { 'class': 'equipment-table' + (cat.show_note ? ' equipment-table--note' : '') });
    var tr = el('tr');
    tr.appendChild(el('th', null, 'メーカー'));
    tr.appendChild(el('th', null, '機材名'));
    tr.appendChild(el('th', { 'class': 'equipment-table__qty' }, '数量'));
    if (cat.show_note) tr.appendChild(el('th', { 'class': 'equipment-table__note' }, noteLabel));
    var thead = el('thead');
    thead.appendChild(tr);
    table.appendChild(thead);

    var tbody = el('tbody');
    var items = cat.items || [];
    for (var i = 0; i < items.length; i++) {
      var row = el('tr');
      // 同じメーカーが続く行はメーカー欄をまとめる
      if (i === 0 || items[i].maker !== items[i - 1].maker) {
        var span = 1;
        while (i + span < items.length && items[i + span].maker === items[i].maker) span++;
        row.appendChild(el('td', { rowspan: String(span) }, items[i].maker));
      }
      row.appendChild(el('td', null, items[i].model));
      row.appendChild(el('td', { 'class': 'equipment-table__qty' }, items[i].qty));
      if (cat.show_note) row.appendChild(el('td', { 'class': 'equipment-table__note' }, items[i].note));
      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    var wrap = el('div', { 'class': 'equipment-table-wrap' });
    wrap.appendChild(table);
    return wrap;
  }

  function render(data) {
    var cats = (data && data.categories) || [];
    if (!cats.length) return; // 空のときはHTMLのまま

    var used = {};
    var tabs = el('div', { 'class': 'tabs', role: 'tablist' });
    var frag = document.createDocumentFragment();
    frag.appendChild(tabs);

    cats.forEach(function (cat, i) {
      var slug = slugify(cat.name, i, used);
      var active = i === 0;

      var btn = el('button', {
        type: 'button', 'class': 'tabs__btn' + (active ? ' is-active' : ''), role: 'tab',
        'data-target': 'panel-' + slug, id: 'tab-' + slug, 'aria-selected': active ? 'true' : 'false'
      }, cat.name);
      tabs.appendChild(btn);

      var panel = el('div', { 'class': 'tab-panel' + (active ? ' is-active' : ''), id: 'panel-' + slug, role: 'tabpanel', 'aria-labelledby': 'tab-' + slug });
      if (!active) panel.hidden = true;
      var group = el('div', { 'class': 'equipment-group' });
      group.appendChild(el('h2', { 'class': 'equipment-group__title' }, cat.name));
      group.appendChild(buildTable(cat, data.note_label || '備考'));
      panel.appendChild(group);
      frag.appendChild(panel);
    });

    root.replaceChildren(frag);

    // タブの切り替え
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.tabs__btn');
      if (!btn) return;
      root.querySelectorAll('.tabs__btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      root.querySelectorAll('.tab-panel').forEach(function (p) {
        var on = p.id === btn.getAttribute('data-target');
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
    });
  }

  fetch(url, { credentials: 'omit' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(render)
    .catch(function () { /* 読み込めなければHTMLの表のまま */ });
})();
