/**
 * main.js
 * --------------------------------------------
 * Steuerung für Header, Navigation und Sticky-Verhalten
 * (im Stil von arburg.com)
 * --------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Sticky Header mit IntersectionObserver
     * --------------------------------------------
     * Fügt .is-sticky hinzu, sobald der Header
     * den oberen Viewportrand erreicht.
     */
    const header = document.querySelector('.c-header');
    if (header) {
        const sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        header.before(sentinel);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    header.classList.add('is-sticky');
                } else {
                    header.classList.remove('is-sticky');
                }
            },
            { threshold: [1] }
        );
        observer.observe(sentinel);
    }

    /**
     * Mobile Menü Toggle
     * --------------------------------------------
     * Öffnet/Schließt das mobile Menü
     * und animiert das Burger-Icon.
     */
    const menuToggle = document.querySelector('.c-menu__toggle');
    const menuWrapper = document.querySelector('.c-menu__wrapper');

    if (menuToggle && menuWrapper) {
        menuToggle.addEventListener('click', () => {
            const isOpen = menuWrapper.classList.toggle('is-open');
            menuToggle.classList.toggle('is-active', isOpen);
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    /**
     * Mobile Submenu Toggle
     * --------------------------------------------
     * Öffnet/Schließt Untermenüs auf Touch-Geräten
     * (nur aktiv unter 992px).
     */
    const submenuLinks = document.querySelectorAll('.has-submenu > a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const parent = link.parentElement;
            if (window.innerWidth < 992) {
                e.preventDefault();
                parent.classList.toggle('is-open');
            }
        });
    });

    /**
     * Automatisches Schließen des Menüs bei Resize
     * --------------------------------------------
     * Verhindert, dass das mobile Menü beim Wechsel
     * in die Desktop-Ansicht offen bleibt.
     */
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992 && menuWrapper) {
            menuWrapper.classList.remove('is-open');
            menuToggle?.classList.remove('is-active');
            menuToggle?.setAttribute('aria-expanded', 'false');
        }
    });
});
