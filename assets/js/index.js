(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const heroVideo = document.querySelector(".hero-video");
  const lazyVideos = [...document.querySelectorAll(".lazy-video")];
  const pageVideos = [heroVideo, ...lazyVideos].filter(Boolean);
  const heroAutoplayEnabled = Boolean(heroVideo && !prefersReducedMotion && !saveData);
  let heroIsVisible = false;

  const pauseOtherVideos = (activeVideo) => {
    pageVideos.forEach((video) => {
      if (video !== activeVideo) video.pause();
    });
  };

  pageVideos.forEach((video) => {
    video.addEventListener("play", () => pauseOtherVideos(video));
  });

  if (heroVideo && (prefersReducedMotion || saveData)) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  const playHero = () => {
    if (!heroAutoplayEnabled || !heroIsVisible || document.hidden) return;
    pauseOtherVideos(heroVideo);
    const playRequest = heroVideo.play();
    if (playRequest) playRequest.catch(() => {});
  };

  if (heroVideo && "IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroIsVisible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
        if (heroIsVisible) playHero();
        else heroVideo.pause();
      },
      { threshold: [0, 0.55] },
    );

    heroObserver.observe(heroVideo);
  }

  const hydrateVideo = (video) => {
    if (video.dataset.hydrated === "true") return;

    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });

    video.dataset.hydrated = "true";
    video.load();
  };

  const createPlayButton = (video) => {
    const button = document.createElement("button");
    const icon = document.createElement("i");
    const videoLabel = video.getAttribute("aria-label") || "video";

    button.type = "button";
    button.className = "video-play-button";
    button.setAttribute("aria-label", `Play ${videoLabel}`);
    icon.className = "fa-solid fa-circle-play";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    return { button, icon };
  };

  lazyVideos.forEach((video) => {
    const frame = video.closest(".video-frame");
    if (!frame) return;

    const { button: playButton, icon: playIcon } = createPlayButton(video);
    video.controls = false;
    video.setAttribute("loading", "lazy");
    frame.append(playButton);

    video.addEventListener("loadeddata", () => {
      frame.classList.add("is-ready");
      frame.classList.remove("is-missing");
    });

    video.addEventListener("error", () => {
      frame.classList.add("is-missing");
      frame.classList.remove("is-loading");
      frame.removeAttribute("aria-busy");
      video.controls = false;
      playButton.hidden = false;
      playButton.disabled = false;
      playIcon.className = "fa-solid fa-circle-play";
    });

    playButton.addEventListener("click", async () => {
      playButton.disabled = true;
      playIcon.className = "fa-solid fa-spinner fa-spin";
      frame.classList.add("is-loading");
      frame.setAttribute("aria-busy", "true");
      pauseOtherVideos(video);
      hydrateVideo(video);
      video.controls = true;

      try {
        await video.play();
        playButton.hidden = true;
      } catch {
        video.controls = false;
        playButton.hidden = false;
        playButton.disabled = false;
        playIcon.className = "fa-solid fa-circle-play";
      } finally {
        frame.classList.remove("is-loading");
        frame.removeAttribute("aria-busy");
      }
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pageVideos.forEach((video) => video.pause());
    else playHero();
  });
})();
