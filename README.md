# TeleopIt Project Page

A lightweight, SONIC-style academic project page. It is plain HTML, CSS, and JavaScript, so there is no build step and no backend.

## Preview locally

Run a static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly also works for most of the page, but a local server is more representative of production and avoids browser restrictions around media.

## Replace the placeholders

1. Edit the project links, section titles, and video labels in `index.html`.
2. Add the project PDF as `assets/paper.pdf`, or change every paper link.
3. Replace the placeholder images in `assets/images/`.
4. Video paths currently used by the page are documented in `assets/videos/README.md`.
5. Replace `og:image` with a 1200×630 JPG or PNG before publishing; SVG support varies across social platforms.
6. Search for `your-org` and `your-project` to find the remaining placeholder links.

## Media recommendations

- Use a short, silent 16:9 MP4 for the hero; its poster paints first and playback starts after initial page load.
- Export MP4 with H.264 and `yuv420p` for broad compatibility.
- Keep posters small and compressed; non-hero posters are hydrated only near the viewport.
- Non-hero videos load only after the visitor presses play; starting one pauses every other video and cancels unfinished prior downloads.
- The included published videos are silent, use `faststart`, and are stored in `assets/videos/`.
- Original footage under `teleopit_demo/` is ignored by Git and is not required by the deployed page.

Example MP4 conversion:

```bash
ffmpeg -i input.mov -map 0:v:0 -vf "scale=-2:720" -an \
  -c:v libx264 -crf 28 -preset medium -pix_fmt yuv420p \
  -g 60 -keyint_min 60 -sc_threshold 0 -movflags +faststart \
  assets/videos/demo-01.mp4
```

## Deploy

The repository can be deployed directly with GitHub Pages. Publish the repository root as-is; every runtime asset is self-contained under `assets/`.
