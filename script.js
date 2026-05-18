/* Bamidele Aly — site interactions */
(function () {
  'use strict';

  // Year stamp
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Lightweight i18n labels for header controls (mirrors the page's lang attr)
  var hLang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
  var L = hLang === 'fr' ? {
    openNav: 'Ouvrir la navigation',
    closeNav: 'Fermer la navigation',
    toDark: 'Passer au thème sombre',
    toLight: 'Passer au thème clair'
  } : hLang === 'de' ? {
    openNav: 'Navigation öffnen',
    closeNav: 'Navigation schließen',
    toDark: 'Zum dunklen Design wechseln',
    toLight: 'Zum hellen Design wechseln'
  } : {
    openNav: 'Open navigation',
    closeNav: 'Close navigation',
    toDark: 'Switch to dark theme',
    toLight: 'Switch to light theme'
  };

  // Mobile nav
  var nav = document.querySelector('.site-nav');
  var navToggle = document.getElementById('navToggle');
  if (nav && navToggle) {
    var closeNav = function () {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', L.openNav);
    };
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? L.closeNav : L.openNav);
    });
    nav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeNav();
    });
  }

  // Sticky header shadow on scroll
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 4) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Theme toggle (OS-aware default, persisted; broadcasts change)
  var themeBtn = document.getElementById('themeToggle');
  var setTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* no-op */ }
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', theme === 'dark' ? L.toLight : L.toDark);
      themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  };
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }

  // Language switcher — dropdown in the header, closes on outside click / Escape
  document.querySelectorAll('[data-lang-switch]').forEach(function (root) {
    var trigger = root.querySelector('.lang-switch-trigger');
    if (!trigger) return;
    var close = function () {
      root.setAttribute('data-open', 'false');
      trigger.setAttribute('aria-expanded', 'false');
    };
    var open = function () {
      root.setAttribute('data-open', 'true');
      trigger.setAttribute('aria-expanded', 'true');
    };
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (root.getAttribute('data-open') === 'true') close();
      else open();
    });
    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.getAttribute('data-open') === 'true') close();
    });
  });

  // Site search (Cmd/Ctrl+K or '/' to open, arrows to navigate, Enter to open)
  var searchOverlay = document.getElementById('searchOverlay');
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var searchTrigger = document.getElementById('searchTrigger');
  if (searchOverlay && searchInput && searchResults) {
    var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
    var ctrlLabel = hLang === 'de' ? 'Strg+K' : 'Ctrl+K';
    document.querySelectorAll('.search-shortcut').forEach(function (el) {
      el.textContent = isMac ? '⌘K' : ctrlLabel;
    });

    var indexData = null;
    var indexLoading = null;
    var activeIdx = -1;
    var lastQuery = '';

    var pageLang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
    var langPath = pageLang === 'fr' ? '/fr/search-data.json'
                 : pageLang === 'de' ? '/de/search-data.json'
                 : '/search-data.json';
    var langKey = pageLang === 'fr' ? 'fr' : pageLang === 'de' ? 'de' : 'en';
    var t = pageLang === 'fr' ? {
      loading: 'Chargement…',
      noResults: 'Aucun résultat pour « {q} »'
    } : pageLang === 'de' ? {
      loading: 'Wird geladen…',
      noResults: 'Keine Ergebnisse für „{q}"'
    } : {
      loading: 'Loading…',
      noResults: 'No results for "{q}"'
    };

    var loadIndex = function () {
      if (indexData) return Promise.resolve(indexData);
      if (indexLoading) return indexLoading;
      indexLoading = fetch(langPath, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
        .then(function (data) {
          var entries = (data && data.index && (data.index[langKey] || data.index.en || [])) || [];
          indexData = entries;
          return indexData;
        })
        .catch(function () { indexData = []; return indexData; });
      return indexLoading;
    };

    var fuzzyMatch = function (needle, haystack) {
      needle = needle.toLowerCase();
      haystack = haystack.toLowerCase();
      if (haystack.indexOf(needle) !== -1) return true;
      var j = 0;
      for (var i = 0; i < haystack.length && j < needle.length; i++) {
        if (haystack[i] === needle[j]) j++;
      }
      return j === needle.length;
    };

    var renderEmpty = function (label) {
      var el = document.createElement('div');
      el.className = 'search-empty';
      el.textContent = label;
      searchResults.replaceChildren(el);
      activeIdx = -1;
    };

    var renderResults = function (q) {
      lastQuery = q;
      if (q.length === 0) {
        if (!indexData) return renderEmpty(t.loading);
        // Show all entries when query is empty
        renderList(indexData);
        return;
      }
      if (!indexData) {
        renderEmpty(t.loading);
        loadIndex().then(function () {
          if (lastQuery === q) renderResults(q);
        });
        return;
      }
      var hits = [];
      indexData.forEach(function (e) {
        if (fuzzyMatch(q, e.t) || fuzzyMatch(q, e.d || '')) hits.push(e);
      });
      if (hits.length === 0) {
        renderEmpty(t.noResults.replace('{q}', q));
        return;
      }
      renderList(hits);
    };

    var renderList = function (items) {
      var frag = document.createDocumentFragment();
      items.forEach(function (e, i) {
        var a = document.createElement('a');
        a.className = 'search-result' + (i === 0 ? ' active' : '');
        a.href = e.u;
        a.dataset.idx = String(i);
        var t = document.createElement('p');
        t.className = 'search-result-title';
        t.textContent = e.t;
        var d = document.createElement('p');
        d.className = 'search-result-desc';
        d.textContent = e.d || '';
        a.appendChild(t);
        a.appendChild(d);
        frag.appendChild(a);
      });
      searchResults.replaceChildren(frag);
      activeIdx = items.length ? 0 : -1;
    };

    var openSearch = function () {
      searchOverlay.classList.add('open');
      searchOverlay.removeAttribute('inert');
      searchInput.value = '';
      activeIdx = -1;
      lastQuery = '';
      renderEmpty(t.loading);
      loadIndex().then(function () { renderResults(''); });
      // Focus synchronously inside the click handler so iOS opens the keyboard
      searchInput.focus({ preventScroll: true });
      document.body.style.overflow = 'hidden';
    };
    var closeSearch = function () {
      searchOverlay.classList.remove('open');
      searchOverlay.setAttribute('inert', '');
      searchInput.value = '';
      activeIdx = -1;
      lastQuery = '';
      searchResults.replaceChildren();
      document.body.style.overflow = '';
      if (searchTrigger) searchTrigger.focus();
    };
    var updateActive = function () {
      var items = searchResults.querySelectorAll('.search-result');
      items.forEach(function (el, i) {
        el.classList.toggle('active', i === activeIdx);
      });
      if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
    };

    if (searchTrigger) {
      searchTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        openSearch();
      });
    }
    document.addEventListener('keydown', function (e) {
      var modK = (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      var slash = e.key === '/' && !searchOverlay.classList.contains('open') &&
                  !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') &&
                  !(document.activeElement && document.activeElement.isContentEditable);
      if (modK) {
        e.preventDefault();
        if (searchOverlay.classList.contains('open')) closeSearch();
        else openSearch();
        return;
      }
      if (slash) { e.preventDefault(); openSearch(); return; }
      if (!searchOverlay.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeSearch(); return; }
      // Trap Tab inside the dialog so focus can't escape to the page behind.
      if (e.key === 'Tab') {
        var focusables = searchOverlay.querySelectorAll(
          'input, button:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) { e.preventDefault(); return; }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
        return;
      }
      var items = searchResults.querySelectorAll('.search-result');
      if (!items.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = (activeIdx + 1) % items.length;
        updateActive();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = (activeIdx - 1 + items.length) % items.length;
        updateActive();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[activeIdx]) window.location.href = items[activeIdx].getAttribute('href');
      }
    });
    searchInput.addEventListener('input', function () {
      activeIdx = -1;
      renderResults(searchInput.value.trim());
    });
    searchOverlay.addEventListener('click', function (e) {
      if (e.target === searchOverlay) closeSearch();
    });
    // Close on cancel button (mobile)
    var cancel = searchOverlay.querySelector('.search-cancel');
    if (cancel) cancel.addEventListener('click', closeSearch);
  }

  // Decode base64 safely (used for obfuscated email)
  var decodeAddr = function (encoded) {
    if (!encoded) return '';
    try { return atob(encoded); } catch (e) { return encoded; }
  };

  // Reveal-email button — no plain-text email in source until user explicitly asks
  var revealBtn = document.getElementById('revealEmail');
  var revealOut = document.getElementById('revealEmailOut');
  if (revealBtn && revealOut) {
    revealBtn.addEventListener('click', function () {
      var form = document.getElementById('intakeForm');
      var addr = form ? decodeAddr(form.getAttribute('data-mailto')) : '';
      if (!addr) return;
      revealOut.innerHTML = '<a href="mailto:' + addr + '">' + addr + '</a>';
      revealOut.hidden = false;
      revealBtn.hidden = true;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () {
          var note = document.createElement('span');
          note.className = 'reveal-email-copied';
          note.textContent = ' (copied to clipboard)';
          revealOut.appendChild(note);
        }).catch(function () { /* clipboard unavailable, ignore */ });
      }
    });
  }

  // Contact intake form — Formspree fetch with mailto fallback, accessible validation
  var form = document.getElementById('intakeForm');
  if (form) {
    var formLang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
    var fT = formLang === 'fr' ? {
      missing: 'Veuillez compléter les champs requis (Nom, Objet, Message).',
      sending: 'Envoi du message…',
      sent: 'Message envoyé. Redirection…',
      sendFail: 'Échec de l’envoi.',
      retry: ' Veuillez réessayer, ou écrivez-moi sur LinkedIn.',
      network: 'Erreur réseau. Veuillez réessayer, ou écrivez-moi sur LinkedIn.',
      mailFail: 'Impossible de composer l’e-mail. Réessayez le formulaire ou écrivez-moi sur LinkedIn.',
      opening: 'Ouverture de votre client e-mail…'
    } : formLang === 'de' ? {
      missing: 'Bitte füllen Sie die Pflichtfelder aus (Name, Anliegen, Nachricht).',
      sending: 'Nachricht wird gesendet…',
      sent: 'Nachricht gesendet. Weiterleitung…',
      sendFail: 'Senden fehlgeschlagen.',
      retry: ' Bitte erneut versuchen oder mir auf LinkedIn schreiben.',
      network: 'Netzwerkfehler. Bitte erneut versuchen oder mir auf LinkedIn schreiben.',
      mailFail: 'E-Mail kann nicht erstellt werden. Bitte das Formular erneut versuchen oder mir auf LinkedIn schreiben.',
      opening: 'Ihr E-Mail-Programm wird geöffnet…'
    } : {
      missing: 'Please complete the required fields (Name, Purpose, Message).',
      sending: 'Sending message…',
      sent: 'Message sent. Redirecting…',
      sendFail: 'Send failed.',
      retry: ' Please try again, or message me on LinkedIn.',
      network: 'Network error. Please try again, or message me on LinkedIn.',
      mailFail: 'Unable to compose email. Try the form again or message me on LinkedIn.',
      opening: 'Opening your email client…'
    };
    var status = document.getElementById('intakeStatus');
    var setStatus = function (msg, state) {
      if (!status) return;
      status.textContent = msg;
      if (state) status.setAttribute('data-state', state);
      else status.removeAttribute('data-state');
    };
    var clearInvalid = function () {
      form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
        el.removeAttribute('aria-invalid');
      });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearInvalid();

      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var org = (data.get('organisation') || '').toString().trim();
      var purpose = (data.get('purpose') || '').toString().trim();
      var timeline = (data.get('timeline') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();

      var missing = [];
      if (!name) missing.push('intake-name');
      if (!purpose) missing.push('intake-purpose');
      if (!message) missing.push('intake-message');
      if (missing.length) {
        setStatus(fT.missing, 'error');
        missing.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.setAttribute('aria-invalid', 'true');
        });
        var first = document.getElementById(missing[0]);
        if (first) first.focus();
        return;
      }

      var subject = '[' + purpose + '] ' + name + (org ? ' — ' + org : '');
      // Prefer the standard form.action attribute; fall back to data-endpoint
      // for backwards compatibility with older copies of the markup.
      var endpoint = form.getAttribute('action') || form.getAttribute('data-endpoint') || '';
      var redirect = form.getAttribute('data-redirect');
      var submit = form.querySelector('button[type="submit"]');
      var useEndpoint = endpoint && /^https?:\/\//.test(endpoint) && endpoint.indexOf('YOUR_FORMSPREE_ID') === -1;

      if (useEndpoint) {
        var payload = new FormData();
        payload.set('name', name);
        if (org) payload.set('organisation', org);
        payload.set('purpose', purpose);
        if (timeline) payload.set('timeline', timeline);
        payload.set('message', message);
        payload.set('_subject', subject);

        setStatus(fT.sending);
        if (submit) submit.disabled = true;

        fetch(endpoint, {
          method: 'POST',
          body: payload,
          headers: { 'Accept': 'application/json' }
        }).then(function (response) {
          if (response.ok) {
            setStatus(fT.sent, 'success');
            form.reset();
            if (redirect) {
              window.location.assign(redirect);
            }
          } else {
            return response.json().then(function (body) {
              var err = (body && body.errors && body.errors.map(function (x) { return x.message; }).join(', ')) || fT.sendFail;
              setStatus(err + fT.retry, 'error');
            }).catch(function () {
              setStatus(fT.sendFail + fT.retry, 'error');
            });
          }
        }).catch(function () {
          setStatus(fT.network, 'error');
        }).finally(function () {
          if (submit) submit.disabled = false;
        });
        return;
      }

      // Fallback: compose mailto if no endpoint is configured
      var body = [
        'From: ' + name,
        org ? 'Organisation: ' + org : null,
        'Purpose: ' + purpose,
        timeline ? 'Timeline: ' + timeline : null,
        '',
        message,
        '',
        '—',
        'Submitted from bamidelealy.com'
      ].filter(Boolean).join('\n');
      var to = decodeAddr(form.getAttribute('data-mailto'));
      if (!to) { setStatus(fT.mailFail, 'error'); return; }
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      setStatus(fT.opening);
      window.location.href = href;
    });
  }
})();
