/**
 * NEWS欄：ニュース管理サーバーから記事を読み込んで表示する
 * 読み込み先は index.html の <ul class="news__list" data-news-api="..."> で指定。
 * 記事が0件、または読み込めなかった場合は「現在お知らせはありません。」と表示します。
 */
(function () {
  var list = document.querySelector('.news__list[data-news-api]');
  if (!list || !window.fetch) return;

  var limit = list.getAttribute('data-news-limit') || '3';

  // Macで確認するとき（MAMP・ファイルを直接開いたとき）は、MAMPの管理サーバーから読む
  function resolveApi(url) {
    var h = location.hostname;
    if (location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1') {
      return url.replace(/^https?:\/\/[^/]+\/api\//, 'http://localhost:8888/news-cms/api/');
    }
    return url;
  }

  var api = resolveApi(list.getAttribute('data-news-api')) + '?limit=' + encodeURIComponent(limit);

  function safeUrl(url) {
    return typeof url === 'string' && /^(https?:\/\/|\/(?!\/))/i.test(url) ? url : null;
  }

  fetch(api, { credentials: 'omit' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = (data && data.items) || [];
      var frag = document.createDocumentFragment();

      if (!items.length) {
        var empty = document.createElement('li');
        empty.className = 'news__item news__item--empty';
        empty.textContent = '現在お知らせはありません。';
        frag.appendChild(empty);
      }

      items.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'news__item';

        var time = document.createElement('time');
        time.className = 'news__date';
        time.dateTime = String(item.date).replace(/\./g, '-');
        time.textContent = item.date;

        var p = document.createElement('p');
        p.className = 'news__text';
        var url = safeUrl(item.url);
        if (url) {
          var a = document.createElement('a');
          a.href = url;
          a.textContent = item.title;
          if (/^https?:\/\//i.test(url) && url.indexOf(location.origin) !== 0) {
            a.target = '_blank';
            a.rel = 'noopener';
          }
          p.appendChild(a);
        } else {
          p.textContent = item.title;
        }

        li.appendChild(time);
        li.appendChild(p);
        frag.appendChild(li);
      });

      list.replaceChildren(frag);
    })
    .catch(function () {
      // 読み込みに失敗した場合
      var li = document.createElement('li');
      li.className = 'news__item news__item--empty';
      li.textContent = '現在お知らせはありません。';
      list.replaceChildren(li);
    });
})();
