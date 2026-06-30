/**
 * ============================================================
 * Gelinlik Boutique - Public Site JavaScript
 * ============================================================
 */

(function () {
    'use strict';

    /* ----------------------------------------------------------
     * PRELOADER
     * ---------------------------------------------------------- */
    const preloader = document.getElementById('preloader');

    function hidePreloader() {
        if (!preloader) return;
        preloader.classList.add('preloader--hidden');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 600);
    }

    window.addEventListener('load', hidePreloader);
    // Fallback – hide after 3 seconds regardless
    setTimeout(hidePreloader, 3000);

    /* ----------------------------------------------------------
     * NAVBAR SCROLL EFFECT
     * ---------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    const SCROLL_THRESHOLD = 80;

    function handleNavbarScroll() {
        if (!navbar) return;
        if (window.scrollY > SCROLL_THRESHOLD) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    /* ----------------------------------------------------------
     * ACTIVE NAV LINK ON SCROLL
     * ---------------------------------------------------------- */
    const navLinks = document.querySelectorAll('.navbar__link');
    const sections = document.querySelectorAll('section[id]');

    function setActiveNav() {
        const scrollY = window.scrollY + 120;
        sections.forEach((section) => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach((link) => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', setActiveNav, { passive: true });

    /* ----------------------------------------------------------
     * MOBILE NAV TOGGLE
     * ---------------------------------------------------------- */
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });

        // Close menu when a link is clicked
        navMenu.querySelectorAll('.navbar__link').forEach((link) => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('nav-open');
            });
        });
    }

    /* ----------------------------------------------------------
     * SMOOTH SCROLL FOR ANCHOR LINKS
     * ---------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth',
                });
            }
        });
    });

    /* ----------------------------------------------------------
     * INTERSECTION OBSERVER – SCROLL ANIMATIONS
     * ---------------------------------------------------------- */
    const animatedElements = document.querySelectorAll('[data-animate]');

    if ('IntersectionObserver' in window) {
        const animateObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
                        setTimeout(() => {
                            el.classList.add('animated');
                        }, delay);
                        animateObserver.unobserve(el);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        animatedElements.forEach((el) => animateObserver.observe(el));
    } else {
        // Fallback: show everything immediately
        animatedElements.forEach((el) => el.classList.add('animated'));
    }

    /* ----------------------------------------------------------
     * COUNTER ANIMATION (Hero Stats)
     * ---------------------------------------------------------- */
    const counters = document.querySelectorAll('[data-count]');

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;

        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            el.textContent = current + (target >= 100 ? '+' : '');

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + '+';
            }
        }

        requestAnimationFrame(update);
    }

    if ('IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach((c) => counterObserver.observe(c));
    } else {
        counters.forEach(animateCounter);
    }

    /* ----------------------------------------------------------
     * COLLECTION FILTER
     * ---------------------------------------------------------- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const dressCards = document.querySelectorAll('.dress-card');

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            dressCards.forEach((card, i) => {
                const category = card.getAttribute('data-category');
                const shouldShow = filter === 'all' || category === filter;

                // Remove animation class first
                card.classList.remove('fadeInUp');
                card.style.display = 'none';

                if (shouldShow) {
                    setTimeout(() => {
                        card.style.display = '';
                        // Trigger reflow
                        void card.offsetWidth;
                        card.classList.add('fadeInUp');
                    }, i * 60);
                }
            });
        });
    });

    /* ----------------------------------------------------------
     * TESTIMONIALS SLIDER
     * ---------------------------------------------------------- */
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonials__dot');
    let currentTestimonial = 0;
    let testimonialInterval = null;

    function showTestimonial(index) {
        if (testimonialCards.length === 0) return;

        testimonialCards.forEach((card) => card.classList.remove('active'));
        dots.forEach((dot) => dot.classList.remove('active'));

        currentTestimonial = index;
        if (currentTestimonial >= testimonialCards.length) currentTestimonial = 0;
        if (currentTestimonial < 0) currentTestimonial = testimonialCards.length - 1;

        testimonialCards[currentTestimonial].classList.add('active');
        if (dots[currentTestimonial]) {
            dots[currentTestimonial].classList.add('active');
        }
    }

    function startTestimonialAutoplay() {
        testimonialInterval = setInterval(() => {
            showTestimonial(currentTestimonial + 1);
        }, 5000);
    }

    function resetTestimonialAutoplay() {
        clearInterval(testimonialInterval);
        startTestimonialAutoplay();
    }

    // Dot click
    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'), 10);
            showTestimonial(index);
            resetTestimonialAutoplay();
        });
    });

    if (testimonialCards.length > 0) {
        startTestimonialAutoplay();
    }

    /* ----------------------------------------------------------
     * APPOINTMENT FORM SUBMISSION
     * ---------------------------------------------------------- */
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentBtn = document.getElementById('appointmentBtn');

    if (appointmentForm && appointmentBtn) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalText = appointmentBtn.innerHTML;
            appointmentBtn.disabled = true;
            appointmentBtn.innerHTML =
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/></svg> Gönderiliyor...';

            const formData = {
                full_name: appointmentForm.fullName.value.trim(),
                email: appointmentForm.email.value.trim(),
                phone: appointmentForm.phone.value.trim(),
                wedding_date: appointmentForm.weddingDate.value || null,
                appointment_date: appointmentForm.appointmentDate.value,
                service: appointmentForm.service.value || null,
                message: appointmentForm.message.value.trim() || null,
            };

            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    appointmentBtn.innerHTML =
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Randevunuz Oluşturuldu!';
                    appointmentBtn.classList.add('btn--success');
                    appointmentForm.reset();

                    setTimeout(() => {
                        appointmentBtn.innerHTML = originalText;
                        appointmentBtn.classList.remove('btn--success');
                        appointmentBtn.disabled = false;
                    }, 4000);
                } else {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || 'Bir hata oluştu');
                }
            } catch (err) {
                appointmentBtn.innerHTML =
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ' +
                    (err.message || 'Hata oluştu!');
                appointmentBtn.classList.add('btn--error');

                setTimeout(() => {
                    appointmentBtn.innerHTML = originalText;
                    appointmentBtn.classList.remove('btn--error');
                    appointmentBtn.disabled = false;
                }, 4000);
            }
        });
    }

    /* ----------------------------------------------------------
     * PARALLAX EFFECT ON HERO
     * ---------------------------------------------------------- */
    const heroBg = document.querySelector('.hero__bg');

    function handleParallax() {
        if (!heroBg) return;
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero')?.offsetHeight || 800;
        if (scrollY < heroHeight) {
            heroBg.style.transform = 'scale(1.1) translateY(' + scrollY * 0.3 + 'px)';
        }
    }

    window.addEventListener('scroll', handleParallax, { passive: true });

    /* ----------------------------------------------------------
     * LAZY IMAGE LOADING ENHANCEMENT
     * ---------------------------------------------------------- */
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    lazyImages.forEach((img) => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
            img.addEventListener('error', () => {
                img.style.opacity = '1';
            });
        }
    });
    /* ----------------------------------------------------------
     * REVIEW FORM SUBMISSION
     * ---------------------------------------------------------- */
    const reviewForm = document.getElementById('reviewForm');
    const reviewBtn = document.getElementById('reviewBtn');
    const reviewAlert = document.getElementById('reviewAlertMessage');

    if (reviewForm && reviewBtn) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalText = reviewBtn.innerHTML;
            reviewBtn.disabled = true;
            reviewBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/></svg> Gönderiliyor...';
            
            if (reviewAlert) {
                reviewAlert.style.display = 'none';
                reviewAlert.className = 'alert mb-md';
            }

            const formData = {
                name: document.getElementById('reviewName').value.trim(),
                rating: document.querySelector('input[name="rating"]:checked') ? document.querySelector('input[name="rating"]:checked').value : '5',
                text: document.getElementById('reviewText').value.trim(),
            };

            try {
                const response = await fetch('/api/testimonials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok && data.success) {
                    if (reviewAlert) {
                        reviewAlert.textContent = data.message || 'Yorumunuz başarıyla gönderildi.';
                        reviewAlert.classList.add('alert-success');
                        reviewAlert.style.display = 'block';
                    }
                    reviewForm.reset();
                    
                    setTimeout(() => {
                        if (typeof closeReviewModal === 'function') {
                            closeReviewModal();
                        }
                        if (reviewAlert) reviewAlert.style.display = 'none';
                    }, 4000);
                } else {
                    throw new Error(data.message || 'Bir hata oluştu');
                }
            } catch (err) {
                if (reviewAlert) {
                    reviewAlert.textContent = err.message || 'Hata oluştu!';
                    reviewAlert.classList.add('alert-error');
                    reviewAlert.style.display = 'block';
                }
            } finally {
                reviewBtn.innerHTML = originalText;
                reviewBtn.disabled = false;
            }
        });
    }

})();
