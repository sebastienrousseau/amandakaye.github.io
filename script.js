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

  // Agent diagram tooltips (accessible: hover + keyboard focus)
  var diagram = document.querySelector('[data-agent-diagram]');
  if (diagram) {
    var tooltip = document.createElement('div');
    tooltip.className = 'agent-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('id', 'agentTooltip');
    document.body.appendChild(tooltip);

    var showTip = function (target) {
      var text = target.getAttribute('data-tip');
      if (!text) return;
      tooltip.textContent = text;
      var rect = target.getBoundingClientRect();
      var top = window.scrollY + rect.top - tooltip.offsetHeight - 10;
      var left = window.scrollX + rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
      tooltip.style.top = Math.max(8, top) + 'px';
      tooltip.style.left = Math.max(8, left) + 'px';
      tooltip.setAttribute('data-visible', 'true');
    };
    var hideTip = function () { tooltip.removeAttribute('data-visible'); };

    diagram.querySelectorAll('.agent-node').forEach(function (node) {
      node.setAttribute('tabindex', '0');
      node.setAttribute('aria-describedby', 'agentTooltip');
      node.addEventListener('mouseenter', function () { showTip(node); });
      node.addEventListener('mouseleave', hideTip);
      node.addEventListener('focus', function () { showTip(node); });
      node.addEventListener('blur', hideTip);
    });
    window.addEventListener('scroll', hideTip, { passive: true });
  }

  // Contact intake form: compose a structured mailto: link (static-site friendly)
  var form = document.getElementById('intakeForm');
  if (form) {
    var status = document.getElementById('intakeStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var org = (data.get('organisation') || '').toString().trim();
      var purpose = (data.get('purpose') || '').toString().trim();
      var timeline = (data.get('timeline') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();

      if (!name || !purpose || !message) {
        if (status) {
          status.textContent = 'Please complete name, purpose and message.';
          status.setAttribute('data-state', 'error');
        }
        return;
      }

      var subject = '[' + purpose + '] ' + name + (org ? ' — ' + org : '');
      var body = [
        'From: ' + name,
        org ? 'Organisation: ' + org : null,
        'Purpose: ' + purpose,
        timeline ? 'Timeline: ' + timeline : null,
        '',
        message,
        '',
        '—',
        'Submitted from bamidelealy.github.io'
      ].filter(Boolean).join('\n');

      var to = form.getAttribute('data-mailto') || 'dele_aly@yahoo.fr';
      var href = 'mailto:' + to
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      if (status) {
        status.textContent = 'Opening your email client…';
        status.removeAttribute('data-state');
      }
      window.location.href = href;
    });
  }
})();
