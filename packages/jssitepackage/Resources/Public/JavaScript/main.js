/** =========================================================================
 *  main.js – Sitewide JS (Menu + Sticky Header)
 *  - BEM: .c-menu, .c-menu__toggle, .c-menu__wrapper, .c-menu__item, ...
 *  - ARIA: aria-expanded / aria-controls / aria-current
 *  - Sticky: toggelt .is-sticky auf dem Header (.c-header)
 * ========================================================================= */

(function () {
    "use strict";

    // -------------------------------
    // Helpers
    // -------------------------------
    var mqDesktop = window.matchMedia("(min-width: 768px)");

    function $ (root, sel)  { return (root || document).querySelector(sel); }
    function $$ (root, sel) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function throttle (fn, wait) {
        var last = 0, timer = null;
        return function () {
            var now = Date.now();
            if (now - last >= wait) {
                last = now; fn.apply(this, arguments);
            } else {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    last = Date.now(); fn.apply(this, arguments);
                }, wait - (now - last));
            }
        };
    }

    // -------------------------------
    // Sticky Header (.c-header.is-sticky)
    // -------------------------------
    function initStickyHeader () {
        var header = $(".c-header");
        if (!header) return;

        var onScroll = throttle(function () {
            var scrolled = window.scrollY > 4;
            header.classList.toggle("is-sticky", scrolled);
        }, 50);

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    // -------------------------------
    // Menu: ARIA + Mobile Toggle + Submenus
    // -------------------------------
    function initMenu () {
        var menus = $$(document, ".js-menu");
        if (!menus.length) return;

        menus.forEach(function (menu) {
            var toggle  = $(menu, ".js-menu-toggle");
            var wrapper = $(menu, ".c-menu__wrapper");

            // Hauptmenü toggeln (mobil)
            if (toggle && wrapper) {
                toggle.addEventListener("click", function () {
                    var open = wrapper.classList.toggle("is-open");
                    menu.classList.toggle("is-open", open);
                    toggle.classList.toggle("is-active", open);
                    toggle.setAttribute("aria-expanded", String(open));
                });
            }

            // Submenüs mobil via Tap/Klick auf den Elternlink
            menu.addEventListener("click", function (e) {
                var parentLink = e.target.closest(".js-menu-parent");
                if (!parentLink || !menu.contains(parentLink)) return;

                var hasPopup = parentLink.getAttribute("aria-haspopup") === "true";
                var controls = parentLink.getAttribute("aria-controls");
                if (!hasPopup || !controls) return;

                // Desktop: CSS :hover regelt Dropdown – kein JS
                if (mqDesktop.matches) return;

                e.preventDefault();

                var submenu = document.getElementById(controls);
                var item    = parentLink.closest(".c-menu__item");
                if (!submenu || !item) return;

                var isOpen = item.classList.toggle("is-open");
                parentLink.setAttribute("aria-expanded", String(isOpen));
                // Inline-Style nur mobil, Desktop räumt Resize-Handler auf
                submenu.style.display = isOpen ? "flex" : "none";
            });

            // Progressive Enhancement: Aufräumen beim Wechsel auf Desktop
            var onResize = function () {
                if (mqDesktop.matches) {
                    if (wrapper) {
                        wrapper.classList.remove("is-open");
                    }
                    if (toggle) {
                        toggle.classList.remove("is-active");
                        toggle.setAttribute("aria-expanded", "false");
                    }
                    $$(menu, ".c-menu__item.is-open").forEach(function (it) {
                        it.classList.remove("is-open");
                    });
                    $$(menu, '.c-menu__link[aria-expanded="true"]').forEach(function (lnk) {
                        lnk.setAttribute("aria-expanded", "false");
                    });
                    $$(menu, ".c-menu__submenu").forEach(function (sm) {
                        sm.style.display = "";
                    });
                }
            };

            // Initial + Listener
            onResize();
            window.addEventListener("resize", throttle(onResize, 100));
        });
    }

    // -------------------------------
    // Boot
    // -------------------------------
    function boot () {
        initStickyHeader();
        initMenu();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

    // Export für potenzielles Re-Init (AJAX/HTMX/etc.)
    window.JD = window.JD || {};
    window.JD.menuInit = initMenu;
    window.JD.stickyInit = initStickyHeader;

})();
