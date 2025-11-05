/** =========================================================================
 * main.js – Self-healing Menu (fixierte Helpers, injiziert Toggle/Wrapper)
 * ========================================================================= */
(function () {
    "use strict";

    // Globale Diagnose
    window.JD = window.JD || {};
    window.JD._version = "main.js:selfheal:2025-11-05c";

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

    // --- 1) SELF-HEAL -------------------------------------------------------
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

        // Parents + Submenu IDs
        $$(menu, ".c-menu__item").forEach(function (item, idx){
            var sub = $(item, ".c-menu__submenu");
            var linkEl = $(item, ".c-menu__link");
            if (sub && linkEl) {
                item.classList.add("has-submenu");
                linkEl.classList.add("js-menu-parent");
                linkEl.setAttribute("data-menu-parent", "");
                linkEl.setAttribute("aria-haspopup", "true");
                if (!sub.id) sub.id = "submenu-auto-" + idx;
                linkEl.setAttribute("aria-controls", sub.id);
                linkEl.setAttribute("aria-expanded", "false");

                // Drill einhängen, wenn nicht vorhanden
                if (!$(item, ".c-menu__drill")) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "c-menu__drill";
                    btn.setAttribute("aria-label", "Ebene öffnen");
                    btn.setAttribute("data-menu-drill", sub.id);
                    item.appendChild(btn);
                }
            }
        });

        // CTA im Overlay – nur falls nicht im Markup vorhanden
        if (!$(wrapper, ".c-menu__cta")) {
            var headerCTA = $(".c-header__cta");
            if (headerCTA) {
                var cta = document.createElement("a");
                cta.className = "c-menu__cta";
                cta.href = headerCTA.getAttribute("href") || "#";
                var lbl = $(headerCTA, ".c-header__cta-label");
                cta.textContent = (lbl && lbl.textContent) ? lbl.textContent : headerCTA.textContent.trim() || "Öffentliche Seminare";
                wrapper.appendChild(cta);
            }
        }

        return { menu: menu, wrapper: wrapper };
    }

    // --- 2) Sticky Header ----------------------------------------------------
    function initStickyHeader(){
        var header = $(".c-header");
        if (!header) return;
        var onScroll = throttle(function(){
            header.classList.toggle("is-sticky", window.scrollY > 4);
        }, 50);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    // --- 3) Delegiertes Menü-Handling ---------------------------------------
    function initMenuDelegated(){
        var mqDesktop = window.matchMedia("(min-width: 1230px)");

        // Toggle (öffnen/schließen) – synchronisiert alle zugehörigen Toggles
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

            // Alle Toggles, die auf denselben Wrapper zeigen, angleichen
            var id = wrapper.id;
            $$(menuRoot, "[data-menu-toggle], .c-menu__toggle").forEach(function(tg){
                var controls = tg.getAttribute("aria-controls");
                if (!controls || controls === id) {
                    tg.classList.toggle("is-active", willOpen);
                    tg.setAttribute("aria-expanded", String(willOpen));
                }
            });
        }, { capture: true, passive: false });

        // Submenu mobile – Klick auf Parent
        document.addEventListener("click", function(e){
            var parent = e.target.closest(".js-menu-parent,[data-menu-parent]");
            if (!parent) return;
            if (mqDesktop.matches) return;

            var controls = parent.getAttribute("aria-controls");
            var submenu = controls && document.getElementById(controls);
            var item = parent.closest(".c-menu__item");
            if (!submenu || !item) return;

            e.preventDefault();
            var isOpen = item.classList.toggle("is-open");
            parent.setAttribute("aria-expanded", String(isOpen));
            submenu.style.display = isOpen ? "flex" : "none";
        });

        // Submenu mobile – Klick auf Drill-Pfeil
        document.addEventListener("click", function(e){
            var drill = e.target.closest(".c-menu__drill");
            if (!drill) return;
            if (mqDesktop.matches) return;

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

        // Cleanup beim Wechsel zu Desktop
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

    // --- Boot ----------------------------------------------------------------
    function boot(){
        ensureMenuStructure();
        initStickyHeader();
        initMenuDelegated();
        console.log("JD ready:", window.JD._version);
    }
    ready(boot);
})();
