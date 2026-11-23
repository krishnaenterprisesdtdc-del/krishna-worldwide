(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var WA = '919584790909';

  /* ---------- Language toggle ---------- */
  var T = {
    en: {}, hi: {
      nav_services: 'सेवाएँ', nav_track: 'ट्रैक', nav_quote: 'कोट पाएँ', nav_feedback: 'फीडबैक', nav_contact: 'संपर्क',
      call_now: 'अभी कॉल करें', hero_h1: 'डॉक्यूमेंट से भारी कार्गो तक — हम देखभाल के साथ पहुँचाते हैं!',
      hero_sub: 'कूरियर, कार्गो और लॉजिस्टिक्स का वन-स्टॉप समाधान', get_free_quote: 'फ्री कोट पाएँ',
      track_parcel: 'अपना पार्सल ट्रैक करें', book_title: 'शिपमेंट बुकिंग / कोट पाएँ', service_type: 'सेवा का प्रकार',
      weight: 'वजन (किग्रा)', name: 'नाम', phone: 'फ़ोन', track_title: 'अपना पार्सल ट्रैक करें',
      services_title: 'हमारी सेवाएँ', why_title: 'कृष्णा वर्ल्डवाइड क्यों चुनें?', how_title: 'यह कैसे काम करता है',
      fb_title: 'ग्राहक फीडबैक', fb_contact: 'फ़ोन / ईमेल (वैकल्पिक)', fb_rating: 'आपकी रेटिंग', fb_msg: 'आपका फीडबैक',
      fb_submit: 'फीडबैक भेजें', contact_title: 'आज ही संपर्क करें', directions: 'रास्ता देखें'
    }
  };
  var lang = 'en';
  document.querySelectorAll('[data-i18n]').forEach(function (el) { T.en[el.dataset.i18n] = el.textContent; });
  function applyLang() {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = T[lang][el.dataset.i18n]; if (v) el.textContent = v;
    });
    $('#langBtn').textContent = lang === 'hi' ? 'English' : 'हिंदी';
  }
  $('#langBtn').addEventListener('click', function () {
    lang = lang === 'en' ? 'hi' : 'en';
    try { localStorage.setItem('krw_lang', lang); } catch (e) {}
    applyLang();
  });
  try { lang = localStorage.getItem('krw_lang') || 'en'; } catch (e) {}
  applyLang();

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  try {
    var t = localStorage.getItem('krw_theme');
    if (t) root.dataset.theme = t;
    else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';
  } catch (e) {}
  $('#themeBtn').addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('krw_theme', root.dataset.theme); } catch (e) {}
  });

  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Counters ---------- */
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, end = +el.dataset.count, n = 0, step = Math.max(1, Math.round(end / 60));
      var id = setInterval(function () { n += step; if (n >= end) { n = end; clearInterval(id); } el.textContent = n.toLocaleString('en-IN'); }, 24);
      io.unobserve(el);
    });
  });
  document.querySelectorAll('[data-count]').forEach(function (el) { if (io) io.observe(el); else el.textContent = el.dataset.count; });

  /* ---------- Helpers ---------- */
  function clean(s) { return String(s || '').replace(/[<>]/g, '').trim(); }
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, data: j }; }); });
  }

  /* ---------- Quote -> WhatsApp ---------- */
  $('#quote').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, d = {};
    ['from', 'to', 'service', 'weight', 'name', 'phone'].forEach(function (k) { d[k] = clean(f[k].value); });
    if (!d.from || !d.to || !d.name || !/^[0-9+\s-]{8,15}$/.test(d.phone)) {
      $('#quoteNote').textContent = 'Please fill FROM, TO, name and a valid phone number.'; $('#quoteNote').className = 'note err'; return;
    }
    var msg = 'New quote request%0AFrom: ' + encodeURIComponent(d.from) + '%0ATo: ' + encodeURIComponent(d.to) +
      '%0AService: ' + encodeURIComponent(d.service) + '%0AWeight: ' + encodeURIComponent(d.weight || '-') +
      '%0AName: ' + encodeURIComponent(d.name) + '%0APhone: ' + encodeURIComponent(d.phone);
    window.open('https://wa.me/' + WA + '?text=' + msg, '_blank', 'noopener');
    $('#quoteNote').textContent = 'Opening WhatsApp…'; $('#quoteNote').className = 'note ok';
  });

  /* ---------- Tracking ---------- */
  var STEPS = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
  $('#trackForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = clean($('#trackId').value).toUpperCase(), box = $('#trackResult');
    box.hidden = false;
    if (!/^[A-Z0-9-]{4,30}$/.test(id)) { box.textContent = 'Please enter a valid Tracking ID.'; return; }
    box.textContent = 'Checking…';
    fetch('/api/track?id=' + encodeURIComponent(id)).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.found) { box.textContent = 'No parcel found for this ID. Please check the number or call 95847 90909.'; return; }
      var idx = Math.max(0, STEPS.indexOf(j.status));
      box.innerHTML = '';
      var h = document.createElement('div'); h.innerHTML = '<b></b><br><span></span>';
      h.querySelector('b').textContent = 'ID: ' + id + ' — ' + j.status;
      h.querySelector('span').textContent = (j.note || '') + (j.updated ? ' (Updated: ' + j.updated + ')' : '');
      box.appendChild(h);
      var ol = document.createElement('ol'); ol.className = 'timeline';
      STEPS.forEach(function (s, i) { var li = document.createElement('li'); li.textContent = s; if (i <= idx) li.className = 'done'; ol.appendChild(li); });
      box.appendChild(ol);
    }).catch(function () { box.textContent = 'Tracking is unavailable right now. Please call 95847 90909.'; });
  });

  /* ---------- Customer Feedback ---------- */
  var fb = $('#fbForm'), fbNote = $('#fbNote');
  fb.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {
      name: clean(fb.name.value), contact: clean(fb.contact.value), message: clean(fb.message.value),
      rating: +((fb.querySelector('input[name=rating]:checked') || {}).value || 0), website: fb.website.value
    };
    fbNote.className = 'note err';
    if (!d.name) { fbNote.textContent = 'Please enter your name.'; return; }
    if (!d.rating) { fbNote.textContent = 'Please select a star rating.'; return; }
    if (d.message.length < 3) { fbNote.textContent = 'Please write your feedback.'; return; }
    var btn = fb.querySelector('button[type=submit]'); btn.disabled = true; fbNote.className = 'note'; fbNote.textContent = 'Sending…';
    post('/api/feedback', d).then(function (r) {
      if (r.ok) { fb.reset(); fbNote.className = 'note ok'; fbNote.textContent = 'Thank you! Your feedback has been submitted. 🙏'; }
      else { fbNote.className = 'note err'; fbNote.textContent = (r.data && r.data.error) || 'Could not send feedback. Please try again.'; }
    }).catch(function () { fbNote.className = 'note err'; fbNote.textContent = 'Network error. Please try again.'; })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Chat widget ---------- */
  var chat = $('#chat'), msgs = $('#msgs'), hist = [];
  $('#chatOpen').addEventListener('click', function () { chat.hidden = false; $('#chatOpen').hidden = true; $('#chatIn').focus(); });
  $('#chatClose').addEventListener('click', function () { chat.hidden = true; $('#chatOpen').hidden = false; });
  function add(cls, text) { var p = document.createElement('p'); p.className = cls; p.textContent = text; msgs.appendChild(p); msgs.scrollTop = msgs.scrollHeight; return p; }
  $('#chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('#chatIn'), q = clean(inp.value); if (!q) return;
    inp.value = ''; add('me', q); hist.push({ role: 'user', content: q });
    var wait = add('bot', '…');
    post('/api/chat', { messages: hist.slice(-8) }).then(function (r) {
      var a = (r.data && r.data.reply) || 'Sorry, please call or WhatsApp 95847 90909.';
      wait.textContent = a; hist.push({ role: 'assistant', content: a });
    }).catch(function () { wait.textContent = 'Please call or WhatsApp 95847 90909.'; });
  });
})();
