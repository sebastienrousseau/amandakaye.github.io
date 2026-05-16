/* Bamidele Aly — site interactions */
(function () {
  'use strict';

  // Year stamp
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Mobile nav
  var nav = document.querySelector('.site-nav');
  var navToggle = document.getElementById('navToggle');
  if (nav && navToggle) {
    var closeNav = function () {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    };
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
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
      themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
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

  // Mermaid diagram — render with theme awareness, re-render on theme change
  var mermaidEl = document.querySelector('.mermaid');
  if (mermaidEl && typeof window.mermaid !== 'undefined') {
    var source = mermaidEl.getAttribute('data-source') || mermaidEl.textContent.trim();
    mermaidEl.textContent = '';

    var renderMermaid = function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Atkinson Hyperlegible", system-ui, sans-serif',
        themeVariables: isDark ? {
          background: '#161617',
          primaryColor: '#2a2a2c',
          primaryTextColor: '#f5f5f7',
          primaryBorderColor: '#3a3a3c',
          lineColor: '#86868b',
          secondaryColor: '#1d1d1f',
          tertiaryColor: '#0d2640',
          clusterBkg: '#1d1d1f',
          clusterBorder: '#2d2d30',
          edgeLabelBackground: '#161617',
          mainBkg: '#2a2a2c',
          textColor: '#f5f5f7'
        } : {
          background: '#ffffff',
          primaryColor: '#ffffff',
          primaryTextColor: '#1d1d1f',
          primaryBorderColor: '#d2d2d7',
          lineColor: '#6e6e73',
          secondaryColor: '#f5f5f7',
          tertiaryColor: '#e8f1fd',
          clusterBkg: '#f5f5f7',
          clusterBorder: '#d2d2d7',
          edgeLabelBackground: '#ffffff',
          mainBkg: '#ffffff',
          textColor: '#1d1d1f'
        }
      });
      var id = 'm-' + Math.random().toString(36).slice(2, 9);
      window.mermaid.render(id, source).then(function (result) {
        mermaidEl.innerHTML = result.svg;
        mermaidEl.setAttribute('data-processed', 'true');
        if (result.bindFunctions) result.bindFunctions(mermaidEl);
      }).catch(function (err) {
        mermaidEl.textContent = 'Diagram failed to load.';
        if (window.console) console.error(err);
      });
    };

    renderMermaid();
    document.addEventListener('themechange', renderMermaid);
  }

  // Contact intake form — Formspree fetch with mailto fallback, accessible validation
  var form = document.getElementById('intakeForm');
  if (form) {
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
        setStatus('Please complete the required fields (Name, Purpose, Message).', 'error');
        missing.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.setAttribute('aria-invalid', 'true');
        });
        var first = document.getElementById(missing[0]);
        if (first) first.focus();
        return;
      }

      var subject = '[' + purpose + '] ' + name + (org ? ' — ' + org : '');
      var endpoint = form.getAttribute('data-endpoint');
      var submit = form.querySelector('button[type="submit"]');
      var useEndpoint = endpoint && endpoint.indexOf('YOUR_FORMSPREE_ID') === -1;

      if (useEndpoint) {
        var payload = new FormData();
        payload.set('name', name);
        if (org) payload.set('organisation', org);
        payload.set('purpose', purpose);
        if (timeline) payload.set('timeline', timeline);
        payload.set('message', message);
        payload.set('_subject', subject);

        setStatus('Sending message…');
        if (submit) submit.disabled = true;

        fetch(endpoint, {
          method: 'POST',
          body: payload,
          headers: { 'Accept': 'application/json' }
        }).then(function (response) {
          if (response.ok) {
            setStatus('Message sent. I will be in touch.', 'success');
            form.reset();
          } else {
            return response.json().then(function (body) {
              var err = (body && body.errors && body.errors.map(function (x) { return x.message; }).join(', ')) || 'Send failed.';
              setStatus(err + ' Email dele_aly@yahoo.fr if it keeps failing.', 'error');
            }).catch(function () {
              setStatus('Send failed. Email dele_aly@yahoo.fr if it keeps failing.', 'error');
            });
          }
        }).catch(function () {
          setStatus('Network error. Email dele_aly@yahoo.fr if it keeps failing.', 'error');
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
      var to = form.getAttribute('data-mailto') || 'dele_aly@yahoo.fr';
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      setStatus('Opening your email client…');
      window.location.href = href;
    });
  }
})();
