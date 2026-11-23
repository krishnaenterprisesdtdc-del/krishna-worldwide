(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var pw = '';
  function api(method, body) {
    return fetch('/api/admin', {
      method: method, headers: { 'Authorization': 'Bearer ' + pw, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, data: j }; }); });
  }
  function loadFeedback() {
    api('GET').then(function (r) {
      var box = $('#fblist'); box.textContent = '';
      var items = (r.data && r.data.feedback) || [];
      if (!items.length) { box.textContent = 'No feedback yet.'; return; }
      items.forEach(function (f) {
        var d = document.createElement('div'); d.className = 'fbi';
        var h = document.createElement('b'); h.textContent = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating) + '  ' + f.name;
        var m = document.createElement('p'); m.textContent = f.message;
        var s = document.createElement('small'); s.textContent = (f.contact ? f.contact + ' · ' : '') + new Date(f.at).toLocaleString('en-IN');
        var x = document.createElement('button'); x.className = 'chip'; x.textContent = 'Delete'; x.type = 'button';
        x.onclick = function () { if (confirm('Delete this feedback?')) api('POST', { action: 'delete_feedback', key: f.key }).then(loadFeedback); };
        d.appendChild(h); d.appendChild(m); d.appendChild(s); d.appendChild(document.createTextNode(' ')); d.appendChild(x);
        box.appendChild(d);
      });
    });
  }
  $('#loginBtn').onclick = function () {
    pw = $('#pw').value;
    api('GET').then(function (r) {
      if (!r.ok) { $('#loginNote').textContent = (r.data && r.data.error) || 'Login failed'; $('#loginNote').className = 'note err'; pw = ''; return; }
      $('#login').hidden = true; $('#panel').hidden = false; loadFeedback();
    });
  };
  $('#tsave').onclick = function () {
    api('POST', { action: 'track', id: $('#tid').value, status: $('#tst').value, note: $('#tnote').value }).then(function (r) {
      $('#tmsg').textContent = r.ok ? 'Saved.' : ((r.data && r.data.error) || 'Failed'); $('#tmsg').className = 'note ' + (r.ok ? 'ok' : 'err');
    });
  };
})();
