(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const heroVideo = document.querySelector(".hero-video");
  const lazyVideos = [...document.querySelectorAll(".lazy-video")];
  const pageVideos = [heroVideo, ...lazyVideos].filter(Boolean);
  const heroAutoplayEnabled = Boolean(heroVideo && !prefersReducedMotion && !saveData);
  const lazyVideoUi = new Map();
  let heroIsVisible = false;

  const resetLazyVideo = (video) => {
    const ui = lazyVideoUi.get(video);
    if (!ui) return;

    ui.frame.classList.remove("is-loading", "is-ready");
    ui.frame.removeAttribute("aria-busy");
    video.controls = false;
    ui.playButton.hidden = false;
    ui.playButton.disabled = false;
    ui.playIcon.className = "fa-solid fa-circle-play";
  };

  const cancelUnfinishedLoad = (video) => {
    video.pause();
    video.dataset.unloaded = "true";
    video.removeAttribute("src");
    video.querySelectorAll("source[src]").forEach((source) => {
      if (!source.dataset.src) source.dataset.src = source.getAttribute("src");
      source.removeAttribute("src");
    });
    if (video.classList.contains("lazy-video")) delete video.dataset.hydrated;
    video.load();
    if (video.classList.contains("lazy-video")) resetLazyVideo(video);
  };

  const pauseOtherVideos = (activeVideo) => {
    pageVideos.forEach((video) => {
      if (video === activeVideo) return;

      const hasUnfinishedLoad = video.networkState === HTMLMediaElement.NETWORK_LOADING;
      video.pause();
      if (hasUnfinishedLoad) cancelUnfinishedLoad(video);
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

    if (heroVideo.dataset.unloaded === "true") {
      heroVideo.querySelectorAll("source[data-src]").forEach((source) => {
        source.src = source.dataset.src;
      });
      delete heroVideo.dataset.unloaded;
      heroVideo.load();
    }

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
    });

    delete video.dataset.unloaded;
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
    lazyVideoUi.set(video, { frame, playButton, playIcon });
    video.controls = false;
    video.setAttribute("loading", "lazy");
    frame.append(playButton);

    video.addEventListener("loadeddata", () => {
      frame.classList.add("is-ready");
      frame.classList.remove("is-missing");
    });

    video.addEventListener("error", () => {
      if (video.dataset.unloaded === "true") return;
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
    if (document.hidden) pauseOtherVideos(null);
    else playHero();
  });
})();
