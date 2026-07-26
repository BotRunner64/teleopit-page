# Video assets

The current page uses these files:

| File | Purpose | Loading |
| --- | --- | --- |
| `assets/videos/hero-overview.mp4` | Full-screen landing video, encoded at 4× speed | Eager, muted, looping |
| `assets/videos/motion-forward.mp4` | Forward walking tracking | Lazy |
| `assets/videos/motion-lateral.mp4` | Lateral walking tracking | Lazy |
| `assets/videos/motion-balance.mp4` | Single-leg balance tracking | Lazy |
| `assets/videos/motion-squat-stand.mp4` | Squat, sit, and stand tracking | Lazy |
| `assets/videos/motion-kneel.mp4` | Double-knee kneeling tracking | Lazy |
| `assets/videos/motion-turning.mp4` | Turning in place tracking | Lazy |
| `assets/videos/dexterous-hands.mp4` | Parallel dexterous hand tracking | Lazy |
| `assets/videos/latency-active-vision.mp4` | Active vision latency test | Lazy |
| `assets/videos/latency-whole-body.mp4` | Whole-body control latency test | Lazy |
| `assets/videos/latency-hand-retargeting.mp4` | Hand retargeting latency test | Lazy |
| `assets/videos/latency-video-streaming.mp4` | Video streaming latency test | Lazy |
| `assets/videos/loco-mani-01.mp4` | Mobile pick-and-place | Lazy |
| `assets/videos/loco-mani-02.mp4` | Bag transport | Lazy |
| `assets/videos/loco-mani-03.mp4` | Door opening | Lazy |
| `assets/videos/loco-mani-04.mp4` | Shelf retrieval | Lazy |

All published videos are silent H.264 MP4 files with `yuv420p` pixel format and the MP4 index moved to the start of the file (`faststart`). The latency tests and long loco-manipulation clips are 720p web derivatives. Original footage remains in the ignored `teleopit_demo/` directory.

The demo videos use generated JPG posters in `assets/images/`. Change the filenames or captions in `index.html` if a different organization is more convenient.
