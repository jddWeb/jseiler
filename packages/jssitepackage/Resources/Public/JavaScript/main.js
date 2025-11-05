/** =========================================================================
 * main.js – Self-healing Menu (fixierte Helpers, injiziert Toggle/Wrapper)
 * ========================================================================= */
(function () {
    "use strict";

    // Globale Diagnose
    window.JD = window.JD || {};
    window.JD._version = "main.js:selfheal:2025-11-05a";

    function ready(fn){
        if (document.readyState !== "loading") fn();
        else document.addEventListener("DOMContentLoaded", fn);
    }

    // Helpers: unterstützen 1- oder 2-Argument-Aufruf
    function $(a, b){
        // $(selector)  -> document.querySelector(selector)
        // $(root, sel) -> root.querySelector(sel)
        if (b === undefined) {
            return document.querySelector(a);
        }
        var root = (a && typeof a.querySelector === "function") ? a : document;
        return root.querySelector(b);
    }
    function $$(a, b){
        // $$(selector)  -> Array(document.querySelectorAll(selector))
        // $$(root, sel) -> Array(root.querySelectorAll(sel))
        var root, sel;
        if (b === undefined) {
            root = document; sel = a;
        } else {
            root = (a && typeof a.querySelectorAll === "function") ? a : document;
            sel = b;
        }
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

    // --- 1) SELF-HEAL: Menü-Struktur sicherstellen --------------------------
    function ensureMenuStructure(){
        // Finde das Hauptmenü
        var menu = $(".c-menu") || $("nav[aria-label='Hauptnavigation']") || $(".js-menu");
        if (!menu) return null;

        // Root-Attribut
        menu.classList.add("js-menu");
        if (!menu.hasAttribute("data-menu-root")) menu.setAttribute("data-menu-root", "");

        // Wrapper sicherstellen
        var wrapper = $(menu, "[data-menu-wrapper], .c-menu__wrapper");
        if (!wrapper) {
            // Finde die Liste
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
            // Wrapper-Attribute harmonisieren
            wrapper.classList.add("c-menu__wrapper");
            wrapper.setAttribute("data-menu-wrapper", "");
            if (!wrapper.id) wrapper.id = "primary-menu-wrapper";
        }

        // Toggle sicherstellen
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

        // Submenu-Parents kennzeichnen
        $$(menu, ".c-menu__item").forEach(function (item, idx){
            var parentLink = $(item, ".js-menu-parent,[data-menu-parent], .c-menu__link[aria-haspopup='true']");
            var sub = $(item, ".c-menu__submenu");
            if (sub && parentLink) {
                parentLink.classList.add("js-menu-parent");
                parentLink.setAttribute("data-menu-parent", "");
                parentLink.setAttribute("aria-haspopup", "true");
                if (!sub.id) sub.id = "submenu-auto-" + idx;
                parentLink.setAttribute("aria-controls", sub.id);
                parentLink.setAttribute("aria-expanded", "false");
            }
        });

        return { menu: menu, wrapper: wrapper, toggle: toggle };
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

        // Toggle clicks (capture-Phase)
        document.addEventListener("click", function(e){
            var toggle = e.target.closest("[data-menu-toggle], .c-menu__toggle");
            if (!toggle) return;

            var menuRoot = toggle.closest("[data-menu-root], .js-menu") || document;
            var wrapper  = $(menuRoot, "[data-menu-wrapper], .c-menu__wrapper");

            // Safety gegen vererbtes pointer-events:none
            toggle.style.pointerEvents = "auto";

            if (wrapper){
                e.preventDefault();
                var open = !wrapper.classList.contains("is-open");
                wrapper.classList.toggle("is-open", open);
                menuRoot.classList.toggle("is-open", open);
                toggle.classList.toggle("is-active", open);
                toggle.setAttribute("aria-expanded", String(open));
            }
        }, { capture: true, passive: false });

        // Submenu mobile
        document.addEventListener("click", function(e){
            var parent = e.target.closest(".js-menu-parent,[data-menu-parent]");
            if (!parent) return;
            if (mqDesktop.matches) return; // Desktop per CSS

            var controls = parent.getAttribute("aria-controls");
            if (!controls) return;
            var submenu = document.getElementById(controls);
            var item = parent.closest(".c-menu__item");
            if (!submenu || !item) return;

            e.preventDefault();
            var isOpen = item.classList.toggle("is-open");
            parent.setAttribute("aria-expanded", String(isOpen));
            submenu.style.display = isOpen ? "flex" : "none";
        });

        // Cleanup auf Desktop
        function cleanup(){
            if (!mqDesktop.matches) return;
            $$(document, "[data-menu-root], .js-menu").forEach(function(menuRoot){
                var wrapper = $(menuRoot, "[data-menu-wrapper], .c-menu__wrapper");
                var toggle  = $(menuRoot, "[data-menu-toggle], .c-menu__toggle");
                if (wrapper) wrapper.classList.remove("is-open");
                if (toggle) { toggle.classList.remove("is-active"); toggle.setAttribute("aria-expanded", "false"); }
                $$(menuRoot, ".c-menu__item.is-open").forEach(function (it){ it.classList.remove("is-open"); });
                $$(menuRoot, ".c-menu__submenu").forEach(function (sm){ sm.style.display = ""; });
            });
        }
        cleanup();
        if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", cleanup);
        else mqDesktop.addListener(cleanup);
        window.addEventListener("resize", throttle(cleanup, 100));
    }

    // --- Boot ---------------------------------------------------------------
    function boot(){
        ensureMenuStructure();   // idempotent – ergänzt fehlende Teile
        initStickyHeader();
        initMenuDelegated();
        console.log("JD ready:", window.JD._version);
    }
    ready(boot);
})();
