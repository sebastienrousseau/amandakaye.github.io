---
name: "Amanda Kaye"
short_name: "AK"
title: "Accessibility Statement | Amanda Kaye - Head of PMO"
description: "Accessibility statement for Amanda Kaye's executive portfolio, adhering to WCAG 2.2 Level AA and AAA standards with high contrast and screen reader support."
keywords: "Amanda Kaye Accessibility, WCAG 2.2 AA, WCAG AAA, Digital Inclusion, Accessible Portfolio, Screen Reader Optimized, Section 508, EN 301 549"
author: "Amanda Kaye"
date: "2026-08-31"
language: "en-GB"
layout: "accessibility"
permalink: "https://amandakaye.github.io/accessibility/index.html"
---

<section class="section">
  <div class="container stack">
    <div class="stack text-center">
      <p class="eyebrow">DIGITAL INCLUSION &amp; STANDARDS</p>
      <h1>Accessibility Statement</h1>
      <p class="lead mx-auto" style="max-width:48rem;">Our commitment to universal digital inclusion, WCAG 2.2 Level AA/AAA conformance, and frictionless executive engagement for all users.</p>
    </div>

    <div class="callout-surface text-center" style="margin-top:var(--space-l);">
      <p class="lead" style="margin:0; font-size:1.1rem;">This website is engineered from the ground up to ensure comprehensive accessibility for all visitors, including executives, recruiters, and stakeholders utilizing assistive devices, screen readers, voice dictation, and keyboard navigation.</p>
    </div>

    <div class="card stack" style="padding:var(--space-l); margin-top:var(--space-m);">
      <div class="prose">
        <h2>1. Conformance Standards &amp; Principles</h2>
        <p>We are dedicated to adhering strictly to the <strong>Web Content Accessibility Guidelines (WCAG) 2.2</strong>, covering Level AA and Level AAA success criteria. This platform also conforms to the UK Public Sector Bodies Accessibility Regulations 2018, Section 508 of the US Rehabilitation Act, and the European Standard EN 301 549.</p>

        <h2>2. Core Technical Measures Implemented</h2>
        <ul>
          <li><strong>High Contrast Color Tokens:</strong> All text elements deliver a contrast ratio of at least <strong>7:1</strong> against their background surfaces (exceeding WCAG AAA 1.4.6 requirements), while UI components and focus boundaries maintain at least <strong>3:1</strong> (WCAG AA 1.4.11).</li>
          <li><strong>Keyboard Navigation &amp; Focus Indicators:</strong> Every interactive element—including navigation links, search triggers, modal dialogs, and contact forms—is fully operable using only a keyboard. Clear, non-intrusive focus rings ensure precise visual tracking without focus trapping.</li>
          <li><strong>Semantic HTML5 Landmark Architecture:</strong> The entire layout utilizes native HTML5 landmarks (<code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;footer&gt;</code>) and WAI-ARIA roles to provide intuitive screen reader tree structures.</li>
          <li><strong>Predictable Reflow &amp; Zero Layout Shift:</strong> All image assets declare intrinsic aspect ratios and explicit dimensions. No late-loading third-party web fonts or external tracking scripts alter page layout or trigger reflow during rendering.</li>
          <li><strong>Reduced Motion Compliance:</strong> Media queries respect system-level <code>prefers-reduced-motion</code> settings by disabling all non-essential animations, transitions, and modal zooms.</li>
        </ul>

        <h2>3. Assistive Technology Compatibility</h2>
        <p>This portfolio is continuously tested across modern desktop and mobile platforms with leading assistive technologies: Apple VoiceOver, NVDA, JAWS, Google TalkBack, and switch controls.</p>

        <h2>4. Continuous Testing &amp; CI Verification</h2>
        <p>Accessibility compliance is verified programmatically on every commit through an automated testing pipeline incorporating <code>axe-core</code>, <code>pa11y</code>, and custom contrast analysis gates.</p>
      </div>

      <div style="margin-top:var(--space-m);">
        <a href="/contact/index.html" class="btn btn-primary">Contact Accessibility Team ❯</a>
      </div>
    </div>
  </div>
</section>