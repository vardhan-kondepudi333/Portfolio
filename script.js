(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const qs = (selector, scope = doc) => scope.querySelector(selector);
  const qsa = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const throttle = (callback, wait = 100) => {
    let waiting = false;
    let lastArgs;

    return (...args) => {
      lastArgs = args;
      if (waiting) return;

      waiting = true;
      window.requestAnimationFrame(() => {
        callback(...lastArgs);
        window.setTimeout(() => {
          waiting = false;
        }, wait);
      });
    };
  };

  const debounce = (callback, wait = 160) => {
    let timeoutId;

    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => callback(...args), wait);
    };
  };

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const app = {
    init() {
      this.cache();
      this.initAOS();
      this.initLoader();
      this.initTheme();
      this.initNavigation();
      this.initSmoothScroll();
      this.initScrollProgress();
      this.initTyping();
      this.initCounters();
      this.initSkillBars();
      this.initMouseSpotlight();
      this.initMagneticLinks();
      this.initTiltCards();
      this.initProjectFiltering();
      this.initProjectSpotlight();
      this.initCopyButtons();
      this.initBackToTop();
      this.initImageModal();
      this.initParticles();
      this.initParallax();
      this.initLazyImages();
      this.initFooterYear();
      this.initKeyboardSafety();
    },

    cache() {
      this.header = qs("#siteHeader");
      this.navToggle = qs("#navToggle");
      this.navMenu = qs("#navMenu");
      this.navLinks = qsa(".nav-link");
      this.sections = qsa("main section[id]");
      this.scrollProgress = qs("#scrollProgress");
      this.backToTop = qs("#backToTop");
      this.themeToggle = qs("#themeToggle");
      this.typingText = qs("#typingText");
      this.cursorGlow = qs("#cursorGlow");
      this.particleCanvas = qs("#particleCanvas");
      this.toast = qs("#toast");
    },

    initAOS() {
      if (!window.AOS) return;

      window.AOS.init({
        duration: prefersReducedMotion.matches ? 0 : 850,
        easing: "ease-out-cubic",
        once: true,
        mirror: false,
        offset: 80,
        disable: () => prefersReducedMotion.matches,
      });
    },

    initLoader() {
      const loader = qs("#loader");
      if (!loader) return;

      const hideLoader = () => {
        loader.classList.add("is-hidden");
        window.setTimeout(() => loader.remove(), 800);
      };

      window.setTimeout(hideLoader, 350);
    },

    initTheme() {
      if (!this.themeToggle) return;

      const storedTheme = window.localStorage.getItem("portfolio-theme");
      const initialTheme = storedTheme || "dark";
      root.dataset.theme = initialTheme;
      this.themeToggle.setAttribute("aria-pressed", String(initialTheme === "dark"));

      this.themeToggle.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = nextTheme;
        window.localStorage.setItem("portfolio-theme", nextTheme);
        this.themeToggle.setAttribute("aria-pressed", String(nextTheme === "dark"));
      });
    },

    initNavigation() {
      if (!this.navToggle || !this.navMenu) return;

      const closeMenu = () => {
        this.navToggle.classList.remove("is-open");
        this.navMenu.classList.remove("is-open");
        this.navToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("nav-open");
      };

      const openMenu = () => {
        this.navToggle.classList.add("is-open");
        this.navMenu.classList.add("is-open");
        this.navToggle.setAttribute("aria-expanded", "true");
        body.classList.add("nav-open");
      };

      this.navToggle.addEventListener("click", () => {
        const expanded = this.navToggle.getAttribute("aria-expanded") === "true";
        expanded ? closeMenu() : openMenu();
      });

      this.navLinks.forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      doc.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });

      let lastScrollY = window.scrollY;
      const updateHeader = throttle(() => {
        const currentY = window.scrollY;

        this.header?.classList.toggle("is-hidden", currentY > lastScrollY && currentY > 420);
        lastScrollY = currentY;
      }, 80);

      window.addEventListener("scroll", updateHeader, { passive: true });

      if (!this.sections.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;
            this.navLinks.forEach((link) => {
              const isActive = link.dataset.section === id;
              link.classList.toggle("active", isActive);
              if (isActive) {
                link.setAttribute("aria-current", "page");
              } else {
                link.removeAttribute("aria-current");
              }
            });
          });
        },
        {
          rootMargin: "-42% 0px -48% 0px",
          threshold: 0.01,
        }
      );

      this.sections.forEach((section) => observer.observe(section));
    },

    initSmoothScroll() {
      qsa('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
          const targetId = anchor.getAttribute("href");
          if (!targetId || targetId === "#") return;

          const target = qs(targetId);
          if (!target) return;

          event.preventDefault();
          target.scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            block: "start",
          });
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        });
      });
    },

    initScrollProgress() {
      if (!this.scrollProgress) return;

      const updateProgress = throttle(() => {
        const scrollable = doc.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
        this.scrollProgress.style.width = `${clamp(progress, 0, 100)}%`;
      }, 20);

      updateProgress();
      window.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", debounce(updateProgress, 150));
    },

    initTyping() {
      const target = this.typingText;
      if (!target) return;

      const phrases = (target.dataset.phrases || target.textContent)
        .split("|")
        .map((phrase) => phrase.trim())
        .filter(Boolean);

      if (prefersReducedMotion.matches || phrases.length <= 1) {
        target.textContent = phrases[0] || target.textContent;
        return;
      }

      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const type = () => {
        const phrase = phrases[phraseIndex];
        const visibleText = phrase.slice(0, charIndex);
        target.textContent = visibleText;

        if (!deleting && charIndex < phrase.length) {
          charIndex += 1;
          window.setTimeout(type, 58);
          return;
        }

        if (!deleting && charIndex === phrase.length) {
          deleting = true;
          window.setTimeout(type, 1350);
          return;
        }

        if (deleting && charIndex > 0) {
          charIndex -= 1;
          window.setTimeout(type, 32);
          return;
        }

        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(type, 180);
      };

      type();
    },

    initCounters() {
      const counters = qsa(".counter");
      if (!counters.length) return;

      const animateCounter = (counter) => {
        const target = Number(counter.dataset.count || 0);
        if (!Number.isFinite(target)) return;

        if (prefersReducedMotion.matches) {
          counter.textContent = String(target);
          return;
        }

        const duration = 1200;
        const start = performance.now();

        const tick = (now) => {
          const progress = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = String(Math.round(target * eased));

          if (progress < 1) {
            window.requestAnimationFrame(tick);
          }
        };

        window.requestAnimationFrame(tick);
      };

      const observer = new IntersectionObserver(
        (entries, instance) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            instance.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );

      counters.forEach((counter) => observer.observe(counter));
    },

    initSkillBars() {
      const bars = qsa(".skill-progress");
      if (!bars.length) return;

      const observer = new IntersectionObserver(
        (entries, instance) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const progress = clamp(Number(entry.target.dataset.progress || 0), 0, 100);
            const fill = qs("span", entry.target);
            if (fill) fill.style.width = `${progress}%`;

            instance.unobserve(entry.target);
          });
        },
        { threshold: 0.45 }
      );

      bars.forEach((bar) => observer.observe(bar));
    },

    initMouseSpotlight() {
      if (!this.cursorGlow || !supportsHover || prefersReducedMotion.matches) return;

      const moveGlow = throttle((event) => {
        this.cursorGlow.style.transform = `translate3d(${event.clientX - 210}px, ${event.clientY - 210}px, 0)`;
        this.cursorGlow.classList.add("is-visible");
      }, 8);

      window.addEventListener("pointermove", moveGlow, { passive: true });
      window.addEventListener("pointerleave", () => this.cursorGlow.classList.remove("is-visible"), { passive: true });
    },

    initMagneticLinks() {
      if (!supportsHover || prefersReducedMotion.matches) return;

      qsa(".magnetic-link").forEach((element) => {
        element.addEventListener("pointermove", (event) => {
          const rect = element.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          element.style.transform = `translate3d(${x * 0.16}px, ${y * 0.16}px, 0)`;
        });

        element.addEventListener("pointerleave", () => {
          element.style.transform = "";
        });
      });
    },

    initTiltCards() {
      if (!supportsHover || prefersReducedMotion.matches) return;

      qsa("[data-tilt]").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const rotateY = ((x / rect.width) - 0.5) * 8;
          const rotateX = ((y / rect.height) - 0.5) * -8;

          card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
        });

        card.addEventListener("pointerleave", () => {
          card.style.transform = "";
        });
      });
    },

    initProjectFiltering() {
      const buttons = qsa(".filter-btn");
      const cards = qsa(".project-card");
      if (!buttons.length || !cards.length) return;

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const filter = button.dataset.filter || "all";

          buttons.forEach((btn) => {
            const active = btn === button;
            btn.classList.toggle("active", active);
            btn.setAttribute("aria-pressed", String(active));
          });

          cards.forEach((card) => {
            const categories = card.dataset.category || "";
            const visible = filter === "all" || categories.includes(filter);

            if (visible) {
              card.classList.remove("is-hidden");
              card.removeAttribute("aria-hidden");
            } else {
              card.classList.add("is-hidden");
              card.setAttribute("aria-hidden", "true");
            }
          });

          if (window.AOS) window.AOS.refreshHard();
        });
      });
    },

    initProjectSpotlight() {
      if (!supportsHover) return;

      qsa(".project-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const image = qs(".project-image", card);
          if (!image) return;

          const rect = image.getBoundingClientRect();
          const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
          const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);

          image.style.setProperty("--mouse-x", `${x}%`);
          image.style.setProperty("--mouse-y", `${y}%`);
        });
      });
    },

    initCopyButtons() {
      qsa(".copy-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const value = button.dataset.copy;
          if (!value) return;

          try {
            await navigator.clipboard.writeText(value);
            this.showToast("Copied to clipboard");
          } catch {
            this.fallbackCopy(value);
          }
        });
      });
    },

    fallbackCopy(value) {
      const textarea = doc.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      doc.body.appendChild(textarea);
      textarea.select();

      try {
        doc.execCommand("copy");
        this.showToast("Copied to clipboard");
      } catch {
        this.showToast("Copy failed");
      } finally {
        textarea.remove();
      }
    },

    showToast(message) {
      if (!this.toast) return;

      this.toast.textContent = message;
      this.toast.classList.add("is-visible");

      window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toast.classList.remove("is-visible");
      }, 1800);
    },

    initBackToTop() {
      if (!this.backToTop) return;

      const update = throttle(() => {
        this.backToTop.classList.toggle("is-visible", window.scrollY > 720);
      }, 80);

      this.backToTop.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        });
      });

      update();
      window.addEventListener("scroll", update, { passive: true });
    },

    initImageModal() {
      const images = qsa(".project-image img, .certificate-preview img, .profile-frame img");
      if (!images.length) return;

      const modal = doc.createElement("div");
      modal.className = "image-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Image preview");
      modal.innerHTML = `
        <button class="image-modal__close" type="button" aria-label="Close image preview">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <img alt="">
      `;
      doc.body.appendChild(modal);

      const modalImage = qs("img", modal);
      const closeButton = qs(".image-modal__close", modal);
      let lastFocused = null;

      const close = () => {
        modal.classList.remove("is-visible");
        body.classList.remove("modal-open");
        lastFocused?.focus?.();
      };

      images.forEach((image) => {
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", `Preview ${image.alt || "image"}`);

        const open = () => {
          lastFocused = doc.activeElement;
          modalImage.src = image.currentSrc || image.src;
          modalImage.alt = image.alt || "Portfolio image preview";
          modal.classList.add("is-visible");
          body.classList.add("modal-open");
          closeButton?.focus();
        };

        image.addEventListener("click", open);
        image.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
      });

      closeButton?.addEventListener("click", close);
      modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
      });
      doc.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-visible")) close();
      });
    },

    initParticles() {
      const canvas = this.particleCanvas;
      if (!canvas || prefersReducedMotion.matches) return;

      const context = canvas.getContext("2d", { alpha: true });
      if (!context) return;

      let width = 0;
      let height = 0;
      let particles = [];
      let animationId = 0;

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        const count = clamp(Math.floor(width / 28), 28, 82);
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          radius: Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.45 + 0.16,
        }));
      };

      const draw = () => {
        context.clearRect(0, 0, width, height);

        particles.forEach((particle, index) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;

          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(56, 189, 248, ${particle.alpha})`;
          context.fill();

          for (let next = index + 1; next < particles.length; next += 1) {
            const other = particles[next];
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 130) {
              context.beginPath();
              context.moveTo(particle.x, particle.y);
              context.lineTo(other.x, other.y);
              context.strokeStyle = `rgba(56, 189, 248, ${(1 - distance / 130) * 0.16})`;
              context.lineWidth = 1;
              context.stroke();
            }
          }
        });

        animationId = window.requestAnimationFrame(draw);
      };

      resize();
      draw();

      window.addEventListener("resize", debounce(resize, 220));
      prefersReducedMotion.addEventListener?.("change", (event) => {
        if (event.matches) window.cancelAnimationFrame(animationId);
      });
    },

    initParallax() {
      if (prefersReducedMotion.matches) return;

      const shapes = qsa(".shape, .hero__mesh");
      if (!shapes.length) return;

      const update = throttle(() => {
        const y = window.scrollY;
        shapes.forEach((shape, index) => {
          const speed = index % 2 === 0 ? 0.035 : -0.025;
          shape.style.translate = `0 ${y * speed}px`;
        });
      }, 16);

      window.addEventListener("scroll", update, { passive: true });
    },

    initLazyImages() {
      qsa("img[loading='lazy']").forEach((image) => {
        image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
        image.addEventListener("error", () => image.classList.add("is-missing"), { once: true });
      });
    },

    initFooterYear() {
      const year = qs("#currentYear");
      if (year) year.textContent = String(new Date().getFullYear());
    },

    initKeyboardSafety() {
      doc.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        body.classList.add("using-keyboard");
      });

      doc.addEventListener("pointerdown", () => {
        body.classList.remove("using-keyboard");
      });
    },
  };

  doc.addEventListener("DOMContentLoaded", () => app.init());
})();
