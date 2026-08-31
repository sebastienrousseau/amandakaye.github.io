// Apex Theme Main Script for Amanda Kaye
"use strict";
(function () {
  var storedTheme = localStorage.getItem("theme-mode") || "system";

  function applyTheme(mode) {
    var effectiveTheme = mode;
    if (mode === "system") {
      var isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveTheme = isDark ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme-mode", mode);
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme", effectiveTheme);
  }

  applyTheme(storedTheme);

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if ((localStorage.getItem("theme-mode") || "system") === "system") {
        applyTheme("system");
      }
    });
  }

  function initApp() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "./" }).then(function(reg) { reg.update(); }).catch(function () {});
    }

    var toggle = document.getElementById("themeToggle");
    var root = document.documentElement;
    if (toggle) {
      toggle.addEventListener("click", function () {
        var current = root.getAttribute("data-theme") || "light";
        var next = current === "dark" ? "light" : "dark";
        applyTheme(next);
      });
    }

    var navToggle = document.getElementById("navToggle");
    var navMenu = document.getElementById("navMenu");
    if (navToggle && navMenu) {
      navToggle.addEventListener("click", function () {
        var expanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!expanded));
        navMenu.classList.toggle("show");
      });
    }

    // Search Engine
    var searchIndex = null;
    var isFetching = false;
    var modal = document.getElementById("searchModal");
    var input = document.getElementById("searchInput");
    var results = document.getElementById("searchResults");
    var trigger = document.getElementById("searchTrigger");
    var closeBtn = document.getElementById("searchClose");

    async function loadSearch() {
      if (searchIndex || isFetching) return;
      isFetching = true;
      try {
        var res = await fetch("/search-index.json");
        if (res.ok) {
          var data = await res.json();
          searchIndex = Array.isArray(data) ? data : (data.entries || []);
        }
      } catch (e) {
        searchIndex = [];
      } finally {
        isFetching = false;
      }
    }

    function openSearch() {
      if (!modal) return;
      modal.style.display = "flex";
      modal.classList.add("active");
      loadSearch();
      setTimeout(function () { if (input) input.focus(); }, 50);
    }

    function closeSearch() {
      if (!modal) return;
      modal.classList.remove("active");
      modal.style.display = "none";
      if (input) input.value = "";
      if (results) results.innerHTML = '<div class="search-empty">Type to search...</div>';
    }

    if (trigger) trigger.addEventListener("click", openSearch);
    if (closeBtn) closeBtn.addEventListener("click", closeSearch);
    if (modal) {
      var backdrop = modal.querySelector(".search-backdrop");
      if (backdrop) backdrop.addEventListener("click", closeSearch);
    }

    window.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      } else if (e.key === "Escape" && modal && modal.classList.contains("active")) {
        closeSearch();
      }
    });

    if (input) {
      input.addEventListener("input", function () {
        var query = input.value.trim().toLowerCase();
        if (!query) {
          results.innerHTML = '<div class="search-empty">Type to search...</div>';
          return;
        }
        if (!searchIndex) {
          results.innerHTML = '<div class="search-empty">Loading search index...</div>';
          loadSearch().then(function () { input.dispatchEvent(new Event("input")); });
          return;
        }
        var tokens = query.split(/\s+/).filter(Boolean);
        var matches = searchIndex.filter(function (item) {
          var t = (item.title || "").toLowerCase();
          var d = (item.description || "").toLowerCase();
          var c = (item.content || "").toLowerCase();
          var target = t + " " + d + " " + c;
          return tokens.every(function (tok) { return target.includes(tok); });
        }).slice(0, 8);

        if (matches.length === 0) {
          results.innerHTML = '<div class="search-empty">No results found for "' + query + '"</div>';
          return;
        }

        results.innerHTML = matches.map(function (item) {
          return '<a class="search-item" href="' + item.url + '">' +
            '<div class="search-item-title">' + item.title + '</div>' +
            '<div class="search-item-desc">' + (item.description || item.content || "").replace(/<[^>]+>/g, "").slice(0, 120) + '...</div>' +
          '</a>';
        }).join("");
      });
    }

    // Photo Lightbox Modal Engine (Created Strictly On-Demand)
    var lightboxModal = null;
    function openLightbox(src, alt) {
      if (!lightboxModal) {
        lightboxModal = document.getElementById("photoLightboxModal");
        if (!lightboxModal) {
          lightboxModal = document.createElement("div");
          lightboxModal.id = "photoLightboxModal";
          lightboxModal.className = "photo-lightbox-modal";
          lightboxModal.style.display = "none";
          lightboxModal.setAttribute("role", "dialog");
          lightboxModal.setAttribute("aria-modal", "true");
          lightboxModal.setAttribute("aria-label", "Photo Preview");
          lightboxModal.innerHTML = '<div class="photo-lightbox-backdrop"></div>' +
            '<div class="photo-lightbox-content">' +
            '  <div class="photo-lightbox-media-wrap">' +
            '    <button type="button" class="photo-lightbox-close" aria-label="Close photo preview">✕</button>' +
            '    <img src="" alt="" class="photo-lightbox-img" id="lightboxImg" />' +
            '  </div>' +
            '  <div class="photo-lightbox-caption" id="lightboxCaption"></div>' +
            '</div>';
          document.body.appendChild(lightboxModal);

          var lClose = lightboxModal.querySelector(".photo-lightbox-close");
          var lBackdrop = lightboxModal.querySelector(".photo-lightbox-backdrop");
          if (lClose) lClose.addEventListener("click", closeLightbox);
          if (lBackdrop) lBackdrop.addEventListener("click", closeLightbox);
        }
      }

      var lightboxImg = lightboxModal.querySelector("#lightboxImg");
      var lightboxCaption = lightboxModal.querySelector("#lightboxCaption");
      if (lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || "Photo Preview";
      }
      if (lightboxCaption) lightboxCaption.textContent = alt || "";
      lightboxModal.style.display = "flex";
      lightboxModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      if (!lightboxModal) return;
      lightboxModal.classList.remove("active");
      lightboxModal.style.display = "none";
      var lightboxImg = lightboxModal.querySelector("#lightboxImg");
      if (lightboxImg) lightboxImg.src = "";
      document.body.style.overflow = "";
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightboxModal && lightboxModal.classList.contains("active")) {
        closeLightbox();
      }
    });

    document.addEventListener("click", function (e) {
      var photoTarget = e.target.closest(".photo-card, .photo-img-wrapper, .gallery-card, .gallery-img-wrapper, .hero-image");
      if (photoTarget) {
        var img = photoTarget.querySelector("img");
        if (img && img.src) {
          e.preventDefault();
          openLightbox(img.src, img.alt);
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
