/**
 * お問い合わせフォーム（contact.html）
 *   入力 → 確認 → 送信 → 完了 の順に切り替えます。
 *   送信先は <form data-contact-api="..."> で指定（ニュース管理サーバーの api/contact.php）。
 *   ロボット対策の Cloudflare Turnstile は、data-turnstile-sitekey にサイトキーが入っているときだけ表示します。
 *   ※ 入力チェックはサーバー側でも必ず行っています（こちらは入力ミスを早めに知らせるためのもの）。
 */
(function () {
  var form = document.getElementById('contact-form');
  if (!form || !window.fetch || !window.FormData) return;

  var CATEGORIES = {
    pa: '音響（仮設PA）',
    lighting: '照明（AT-Lighting）',
    visual: '映像',
    hall: 'ホール管理',
    livehouse: 'ライブハウス（GRIT at Shibuya）',
    management: 'マネージメント（WONDER TORCH）',
    education: '人材育成・採用',
    other: 'その他'
  };
  var LIMITS = { name: 50, company: 100, email: 254, phone: 20, message: 3000 };

  // Macで確認するとき（MAMP・ファイルを直接開いたとき）は、MAMPの管理サーバーへ送る
  function resolveApi(url) {
    var h = location.hostname;
    if (location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1') {
      return url.replace(/^https?:\/\/[^/]+\/api\//, 'http://localhost:8888/news-cms/api/');
    }
    return url;
  }
  var api = resolveApi(form.getAttribute('data-contact-api') || '');
  var sitekey = (form.getAttribute('data-turnstile-sitekey') || '').trim();

  var steps = {};
  form.querySelectorAll('[data-step]').forEach(function (el) { steps[el.getAttribute('data-step')] = el; });
  var globalError = form.querySelector('[data-error-global]');
  var sendBtn = form.querySelector('[data-action="send"]');

  function show(step) {
    Object.keys(steps).forEach(function (k) { steps[k].hidden = k !== step; });
    var top = form.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    if (step === 'done') steps.done.focus({ preventScroll: true });
  }

  function val(name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? '1' : '';
    return String(el.value || '').trim();
  }

  // ---- URL の ?type=hall などで種別を最初から選んでおく ----
  var m = /[?&]type=([a-z]+)/.exec(location.search);
  if (m && CATEGORIES[m[1]]) form.elements.category.value = m[1];

  // ---- 文字数カウント ----
  var counter = form.querySelector('[data-count]');
  form.elements.message.addEventListener('input', function () {
    counter.textContent = String(form.elements.message.value.length);
  });

  // ---- エラー表示 ----
  function setError(name, msg) {
    var p = form.querySelector('[data-error-for="' + name + '"]');
    var field = form.elements[name];
    if (p) p.textContent = msg || '';
    if (field && field.setAttribute) {
      if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    }
  }
  function clearErrors() {
    form.querySelectorAll('[data-error-for]').forEach(function (p) { setError(p.getAttribute('data-error-for'), ''); });
    globalError.textContent = '';
  }

  function validate() {
    var e = {};
    var name = val('name'), email = val('email'), phone = val('phone'), msg = val('message');
    if (!CATEGORIES[val('category')]) e.category = 'お問い合わせ種別を選んでください。';
    if (!name) e.name = 'お名前を入力してください。';
    else if (name.length > LIMITS.name) e.name = 'お名前は' + LIMITS.name + '文字以内で入力してください。';
    if (val('company').length > LIMITS.company) e.company = '会社名・団体名は' + LIMITS.company + '文字以内で入力してください。';
    if (!email) e.email = 'メールアドレスを入力してください。';
    else if (email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'メールアドレスの形式が正しくありません。';
    if (phone && !/^[0-9０-９+＋\-－ー()（） ]{6,20}$/.test(phone)) e.phone = '電話番号は数字とハイフンで入力してください。';
    if (!msg) e.message = 'お問い合わせ内容を入力してください。';
    else if (msg.length > LIMITS.message) e.message = 'お問い合わせ内容は' + LIMITS.message + '文字以内で入力してください。';
    if (!val('agree')) e.agree = 'プライバシーポリシーへの同意が必要です。';
    return e;
  }

  function showErrors(errors) {
    var first = null;
    Object.keys(errors).forEach(function (k) {
      setError(k, errors[k]);
      if (!first) first = form.elements[k];
    });
    if (first && first.focus) first.focus();
  }

  // ---- 確認画面 ----
  function buildConfirm() {
    var list = form.querySelector('[data-confirm-list]');
    list.textContent = '';
    [
      ['お問い合わせ種別', CATEGORIES[val('category')]],
      ['お名前', val('name')],
      ['会社名・団体名', val('company') || '（未入力）'],
      ['メールアドレス', val('email')],
      ['電話番号', val('phone') || '（未入力）'],
      ['お問い合わせ内容', form.elements.message.value.trim()]
    ].forEach(function (row) {
      var wrap = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = row[0];
      dd.textContent = row[1];   // textContent なので入力内容がHTMLとして動くことはない
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      list.appendChild(wrap);
    });
  }

  // ---- Cloudflare Turnstile（ロボット対策） ----
  var widgetId = null;
  var turnstileLoading = false;
  function renderTurnstile() {
    if (!sitekey || widgetId !== null) return;
    var box = form.querySelector('[data-turnstile]');
    if (window.turnstile) {
      widgetId = window.turnstile.render(box, { sitekey: sitekey, language: 'ja', action: 'contact' });
      return;
    }
    if (turnstileLoading) return;
    turnstileLoading = true;
    window.atscTurnstileReady = function () { renderTurnstile(); };
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=atscTurnstileReady';
    s.async = true;
    s.defer = true;
    s.onerror = function () { globalError.textContent = 'ロボット対策の読み込みに失敗しました。通信環境をご確認のうえ、ページを再読み込みしてください。'; };
    document.head.appendChild(s);
  }
  function resetTurnstile() {
    if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
  }

  form.querySelector('[data-action="confirm"]').addEventListener('click', function () {
    clearErrors();
    var errors = validate();
    if (Object.keys(errors).length) { showErrors(errors); return; }
    buildConfirm();
    show('confirm');
    renderTurnstile();
  });

  form.querySelector('[data-action="back"]').addEventListener('click', function () {
    globalError.textContent = '';
    show('input');
  });

  // Enterキーで勝手に送信されないようにする（入力画面）
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !steps.input.hidden) e.preventDefault();
  });

  // ---- 送信 ----
  var sending = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending || steps.confirm.hidden) return;
    globalError.textContent = '';

    if (sitekey && !(window.turnstile && widgetId !== null && window.turnstile.getResponse(widgetId))) {
      globalError.textContent = '「ロボットではありません」の確認が終わるまでお待ちください。';
      return;
    }

    sending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '送信中…';

    fetch(api, { method: 'POST', body: new FormData(form), credentials: 'omit', mode: 'cors' })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (r) {
        if (r.data && r.data.ok) {
          form.querySelectorAll('input:not([type=checkbox]), textarea, select').forEach(function (el) { el.value = ''; });
          form.elements.agree.checked = false;
          counter.textContent = '0';
          show('done');
          return;
        }
        if (r.status === 422 && r.data.fields) {
          show('input');
          showErrors(r.data.fields);
        } else {
          globalError.textContent = (r.data && r.data.message) || '送信できませんでした。時間をおいて再度お試しください。';
        }
        resetTurnstile();
      })
      .catch(function () {
        globalError.textContent = '通信エラーのため送信できませんでした。通信環境をご確認のうえ、再度お試しください。解決しない場合は info@ats-c.co.jp までご連絡ください。';
        resetTurnstile();
      })
      .then(function () {
        sending = false;
        sendBtn.disabled = false;
        sendBtn.textContent = '送信する';
      });
  });
})();
