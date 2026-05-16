/* Bamidele Aly — static site interactions */
(function () {
  'use strict';

  // Year stamp
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Mobile nav toggle
  var nav = document.querySelector('.site-nav');
  var navToggle = document.getElementById('navToggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation');
      });
    });
  }

  // Sticky header shadow on scroll
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Theme toggle
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    var setTheme = function (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) { /* no-op */ }
      themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    };
    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }

  // Agent diagram tooltips (accessible: hover, keyboard focus, Enter/Space, Escape)
  var diagram = document.querySelector('[data-agent-diagram]');
  if (diagram) {
    var tooltip = document.createElement('div');
    tooltip.className = 'agent-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('id', 'agentTooltip');
    document.body.appendChild(tooltip);

    var activeNode = null;
    var showTip = function (target) {
      var text = target.getAttribute('data-tip');
      if (!text) return;
      activeNode = target;
      tooltip.textContent = text;
      tooltip.setAttribute('data-visible', 'true');
      var rect = target.getBoundingClientRect();
      var top = window.scrollY + rect.top - tooltip.offsetHeight - 10;
      var left = window.scrollX + rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
      tooltip.style.top = Math.max(8, top) + 'px';
      tooltip.style.left = Math.max(8, left) + 'px';
    };
    var hideTip = function () {
      tooltip.removeAttribute('data-visible');
      activeNode = null;
    };

    diagram.querySelectorAll('.agent-node').forEach(function (node) {
      if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '0');
      node.setAttribute('aria-describedby', 'agentTooltip');
      node.addEventListener('mouseenter', function () { showTip(node); });
      node.addEventListener('mouseleave', hideTip);
      node.addEventListener('focus', function () { showTip(node); });
      node.addEventListener('blur', hideTip);
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (activeNode === node) hideTip();
          else showTip(node);
        }
      });
    });

    // WCAG 1.4.13: dismissible without moving the pointer or focus
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tooltip.getAttribute('data-visible') === 'true') hideTip();
    });
    window.addEventListener('scroll', hideTip, { passive: true });
  }

  // Contact intake form: submit via Formspree (data-endpoint), fall back to mailto.
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

      var requiredMissing = [];
      if (!name) requiredMissing.push('intake-name');
      if (!purpose) requiredMissing.push('intake-purpose');
      if (!message) requiredMissing.push('intake-message');

      if (requiredMissing.length) {
        setStatus('Please complete the required fields (Name, Purpose, Message).', 'error');
        requiredMissing.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.setAttribute('aria-invalid', 'true');
        });
        var first = document.getElementById(requiredMissing[0]);
        if (first) first.focus();
        return;
      }

      var subject = '[' + purpose + '] ' + name + (org ? ' — ' + org : '');
      var endpoint = form.getAttribute('data-endpoint');
      var submit = form.querySelector('button[type="submit"]');

      if (endpoint) {
        var payload = new FormData();
        payload.set('name', name);
        if (org) payload.set('organisation', org);
        payload.set('purpose', purpose);
        if (timeline) payload.set('timeline', timeline);
        payload.set('message', message);
        payload.set('_subject', subject);
        payload.set('_replyto', '');

        setStatus('Sending message…');
        if (submit) submit.disabled = true;

        fetch(endpoint, {
          method: 'POST',
          body: payload,
          headers: { 'Accept': 'application/json' }
        }).then(function (response) {
          if (response.ok) {
            setStatus('Message sent. I will be in touch.');
            form.reset();
          } else {
            return response.json().then(function (body) {
              var err = (body && body.errors && body.errors.map(function (x) { return x.message; }).join(', ')) || 'Send failed.';
              setStatus(err + ' Prefer email? Reach me at dele_aly@yahoo.fr.', 'error');
            }).catch(function () {
              setStatus('Send failed. Prefer email? Reach me at dele_aly@yahoo.fr.', 'error');
            });
          }
        }).catch(function () {
          setStatus('Network error. Prefer email? Reach me at dele_aly@yahoo.fr.', 'error');
        }).finally(function () {
          if (submit) submit.disabled = false;
        });
        return;
      }

      // Fallback: mailto composition if no endpoint is configured
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
