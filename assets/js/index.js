(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  const closeNavigation = () => {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(willOpen));
      navLinks.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("nav-open", willOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeNavigation();
    });
  }

  const heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    if (prefersReducedMotion || saveData) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    }
  }

  const lazyVideos = [...document.querySelectorAll(".lazy-video")];

  const hydrateVideo = (video) => {
    if (video.dataset.hydrated === "true") return;

    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });

    video.dataset.hydrated = "true";
    video.load();
  };

  lazyVideos.forEach((video) => {
    const frame = video.closest(".video-frame");

    video.addEventListener("loadeddata", () => {
      frame?.classList.add("is-ready");
      frame?.classList.remove("is-missing");
    });

    video.addEventListener("error", () => {
      frame?.classList.add("is-missing");
    });
  });

  if ("IntersectionObserver" in window) {
    const loadObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          hydrateVideo(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "420px 0px" },
    );

    const playbackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.55 && !prefersReducedMotion && !saveData) {
            hydrateVideo(video);
            const playRequest = video.play();
            if (playRequest) playRequest.catch(() => {});
          } else if (!video.paused) {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.55, 1] },
    );

    lazyVideos.forEach((video) => {
      loadObserver.observe(video);
      playbackObserver.observe(video);
    });
  } else {
    lazyVideos.forEach(hydrateVideo);
  }

  const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const observedSections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && observedSections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        sectionLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
      },
      { rootMargin: "-22% 0px -62%", threshold: [0.01, 0.2] },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const copyButton = document.querySelector("[data-copy-bibtex]");
  const bibtexCode = document.querySelector("#bibtex-code");

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  };

  if (copyButton && bibtexCode) {
    copyButton.addEventListener("click", async () => {
      const label = copyButton.querySelector("[data-copy-label]");
      const citation = bibtexCode.textContent.trim();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(citation);
        } else if (!fallbackCopy(citation)) {
          throw new Error("Copy command failed");
        }

        copyButton.classList.add("is-copied");
        if (label) label.textContent = "Copied";

        window.setTimeout(() => {
          copyButton.classList.remove("is-copied");
          if (label) label.textContent = "Copy";
        }, 1800);
      } catch {
        if (label) label.textContent = "Select text";
      }
    });
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
