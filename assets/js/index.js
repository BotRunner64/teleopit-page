(() => {
  "use strict";

  const heroVideo = document.querySelector(".hero-video");
  const heroVideoToggle = document.querySelector(".hero-video-toggle");
  const heroVideoToggleIcon = heroVideoToggle?.querySelector(".hero-video-toggle__icon");
  const heroVideoToggleLabel = heroVideoToggle?.querySelector(".hero-video-toggle__label");
  const lazyVideos = [...document.querySelectorAll(".lazy-video")];
  const pageVideos = [heroVideo, ...lazyVideos].filter(Boolean);
  const lazyVideoUi = new Map();
  let heroIsVisible = true;
  let heroPlaybackRequested = false;
  let heroPlayPending = false;

  const setHeroToggleState = (state) => {
    if (!heroVideoToggle || !heroVideoToggleIcon || !heroVideoToggleLabel) return;

    const states = {
      idle: {
        ariaLabel: "Play background video",
        icon: "\u25b6",
        label: "Play background",
        disabled: false,
      },
      loading: {
        ariaLabel: "Loading background video",
        icon: "\u2026",
        label: "Loading video",
        disabled: true,
      },
      playing: {
        ariaLabel: "Pause background video",
        icon: "\u2016",
        label: "Pause background",
        disabled: false,
      },
    };
    const nextState = states[state] || states.idle;

    heroVideoToggle.dataset.state = state;
    heroVideoToggle.setAttribute("aria-label", nextState.ariaLabel);
    heroVideoToggle.disabled = nextState.disabled;
    heroVideoToggleIcon.textContent = nextState.icon;
    heroVideoToggleLabel.textContent = nextState.label;
  };

  const hydratePoster = (video) => {
    if (!video.dataset.poster) return;
    video.poster = video.dataset.poster;
    delete video.dataset.poster;
  };

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
    delete video.dataset.hydrated;
    video.load();
    if (video.classList.contains("lazy-video")) resetLazyVideo(video);
  };

  const pauseOtherVideos = (activeVideo) => {
    if (activeVideo?.classList.contains("lazy-video")) {
      heroPlaybackRequested = false;
      setHeroToggleState("idle");
    }

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

  const hydrateVideo = (video) => {
    if (video.dataset.hydrated === "true") return;

    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
    });

    delete video.dataset.unloaded;
    video.dataset.hydrated = "true";
    video.load();
  };

  const playHero = async () => {
    if (!heroVideo || !heroPlaybackRequested || !heroIsVisible || document.hidden || heroPlayPending) return;

    pauseOtherVideos(heroVideo);
    hydrateVideo(heroVideo);
    heroPlayPending = true;
    setHeroToggleState("loading");

    try {
      await heroVideo.play();
      if (heroPlaybackRequested) setHeroToggleState("playing");
    } catch {
      if (heroPlaybackRequested) {
        heroPlaybackRequested = false;
        setHeroToggleState("idle");
      }
    } finally {
      heroPlayPending = false;
    }
  };

  if (heroVideo && heroVideoToggle) {
    setHeroToggleState("idle");

    heroVideoToggle.addEventListener("click", () => {
      if (heroPlaybackRequested) {
        heroPlaybackRequested = false;
        heroVideo.pause();
        setHeroToggleState("idle");
        return;
      }

      heroPlaybackRequested = true;
      playHero();
    });

    heroVideo.addEventListener("waiting", () => {
      if (heroPlaybackRequested) setHeroToggleState("loading");
    });

    heroVideo.addEventListener("playing", () => {
      if (heroPlaybackRequested) setHeroToggleState("playing");
    });

    heroVideo.addEventListener("error", () => {
      if (heroVideo.dataset.unloaded === "true") return;
      heroPlaybackRequested = false;
      setHeroToggleState("idle");
    });
  }

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

  const posterObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            hydratePoster(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "300px 0px" },
      )
    : null;

  lazyVideos.forEach((video) => {
    const frame = video.closest(".video-frame");
    if (!frame) return;

    const { button: playButton, icon: playIcon } = createPlayButton(video);
    lazyVideoUi.set(video, { frame, playButton, playIcon });
    video.controls = false;
    frame.append(playButton);

    if (posterObserver) posterObserver.observe(video);
    else hydratePoster(video);

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
      hydratePoster(video);
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
