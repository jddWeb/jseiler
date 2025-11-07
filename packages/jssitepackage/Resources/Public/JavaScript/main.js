/** =========================================================================
 * main.js – Self-healing Menu + Overlay + Mega-Panel (Desktop)
 * Mobil: Drill-Button toggelt; Label (Parent-Link) navigiert immer
 * Keyboard A11y: Pfeiltasten, ESC, aria-expanded
 * Deduping: doppelte Drill-Buttons werden entfernt
 * ========================================================================= */
(function () {
    "use strict";

    window.JD = window.JD || {};
    window.JD._version = "main.js:selfheal-mega:bunker:2025-11-07f";

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
    function isDesktop(){ return window.matchMedia("(min-width: 1230px)").matches; }

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
                list.parentNode.insertBefore(wrapper, list);
                wrapper.appendChild(list);
            }
        } else {
            wrapper.classList.add("c-menu__wrapper");
            wrapper.setAttribute("data-menu-wrapper", "");
            if (!wrapper.id) wrapper.id = "primary-menu-wrapper";
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
                linkEl.setAttribute("aria-expanded", "false");

                if (subMob) {
                    if (!subMob.id) subMob.id = "submenu-auto-" + idx;
                    linkEl.setAttribute("aria-controls", subMob.id);
                } else if (panel) {
                    if (!panel.id) panel.id = "panel-auto-" + idx;
                    linkEl.setAttribute("aria-controls", panel.id);
                }

                // Drill nur erzeugen, wenn GAR KEIN Drill im LI existiert (egal wo)
                var anyDrill = item.querySelector(".c-menu__drill");
                if (!anyDrill && subMob) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "c-menu__drill";
                    btn.setAttribute("aria-label", "Ebene öffnen");
                    btn.setAttribute("data-menu-drill", subMob.id);
                    item.appendChild(btn);
                }
            }

            // HARTE DEDUPLIZIERUNG: nur den ersten Drill behalten – alle weiteren löschen
            var allDrills = item.querySelectorAll(".c-menu__drill");
            if (allDrills.length > 1) {
                for (var i = 1; i < allDrills.length; i++) {
                    if (allDrills[i] && allDrills[i].parentNode) {
                        allDrills[i].parentNode.removeChild(allDrills[i]);
                    }
                }
            }
        });

        // CTA ins Overlay klonen (nur mobil relevant)
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

        return { menu: menu, wrapper: wrapper };
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

    // Mobil: Overlay + Akkordeon (nur Drill toggelt) + Label klickt durch
    function initMenuDelegated(){
        var mqDesktop = window.matchMedia("(min-width: 1230px)");

        // Overlay öffnen/schließen
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

        // Label-Klick mobil → immer Navigation (niemals toggeln)
        document.addEventListener("click", function(e){
            if (mqDesktop.matches) return;
            var link = e.target.closest(".c-menu__link.js-menu-parent");
            if (!link) return;

            var href = link.getAttribute("href");
            if (!href || href === "#") return;

            e.preventDefault();
            e.stopPropagation();
            try { window.location.assign(href); }
            catch(_) { window.location.href = href; }
        }, { capture: true });

        // Cleanup bei Wechsel zu Desktop
        function cleanup(){
            if (!mqDesktop.matches) return;
            $$(document, "[data-menu-root], .js-menu").forEach(function(menuRoot){
                var wrapper = $(menuRoot, "[data-menu-wrapper], .c-menu__wrapper");
                if (!wrapper) return;
                wrapper.classList.remove("is-open");
                $$(menuRoot, "[data-menu-toggle], .c-menu__toggle").forEach(function(tg){
                    tg.classList.remove("is-active");
                    tg.setAttribute("aria-expanded", "false");
                });
                $$(menuRoot, ".c-menu__item.is-open").forEach(function (it){ it.classList.remove("is-open"); });
                $$(menuRoot, ".c-menu__submenu").forEach(function (sm){ sm.style.display = ""; });
            });
        }
        cleanup();
        if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", cleanup);
        else mqDesktop.addListener(cleanup);
        window.addEventListener("resize", throttle(cleanup, 100));
    }

    // Desktop: Mega-Panel + Keyboard-A11y
    function initMegaPanelDesktop(){
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
            if (!isDesktop()) return;
            closeMega();
            item.classList.add("is-mega-open");
            var trigger = $(item, ".c-menu__link.js-menu-parent");
            if (trigger) trigger.setAttribute("aria-expanded", "true");
        }
        function closeMega(){
            if (!isDesktop()) return;
            $$(menu, ".c-menu__item.is-mega-open").forEach(function(i){
                i.classList.remove("is-mega-open");
                var t = $(i, ".c-menu__link.js-menu-parent");
                if (t) t.setAttribute("aria-expanded", "false");
            });
        }

        // Öffnen per Hover/Fokus
        menu.addEventListener("mouseenter", function(e){
            var item = e.target.closest(".c-menu__item.has-submenu");
            if (item && menu.contains(item) && isDesktop()) openMega(item);
        }, true);
        menu.addEventListener("focusin", function(e){
            var item = e.target.closest(".c-menu__item.has-submenu, .c-menu__item");
            if (item && menu.contains(item) && isDesktop()) {
                if (item.classList.contains("has-submenu")) openMega(item);
                else closeMega();
            }
        });

        // Schließen
        $(".c-header").addEventListener("mouseleave", function(){ if (isDesktop()) closeMega(); });
        document.addEventListener("keydown", function(e){
            if (e.key === "Escape") {
                closeMega();
                var activeTop = $(".c-menu__link.js-menu-parent[aria-expanded='true']") || $(".c-menu__link");
                activeTop && activeTop.focus && activeTop.focus();
            }
        });

        // Tastaturnavigation
        menu.addEventListener("keydown", function(e){
            if (!isDesktop()) return;

            var topLinks = $$(menu, ".c-menu__list > .c-menu__item > .c-menu__link");
            if (!topLinks.length) return;

            var current = e.target;
            var currentTopIndex = topLinks.indexOf(current);

            // Auf Ebene 1: Links/Rechts navigieren
            if (currentTopIndex > -1) {
                if (e.key === "ArrowRight" || e.key === "Right") {
                    e.preventDefault();
                    var next = topLinks[(currentTopIndex + 1) % topLinks.length];
                    next.focus();
                    if (next.closest(".c-menu__item").classList.contains("has-submenu")) openMega(next.closest(".c-menu__item"));
                    else closeMega();
                }
                if (e.key === "ArrowLeft" || e.key === "Left") {
                    e.preventDefault();
                    var prev = topLinks[(currentTopIndex - 1 + topLinks.length) % topLinks.length];
                    prev.focus();
                    if (prev.closest(".c-menu__item").classList.contains("has-submenu")) openMega(prev.closest(".c-menu__item"));
                    else closeMega();
                }
                if (e.key === "ArrowDown" || e.key === "Down") {
                    var item = current.closest(".c-menu__item");
                    if (item && item.classList.contains("has-submenu")) {
                        var firstPanelLink = $(item, ".c-menu__panel .c-menu__panel-link, .c-menu__panel .c-menu__panel-sublink");
                        if (firstPanelLink) {
                            e.preventDefault();
                            openMega(item);
                            firstPanelLink.focus();
                        }
                    }
                }
                return;
            }

            // Im Panel
            var inPanel = current.closest && current.closest(".c-menu__panel");
            if (inPanel) {
                var itemRoot = current.closest(".c-menu__item");
                var panelFocusables = $$(itemRoot, ".c-menu__panel .c-menu__panel-link, .c-menu__panel .c-menu__panel-sublink, .c-menu__panel a, .c-menu__panel button")
                    .filter(function(el){ return el.offsetParent !== null; });
                var idx = panelFocusables.indexOf(current);

                if (e.key === "ArrowDown" || e.key === "Down") {
                    if (panelFocusables.length) {
                        e.preventDefault();
                        panelFocusables[(idx + 1) % panelFocusables.length].focus();
                    }
                }
                if (e.key === "ArrowUp" || e.key === "Up") {
                    if (panelFocusables.length) {
                        e.preventDefault();
                        panelFocusables[(idx - 1 + panelFocusables.length) % panelFocusables.length].focus();
                    }
                }
                if (e.key === "ArrowLeft" || e.key === "Left") {
                    e.preventDefault();
                    var topTrigger = $(itemRoot, ".c-menu__link");
                    topTrigger && topTrigger.focus();
                }
                if (e.key === "Escape") {
                    e.preventDefault();
                    closeMega();
                    var topTrigger2 = $(itemRoot, ".c-menu__link");
                    topTrigger2 && topTrigger2.focus();
                }
            }
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

    // Desktop-CTA-Härtung: Overlay-CTA auf Desktop entfernen
    function hardenDesktopCta(){
        var mqDesktop = window.matchMedia("(min-width: 1230px)");
        function toggleMenuCta(){
            var menuCta = document.querySelector("nav.c-menu .c-menu__cta");
            if (!menuCta) return;
            if (mqDesktop.matches) {
                menuCta.parentNode && menuCta.parentNode.removeChild(menuCta);
            }
        }
        toggleMenuCta();
        if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", toggleMenuCta);
        else mqDesktop.addListener(toggleMenuCta);
    }

    function boot(){
        ensureMenuStructure();
        initStickyHeader();
        initMenuDelegated();     // Mobil
        initMegaPanelDesktop();  // Desktop + Keyboard
        markActivePath();
        hardenDesktopCta();      // CTA doppelt verhindern (Desktop)
        console.log("JD ready:", window.JD._version);
    }
    ready(boot);
})();
