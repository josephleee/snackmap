(function () {
  'use strict';

  var DATA = window.SNACKMAP_DATA || { products: [], reports: [], suggestions: [], regions: [] };
  var STORAGE = {
    saved: 'snackmap.saved.v1',
    recent: 'snackmap.recent.v1',
    draft: 'snackmap.draft.v1'
  };
  var APP = {
    query: '',
    selectedProductId: null,
    sort: 'fresh',
    view: 'list',
    map: null,
    mapMarkers: [],
    mapInitialized: false,
    saved: loadJson(STORAGE.saved, []),
    recent: loadJson(STORAGE.recent, []),
    draft: loadJson(STORAGE.draft, null)
  };

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function loadJson(key, fallback) {
    try { var value = JSON.parse(localStorage.getItem(key)); return value == null ? fallback : value; }
    catch (e) { return fallback; }
  }
  function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }
  function icon(name, cls) {
    var paths = {
      pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
      search: '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
      bookmark: '<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>',
      check: '<path d="m5 12 4 4L19 6"></path>',
      arrow: '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
      map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"></path><path d="M9 3v15M15 6v15"></path>',
      list: '<path d="M8 6h13M8 12h13M8 18h13"></path><path d="M3 6h.01M3 12h.01M3 18h.01"></path>',
      clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path>',
      close: '<path d="M18 6 6 18M6 6l12 12"></path>'
    };
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }
  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '확인 시각 없음';
    return date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function relativeDate(value) {
    var days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
    if (!Number.isFinite(days) || days < 1) return '오늘 확인';
    if (days === 1) return '어제 확인';
    return days + '일 전 확인';
  }
  function freshness(value) {
    var days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
    if (days <= 3) return { label: '최근 확인', cls: 'fresh' };
    if (days <= 14) return { label: '확인 필요', cls: 'warn' };
    return { label: '오래됨', cls: 'stale' };
  }
  function reportsFor(productId) {
    return DATA.reports.filter(function (report) { return report.productId === productId; });
  }
  function productById(id) { return DATA.products.find(function (product) { return product.id === id; }); }
  function productMatches(product, query) {
    if (!query) return true;
    var haystack = [product.name, product.brand, product.category].concat(product.keywords || []).join(' ').toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }
  function productStats(product) {
    var reports = reportsFor(product.id);
    var newest = reports.slice().sort(function (a, b) { return new Date(b.confirmedAt) - new Date(a.confirmedAt); })[0];
    var freshCount = reports.filter(function (r) { return freshness(r.confirmedAt).cls === 'fresh'; }).length;
    return { reports: reports, newest: newest, freshCount: freshCount };
  }
  function productCard(product) {
    var stats = productStats(product);
    var badge = stats.newest ? freshness(stats.newest.confirmedAt) : { label: '판매처 제보 대기', cls: 'pending' };
    var sample = product.isSample ? '<span class="eyebrow">개발용 샘플</span>' : '<span class="eyebrow">사용자 요청 제품</span>';
    return '<article class="product-card" data-product-id="' + escapeHtml(product.id) + '">' +
      '<div class="product-card-top"><div>' + sample + '<h3>' + escapeHtml(product.name) + '</h3><p>' + escapeHtml(product.brand) + ' · ' + escapeHtml(product.category) + '</p></div>' +
      '<button type="button" class="icon-btn save-btn" data-action="toggle-save" data-product-id="' + escapeHtml(product.id) + '" aria-label="' + (APP.saved.indexOf(product.id) >= 0 ? '저장 해제' : '제품 저장') + '">' + icon('bookmark') + '</button></div>' +
      '<p class="product-desc">' + escapeHtml(product.description) + '</p>' +
      '<div class="product-meta"><span class="status-badge ' + badge.cls + '">' + escapeHtml(badge.label) + '</span><span>' + stats.reports.length + '건 제보</span></div>' +
      '<a class="card-link" href="#/product/' + encodeURIComponent(product.id) + '" data-action="open-product" data-product-id="' + escapeHtml(product.id) + '">판매처 보기 ' + icon('arrow', 'icon-sm') + '</a>' +
      '</article>';
  }
  function renderRecent() {
    var el = $('#recent-chips');
    if (!el) return;
    if (!APP.recent.length) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<span class="chip-label">최근 검색</span>' + APP.recent.slice(0, 5).map(function (term) {
      return '<button type="button" class="chip" data-action="use-query" data-query="' + escapeHtml(term) + '">' + escapeHtml(term) + '</button>';
    }).join('');
  }
  function renderSuggestions() {
    var el = $('#suggestion-chips');
    if (!el) return;
    el.innerHTML = '<span class="chip-label">이렇게 찾아보세요</span>' + (DATA.suggestions || []).slice(0, 5).map(function (term) {
      return '<button type="button" class="chip" data-action="use-query" data-query="' + escapeHtml(term) + '">' + escapeHtml(term) + '</button>';
    }).join('');
  }
  function renderSaved() {
    var section = $('#saved-section');
    var grid = $('#saved-grid');
    var products = APP.saved.map(productById).filter(Boolean);
    if (!section || !grid) return;
    section.hidden = products.length === 0;
    grid.innerHTML = products.map(productCard).join('');
  }
  function renderHome() {
    var grid = $('#product-grid');
    var empty = $('#search-empty');
    var note = $('#products-note');
    var products = DATA.products.filter(function (product) { return productMatches(product, APP.query); });
    if (!grid) return;
    grid.innerHTML = products.map(productCard).join('');
    if (empty) empty.hidden = products.length !== 0;
    if (note) note.textContent = APP.query ? '“' + APP.query + '” 검색 결과 ' + products.length + '개' : '현재 ' + DATA.products.length + '개 제품';
    renderSaved(); renderRecent(); renderSuggestions();
    var input = $('#search-input'); if (input && input.value !== APP.query) input.value = APP.query;
  }
  function showView(name) {
    $('#view-home').hidden = name !== 'home';
    $('#view-product').hidden = name !== 'product';
  }
  function pushRecent(query) {
    if (!query) return;
    APP.recent = [query].concat(APP.recent.filter(function (item) { return item !== query; })).slice(0, 8);
    saveJson(STORAGE.recent, APP.recent); renderRecent();
  }
  function goHome(clear) {
    if (clear) APP.query = '';
    APP.selectedProductId = null; showView('home'); renderHome(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderDetail(product) {
    var root = $('#product-detail');
    var stats = productStats(product);
    var reports = stats.reports.slice().sort(function (a, b) {
      if (APP.sort === 'confidence') return (b.sourceType === 'user') - (a.sourceType === 'user');
      return new Date(b.confirmedAt) - new Date(a.confirmedAt);
    });
    var newest = stats.newest;
    var currentBadge = newest ? freshness(newest.confirmedAt) : { label: '판매처 제보 대기', cls: 'pending' };
    var reportCards = reports.length ? reports.map(function (report) {
      var f = freshness(report.confirmedAt);
      return '<article class="report-card"><div class="report-card-head"><div><strong>' + escapeHtml(report.storeName) + '</strong><span>' + escapeHtml(report.region) + (report.approx ? ' · 정확한 주소 아님' : '') + '</span></div><span class="status-badge ' + f.cls + '">' + f.label + '</span></div><div class="report-card-meta"><span>' + icon('clock', 'icon-xs') + escapeHtml(relativeDate(report.confirmedAt)) + '</span><span>' + (report.sourceType === 'sample' ? '개발용 샘플' : '사용자 제보') + '</span>' + (report.price ? '<span>' + report.price.toLocaleString('ko-KR') + '원</span>' : '') + '</div>' + (report.memo ? '<p>' + escapeHtml(report.memo) + '</p>' : '') + '</article>';
    }).join('') : '<div class="state-panel detail-empty"><div class="state-icon">' + icon('pin') + '</div><h3>아직 판매처 제보가 없어요</h3><p>아이스크림 할인점에서 보셨다면 지역과 확인 시각을 남겨 주세요. 첫 제보가 다음 사람의 방문 시간을 줄여줘요.</p><button type="button" class="btn btn-primary" data-action="open-report" data-product-id="' + escapeHtml(product.id) + '">이 제품 제보하기</button></div>';
    root.innerHTML = '<div class="detail-hero"><div><span class="eyebrow">' + escapeHtml(product.category) + ' · ' + escapeHtml(product.brand) + '</span><h1>' + escapeHtml(product.name) + '</h1><p>' + escapeHtml(product.description) + '</p></div><button type="button" class="btn ' + (APP.saved.indexOf(product.id) >= 0 ? 'btn-neutral' : 'btn-primary') + '" data-action="toggle-save" data-product-id="' + escapeHtml(product.id) + '">' + icon('bookmark', 'icon-sm') + (APP.saved.indexOf(product.id) >= 0 ? ' 저장됨' : ' 저장하기') + '</button></div>' +
      '<div class="detail-stats"><div><strong>' + stats.reports.length + '</strong><span>전체 제보</span></div><div><strong>' + stats.freshCount + '</strong><span>최근 확인</span></div><div><strong class="status-text ' + currentBadge.cls + '">' + currentBadge.label + '</strong><span>현재 상태</span></div></div>' +
      '<div class="detail-toolbar"><div class="segmented" role="group" aria-label="판매처 보기 방식"><button type="button" class="' + (APP.view === 'list' ? 'active' : '') + '" data-action="set-view" data-view="list">' + icon('list', 'icon-sm') + '리스트</button><button type="button" class="' + (APP.view === 'map' ? 'active' : '') + '" data-action="set-view" data-view="map">' + icon('map', 'icon-sm') + '지도</button></div><label class="sort-select"><span class="visually-hidden">정렬</span><select data-action="sort-reports"><option value="fresh" ' + (APP.sort === 'fresh' ? 'selected' : '') + '>최신 제보순</option><option value="confidence" ' + (APP.sort === 'confidence' ? 'selected' : '') + '>출처 우선</option></select></label></div>' +
      '<div class="detail-disclaimer">' + icon('clock', 'icon-sm') + '<span>제보는 그 시점에 봤다는 기록이에요. 방문 전 최신 확인 시각과 상태를 꼭 확인하세요.</span></div>' +
      '<div id="detail-map" class="detail-map" ' + (APP.view === 'map' ? '' : 'hidden') + '></div>' +
      '<div id="report-list" class="report-list" ' + (APP.view === 'list' ? '' : 'hidden') + '>' + reportCards + '</div>';
    if (APP.view === 'map') setTimeout(function () { initMap(product, reports); }, 0);
  }
  function openProduct(id) {
    var product = productById(id); if (!product) return;
    APP.selectedProductId = id; showView('product'); renderDetail(product); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function initMap(product, reports) {
    var el = $('#detail-map'); if (!el || !window.L) return;
    if (APP.map) { APP.map.remove(); APP.map = null; }
    APP.map = L.map(el, { scrollWheelZoom: false }).setView([36.35, 127.8], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(APP.map);
    reports.forEach(function (report) {
      var marker = L.marker([report.lat, report.lng]).addTo(APP.map);
      marker.bindPopup('<strong>' + escapeHtml(report.storeName) + '</strong><br>' + escapeHtml(report.region) + '<br><small>정확한 주소 아님 · ' + escapeHtml(relativeDate(report.confirmedAt)) + '</small>');
    });
    if (reports.length) APP.map.fitBounds(reports.map(function (r) { return [r.lat, r.lng]; }), { padding: [24, 24] });
    setTimeout(function () { APP.map.invalidateSize(); }, 80);
  }
  function openReport(productId) {
    var modal = $('#report-modal'); if (!modal) return;
    var product = productById(productId || APP.selectedProductId);
    if (product) $('#f-product').value = product.name;
    if ($('#f-time') && !$('#f-time').value) $('#f-time').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    var list = $('#region-list'); if (list) list.innerHTML = (DATA.regions || []).map(function (r) { return '<option value="' + escapeHtml(r) + '"></option>'; }).join('');
    if (APP.draft) { ['product','store','region','time','price','memo','photo'].forEach(function (name) { var field = $('#f-' + name); if (field && APP.draft[name]) field.value = APP.draft[name]; }); $('#draft-notice').hidden = false; }
    $('#report-form-wrap').hidden = false; $('#report-success').hidden = true; $('#form-error-summary').hidden = true;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }
  function closeReport() { var modal = $('#report-modal'); if (!modal) return; if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open'); }
  function validateForm(data) {
    var errors = {};
    if (!data.product.trim()) errors.product = '제품명을 입력해 주세요.';
    if (!data.store.trim()) errors.store = '매장명 또는 매장 종류를 입력해 주세요.';
    if (!data.region.trim()) errors.region = '시/도와 구 단위 지역을 입력해 주세요.';
    if (!data.time || Number.isNaN(new Date(data.time).getTime())) errors.time = '판매 확인 시각을 입력해 주세요.';
    if (data.price && (!/^\d{1,6}$/.test(data.price) || Number(data.price) < 100)) errors.price = '가격은 100원 이상 숫자로 입력해 주세요.';
    if (data.photo && !/^https?:\/\//i.test(data.photo)) errors.photo = '사진 URL은 http 또는 https로 시작해야 해요.';
    return errors;
  }
  function handleFormSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget; var formData = new FormData(form); var data = {};
    ['product','store','region','time','price','memo','photo'].forEach(function (key) { data[key] = String(formData.get(key) || '').trim(); });
    var errors = validateForm(data); $all('.field-error').forEach(function (el) { el.hidden = true; el.textContent = ''; });
    Object.keys(errors).forEach(function (key) { var el = $('#err-' + key); if (el) { el.textContent = errors[key]; el.hidden = false; } });
    var summary = $('#form-error-summary');
    if (Object.keys(errors).length) { summary.textContent = '입력 내용을 확인해 주세요.'; summary.hidden = false; var first = $('#f-' + Object.keys(errors)[0]); if (first) first.focus(); return; }
    saveJson(STORAGE.draft, data); APP.draft = data;
    var title = '[제보] ' + data.product + ' — ' + data.region;
    var body = ['## 판매처 제보', '', '- 제품명: ' + data.product, '- 매장명: ' + data.store, '- 지역: ' + data.region, '- 판매 확인 시각: ' + data.time, data.price ? '- 가격: ' + data.price + '원' : '', data.memo ? '- 메모: ' + data.memo : '', data.photo ? '- 사진 URL: ' + data.photo : '', '', '> 실제 재고는 변동될 수 있어요. 제보 시점의 목격 정보입니다.'].filter(Boolean).join('\n');
    var issueUrl = 'https://github.com/josephleee/snackmap/issues/new?labels=stock-report&title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
    $('#issue-link').href = issueUrl; $('#report-form-wrap').hidden = true; $('#report-success').hidden = false;
  }
  function toast(message) { var region = $('#toast-region'); if (!region) return; var el = document.createElement('div'); el.className = 'toast'; el.textContent = message; region.appendChild(el); setTimeout(function () { el.remove(); }, 2600); }
  function toggleSave(id) {
    var index = APP.saved.indexOf(id); if (index >= 0) { APP.saved.splice(index, 1); toast('저장 목록에서 삭제했어요.'); } else { APP.saved.push(id); toast('제품을 저장했어요.'); }
    saveJson(STORAGE.saved, APP.saved); if (APP.selectedProductId) renderDetail(productById(APP.selectedProductId)); else renderHome();
  }
  function useQuery(query) { APP.query = query; pushRecent(query); renderHome(); var input = $('#search-input'); if (input) input.focus(); }
  function handleAction(target) {
    var action = target.dataset.action;
    if (action === 'go-home') { goHome(false); return; }
    if (action === 'clear-search') { goHome(true); return; }
    if (action === 'use-query') { useQuery(target.dataset.query || ''); return; }
    if (action === 'open-product') { openProduct(target.dataset.productId); return; }
    if (action === 'toggle-save') { toggleSave(target.dataset.productId); return; }
    if (action === 'open-report') { openReport(target.dataset.productId); return; }
    if (action === 'close-report') { closeReport(); return; }
    if (action === 'new-report') { openReport(APP.selectedProductId); return; }
    if (action === 'set-view') { APP.view = target.dataset.view || 'list'; if (APP.selectedProductId) renderDetail(productById(APP.selectedProductId)); return; }
    if (action === 'discard-draft') { APP.draft = null; saveJson(STORAGE.draft, null); $('#draft-notice').hidden = true; toast('임시저장 초안을 지웠어요.'); return; }
    if (action === 'scroll-saved') { var section = $('#saved-section'); if (section && !section.hidden) section.scrollIntoView({ behavior: 'smooth', block: 'start' }); else toast('아직 저장한 제품이 없어요.'); }
  }
  document.addEventListener('click', function (event) { var target = event.target.closest('[data-action]'); if (target) { event.preventDefault(); handleAction(target); } });
  $('#search-form').addEventListener('submit', function (event) { event.preventDefault(); var input = $('#search-input'); APP.query = String(input.value || '').trim(); pushRecent(APP.query); renderHome(); });
  $('#report-form').addEventListener('submit', handleFormSubmit);
  $('#report-modal').addEventListener('click', function (event) { if (event.target === event.currentTarget) closeReport(); });
  document.addEventListener('change', function (event) { if (event.target.dataset.action === 'sort-reports') { APP.sort = event.target.value; if (APP.selectedProductId) renderDetail(productById(APP.selectedProductId)); } });
  window.addEventListener('hashchange', function () { var match = location.hash.match(/^#\/product\/(.+)$/); if (match) openProduct(decodeURIComponent(match[1])); else goHome(false); });
  renderHome();
  var initial = location.hash.match(/^#\/product\/(.+)$/); if (initial) openProduct(decodeURIComponent(initial[1]));
})();
