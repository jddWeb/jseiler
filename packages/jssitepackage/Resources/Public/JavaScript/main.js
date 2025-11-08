/** =========================================================================
 * main.js – Menu + Overlay + Mega-Panel (Desktop) + A11y refinements
 * Mobil: Drill-Button toggelt; Label (Parent-Link) navigiert immer
 * + Hero-Slider (Autoplay, Pfeile, Bullets, Tastatur, Swipe)
 * ========================================================================= */
(function () {
    "use strict";

    window.JD = window.JD || {};
    window.JD._version = "main.js:selfheal-mega:a11y-scrolltrap:hero:2025-11-07b";

    function ready(fn){
        if (document.readyState !== "loading") fn();
        else document.addEventListener("DOMContentLoaded", fn);
    }

    // Helpers
    function $(a, b){
        if (b === undefined) { return document.querySelector(a); }
        var root = (a && typeof a.querySelector === "function") ? a : document;
        return root.querySelector(b);
    }
    function $$(a, b){
        var root, sel;
        if (b === undefined) { root = document; sel = a; }
        else { root = (a && typeof a.querySelectorAll === "function") ? a : document; sel = b; }
        return Array.prototype.slice.call(root.querySelectorAll(sel));
    }
    function throttle (fn, wait){
        var last = 0, t = null;
        return function(){
            var now = Date.now();
            if (now - last >= wait){ last = now; fn.apply(this, arguments); }
            else { clearTimeout(t); t = setTimeout(function(){ last = Date.now(); fn.apply(this, arguments); }, wait - (now - last)); }
        };
    }
    function setNoScroll(on){
        document.documentElement.classList.toggle("u-noscroll", on);
        document.body.classList.toggle("u-noscroll", on);
        if (on) {
            document.documentElement.style.scrollBehavior = "auto"; // avoid jump animations when locking
        } else {
            document.documentElement.style.scrollBehavior = "";
        }
    }

    // Struktur absichern
    function ensureMenuStructure(){
        var menu = $(".c-menu") || $("nav[aria-label='Hauptnavigation']") || $(".js-menu");
        if (!menu) return null;

        menu.classList.add("js-menu");
        if (!menu.hasAttribute("data-menu-root")) menu.setAttribute("data-menu-root", "");

        var wrapper = $(menu, "[data-menu-wrapper], .c-menu__wrapper");
        if (!wrapper) {
            var list = $(menu, ".c-menu__list") || $(menu, "ul");
            if (list) {
                wrapper = document.createElement("div");
                wrapper.className = "c-menu__wrapper";
                wrapper.setAttribute("data-menu-wrapper", "");
                wrapper.id = "primary-menu-wrapper";
                wrapper.setAttribute("aria-hidden", "true");
                list.parentNode.insertBefore(wrapper, list);
                wrapper.appendChild(list);
            }
        } else {
            wrapper.classList.add("c-menu__wrapper");
            wrapper.setAttribute("data-menu-wrapper", "");
            if (!wrapper.id) wrapper.id = "primary-menu-wrapper";
            if (!wrapper.hasAttribute("aria-hidden")) wrapper.setAttribute("aria-hidden", "true");
        }

        var toggle = $(menu, "[data-menu-toggle], .c-menu__toggle");
        if (!toggle) {
            toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "c-menu__toggle";
            toggle.setAttribute("data-menu-toggle", "");
            toggle.setAttribute("aria-controls", (wrapper && wrapper.id) ? wrapper.id : "primary-menu-wrapper");
            toggle.setAttribute("aria-expanded", "false");
            var bar = document.createElement("span");
            bar.setAttribute("aria-hidden", "true");
            var sr = document.createElement("span");
            sr.className = "u-visually-hidden";
            sr.textContent = "Menü";
            toggle.appendChild(bar);
            toggle.appendChild(sr);
            if (wrapper) wrapper.parentNode.insertBefore(toggle, wrapper);
            else menu.insertBefore(toggle, menu.firstChild);
        } else {
            toggle.classList.add("c-menu__toggle");
            toggle.setAttribute("data-menu-toggle", "");
            if (!toggle.getAttribute("aria-expanded")) toggle.setAttribute("aria-expanded", "false");
            if (wrapper && !toggle.getAttribute("aria-controls")) toggle.setAttribute("aria-controls", wrapper.id);
        }

        // Items verdrahten (mobil: Drill toggelt, Label navigiert)
        $$(menu, ".c-menu__item").forEach(function (item, idx){
            var linkEl = $(item, ".c-menu__link");
            var subMob = item.querySelector(":scope > .c-menu__submenu");
            var panel  = item.querySelector(":scope > .c-menu__panel");

            if ((subMob || panel) && linkEl) {
                item.classList.add("has-submenu");
                linkEl.classList.add("js-menu-parent");
                linkEl.setAttribute("data-menu-parent", "true");
                linkEl.setAttribute("aria-haspopup", "true");

                if (subMob) { if (!subMob.id) subMob.id = "submenu-auto-" + idx; linkEl.setAttribute("aria-controls", subMob.id); }
                else if (panel) { if (!panel.id) panel.id = "panel-auto-" + idx; linkEl.setAttribute("aria-controls", panel.id); }

                linkEl.setAttribute("aria-expanded", "false");

                if (subMob && !$(item, ".c-menu__drill")) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "c-menu__drill";
                    btn.setAttribute("aria-label", "Ebene öffnen");
                    btn.setAttribute("data-menu-drill", subMob.id);
                    item.appendChild(btn);
                }
            }
        });

        // CTA ins Overlay klonen (falls fehlt)
        if (!$(wrapper, ".c-menu__cta")) {
            var headerCTA = $(".c-header__cta");
            if (headerCTA) {
                var cta = document.createElement("a");
                cta.className = "c-menu__cta";
                cta.href = headerCTA.getAttribute("href") || "#";
                var lbl = $(headerCTA, ".c-header__cta-label");
                cta.textContent = (lbl && lbl.textContent) ? lbl.textContent : headerCTA.textContent.trim() || "Öffentliche Seminartermine";
                wrapper.appendChild(cta);
            }
        }

        return { menu: menu, wrapper: wrapper, toggle: toggle };
    }

    // Sticky Header
    function initStickyHeader(){
        var header = $(".c-header");
        if (!header) return;
        var onScroll = throttle(function(){
            header.classList.toggle("is-sticky", window.scrollY > 4);
        }, 50);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Mobil: Overlay + Akkordeon (nur Drill toggelt) + Label klickt durch + Scroll-Lock + Focus-Trap
    function initMenuDelegated(){
        var mqDesktop = window.matchMedia("(min-width: 1230px)");

        // Track last focused element for returning focus on close
        var lastFocus = null;

        // Overlay öffnen/schließen (Burger + Close)
        document.addEventListener("click", function(e){
            var toggle = e.target.closest("[data-menu-toggle], .c-menu__toggle");
            if (!toggle) return;

            var menuRoot = toggle.closest("[data-menu-root], .js-menu") || document;
            var wrapper  = $(menuRoot, "[data-menu-wrapper], .c-menu__wrapper");
            if (!wrapper) return;
            e.preventDefault();

            var willOpen = !wrapper.classList.contains("is-open");
            wrapper.classList.toggle("is-open", willOpen);
            menuRoot.classList.toggle("is-open", willOpen);

            var id = wrapper.id;
            $$(menuRoot, "[data-menu-toggle], .c-menu__toggle").forEach(function(tg){
                var controls = tg.getAttribute("aria-controls");
                if (!controls || controls === id) {
                    tg.classList.toggle("is-active", willOpen);
                    tg.setAttribute("aria-expanded", String(willOpen));
                }
            });

            // A11y + Scroll lock
            wrapper.setAttribute("aria-hidden", willOpen ? "false" : "true");
            setNoScroll(willOpen);

            // Fokusmanagement
            if (willOpen) {
                lastFocus = document.activeElement;
                var closeBtn = $(".c-menu__close");
                if (closeBtn) { try { closeBtn.focus(); } catch(_){} }
            } else if (lastFocus && lastFocus.focus) {
                try { lastFocus.focus(); } catch(_){}
                lastFocus = null;
            }
        }, { capture: true, passive: false });

        // Drill toggelt (Parent-Link navigiert)
        document.addEventListener("click", function(e){
            if (mqDesktop.matches) return;
            var drill = e.target.closest(".c-menu__drill");
            if (!drill) return;

            var subId = drill.getAttribute("data-menu-drill");
            var submenu = subId && document.getElementById(subId);
            var item = drill.closest(".c-menu__item");
            var parent = item && $(item, ".js-menu-parent");
            if (!submenu || !item || !parent) return;

            e.preventDefault();
            var isOpen = item.classList.toggle("is-open");
            parent.setAttribute("aria-expanded", String(isOpen));
            submenu.style.display = isOpen ? "flex" : "none";
        });

        // WICHTIG: Label-Klick mobil → immer Navigation (niemals toggeln/aufräumen)
        document.addEventListener("click", function(e){
            if (mqDesktop.matches) return; // nur mobil
            var link = e.target.closest(".c-menu__link.js-menu-parent");
            if (!link) return;

            var href = link.getAttribute("href");
            if (!href || href === "#") return;

            // absolut navigieren und jegliches internes Handling verhindern
            e.preventDefault();
            e.stopPropagation();
            try { window.location.assign(href); }
            catch(_) { window.location.href = href; }
        }, { capture: true });

        // Mobil: echte Navigationslinks schließen das Menü (Autoclose)
        document.addEventListener("click", function(e){
            if (mqDesktop.matches) return;
            var link = e.target.closest(".c-menu__submenu-link, .c-menu__panel-sublink, .c-menu__link:not(.js-menu-parent)");
            if (!link) return;
            var wrap = $(".c-menu__wrapper.is-open");
            if (!wrap) return;
            // Schließen
            wrap.classList.remove("is-open");
            var root = wrap.closest(".c-menu");
            if (root) root.classList.remove("is-open");
            document.querySelectorAll("[data-menu-toggle], .c-menu__toggle").forEach(function(tg){
                tg.classList.remove("is-active");
                tg.setAttribute("aria-expanded", "false");
            });
            wrap.setAttribute("aria-hidden", "true");
            setNoScroll(false);
        }, { capture: true });

        // ESC schließt (mobil & Desktop-Overlay falls offen)
        document.addEventListener("keydown", function(e){
            if (e.key !== "Escape") return;
            var wrap = $(".c-menu__wrapper.is-open");
            if (!wrap) return;
            e.preventDefault();
            wrap.classList.remove("is-open");
            var root = wrap.closest(".c-menu");
            if (root) root.classList.remove("is-open");
            document.querySelectorAll("[data-menu-toggle], .c-menu__toggle").forEach(function(tg){
                tg.classList.remove("is-active");
                tg.setAttribute("aria-expanded", "false");
            });
            wrap.setAttribute("aria-hidden", "true");
            setNoScroll(false);
            var toggle = $("[data-menu-toggle], .c-menu__toggle");
            if (toggle) { try { toggle.focus(); } catch(_){} }
        });

        // Fokus-Falle fürs Overlay
        document.addEventListener("keydown", function(e){
            if (e.key !== "Tab") return;
            var wrap = $(".c-menu__wrapper.is-open");
            if (!wrap) return;
            var focusables = wrap.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusables.length) return;
            var first = focusables[0];
            var last  = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        });

        // Cleanup bei Wechsel zu Desktop
        function cleanup(){
            if (!mqDesktop.matches) return;
            $$(document, "[data-menu-root], .js-menu").forEach(function(menuRoot){
                var wrapper = $(menuRoot, "[data-menu-wrapper], .c-menu__wrapper");
                if (!wrapper) return;
                wrapper.classList.remove("is-open");
                wrapper.setAttribute("aria-hidden", "true");
                $$(menuRoot, "[data-menu-toggle], .c-menu__toggle").forEach(function(tg){
                    tg.classList.remove("is-active");
                    tg.setAttribute("aria-expanded", "false");
                });
                $$(menuRoot, ".c-menu__item.is-open").forEach(function (it){ it.classList.remove("is-open"); });
                $$(menuRoot, ".c-menu__submenu").forEach(function (sm){ sm.style.display = ""; });
            });
            setNoScroll(false);
        }
        cleanup();
        if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", cleanup);
        else mqDesktop.addListener(cleanup);
        window.addEventListener("resize", throttle(cleanup, 100));
    }

    // Desktop: Mega-Panel
    function initMegaPanelDesktop(){
        var mqDesktop = window.matchMedia("(min-width: 1230px)");
        var header = $(".c-header");
        var menu = $(".c-menu");
        if (!menu || !header) return;

        function setHeaderBottomVar(){
            var rect = header.getBoundingClientRect();
            document.documentElement.style.setProperty("--header-bottom", rect.bottom + "px");
        }
        setHeaderBottomVar();
        window.addEventListener("resize", throttle(setHeaderBottomVar, 100));
        window.addEventListener("scroll", throttle(setHeaderBottomVar, 100), { passive: true });

        function openMega(item){
            if (!mqDesktop.matches) return;
            closeMega();
            item.classList.add("is-mega-open");
        }
        function closeMega(){
            if (!mqDesktop.matches) return;
            $$(menu, ".c-menu__item.is-mega-open").forEach(function(i){ i.classList.remove("is-mega-open"); });
        }

        // Öffnen per Hover/Fokus
        menu.addEventListener("mouseenter", function(e){
            var item = e.target.closest(".c-menu__item.has-submenu");
            if (item && menu.contains(item) && mqDesktop.matches) openMega(item);
        }, true);
        menu.addEventListener("focusin", function(e){
            var item = e.target.closest(".c-menu__item.has-submenu");
            if (item && menu.contains(item) && mqDesktop.matches) openMega(item);
        });

        // Schließen
        $(".c-header").addEventListener("mouseleave", function(){ if (mqDesktop.matches) closeMega(); });
        document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeMega(); });
        document.addEventListener("click", function(e){
            if (!mqDesktop.matches) return;
            var panel = e.target.closest(".c-menu__panel");
            var trigger = e.target.closest(".c-menu__item.has-submenu");
            if (!panel && !trigger) closeMega();
        });
    }

    // Active-Path
    function markActivePath(){
        try {
            var loc = window.location;
            var here = loc.origin + loc.pathname.replace(/\/+$/, "/");
            var best = null, bestLen = 0;

            $$(".c-menu .c-menu__link, .c-menu .c-menu__panel-link, .c-menu .c-menu__submenu-link").forEach(function(a){
                var href = a.getAttribute("href");
                if (!href || href.indexOf("#") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;

                var url;
                try { url = new URL(href, loc.origin); } catch(e){ return; }
                var path = url.origin + url.pathname.replace(/\/+$/, "/");

                if (here.indexOf(path) === 0 && path.length > bestLen) {
                    best = a; bestLen = path.length;
                }
            });

            if (best) {
                best.classList.add("is-active");
                var li = best.closest(".c-menu__item");
                if (li) li.classList.add("is-active");
            }
        } catch(e){ /* noop */ }
    }

    function boot(){
        ensureMenuStructure();
        initStickyHeader();
        initMenuDelegated();     // Mobil + A11y
        initMegaPanelDesktop();  // Desktop
        markActivePath();
        console.log("JD ready:", window.JD._version);
    }

    // Boot auf DOM ready
    ready(boot);

    // ===== Hero Slider (Autoplay + Pfeile + Bullets + Tastatur + Swipe) =====
    (function(){
        function initHero(){
            var root = document.querySelector(".js-hero[data-hero]");
            if (!root) return;

            var viewport = root.querySelector("[data-hero-viewport]");
            var slides   = Array.prototype.slice.call(root.querySelectorAll(".c-hero__slide"));
            var prevBtn  = root.querySelector("[data-hero-prev]");
            var nextBtn  = root.querySelector("[data-hero-next]");
            var bullets  = Array.prototype.slice.call(root.querySelectorAll("[data-hero-bullet]"));

            var i = Math.max(0, slides.findIndex(function(s){ return s.classList.contains("is-active"); }));
            if (i < 0) i = 0;

            // Autoplay aus ContentBlock + reduced-motion
            var autoplayAttr = root.getAttribute("data-hero-autoplay");
            var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            var autoplay = (autoplayAttr === "1") && !reduced;
            var delay = 6000; // 6s
            var timer = null;

            function syncBullets(n){
                bullets.forEach(function(b, idx){
                    var active = (idx === n);
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-selected", active ? "true" : "false");
                });
            }
            function show(n){
                slides.forEach(function(s, idx){ s.classList.toggle("is-active", idx === n); });
                i = n;
                syncBullets(i);
            }
            function next(){ show((i + 1) % slides.length); }
            function prev(){ show((i - 1 + slides.length) % slides.length); }

            function start(){ if (!autoplay) return; stop(); timer = setInterval(next, delay); }
            function stop(){ if (timer) { clearInterval(timer); timer = null; } }

            // Pfeile
            if (prevBtn) prevBtn.addEventListener("click", function(){ prev(); start(); });
            if (nextBtn) nextBtn.addEventListener("click", function(){ next(); start(); });

            // Bullets
            bullets.forEach(function(b){
                b.addEventListener("click", function(){
                    var idx = parseInt(b.getAttribute("data-hero-bullet"), 10) || 0;
                    show(idx); start();
                });
            });

            // Hover pausiert auf Desktop
            root.addEventListener("mouseenter", stop);
            root.addEventListener("mouseleave", start);

            // Tastatur
            root.addEventListener("keydown", function(e){
                if (e.key === "ArrowLeft") { e.preventDefault(); prev(); start(); }
                if (e.key === "ArrowRight"){ e.preventDefault(); next(); start(); }
            });

            // Swipe mobil
            var startX = 0, dx = 0, active = false;
            viewport.addEventListener("touchstart", function(e){ active = true; startX = e.touches[0].clientX; dx = 0; stop(); }, {passive:true});
            viewport.addEventListener("touchmove",  function(e){ if (!active) return; dx = e.touches[0].clientX - startX; }, {passive:true});
            viewport.addEventListener("touchend",   function(){ if (!active) return; active = false; if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); } start(); });

            // Start
            syncBullets(i);
            start();
        }
        ready(initHero);
    })();
})();
