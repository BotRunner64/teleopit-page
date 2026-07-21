(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

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
})();
