# Where your image files go

All image files live in **`public/images/`**. Anything in `public/` is served
from the site root — e.g. `public/images/logo.png` becomes
`https://www.tampatower.org/images/logo.png`.

## Current images

| File | What it is | Used by |
|---|---|---|
| `logo.png` | The gold/navy Tampa Tower Academy crest. | Header brand mark, Apple touch icon, schema.org logo. |
| `logo-dark.png` | Crest for dark backgrounds. | Home-page hero, footer. |
| `og-banner.png` | 1200×1200 social-share banner. | Open Graph + Twitter card previews. |
| `step-up-logo.png` | Step Up For Students provider mark. | Home page, Programs page. |
| `biblela.jpg` | BiblEla curriculum cover shot. | Curriculum page showcase. |
| `classroom-reading.jpg` | Students reading the ELA Bible worktext. | Curriculum page, "Our curriculum" section. |

The site favicon is `public/favicon.svg` — the only SVG still in use.

## Adding a new image

1. Drop the file in `public/images/`. Prefer JPEG for photos, PNG for logos and
   anything needing transparency.
2. Resize before committing. The content column maxes out at `--wrap` (68rem,
   about 1048px), so roughly 1600px on the long edge covers retina displays with
   headroom. There is no build-time image pipeline — whatever you commit is
   exactly what visitors download.
3. Reference it with a plain `<img>` carrying explicit `width`/`height` (which
   prevents layout shift) and descriptive `alt` text. Add `loading="lazy"` for
   anything below the fold. Match the existing tags, e.g.:

   ```astro
   <img
     src="/images/example.jpg"
     alt="Describe what is actually in the picture"
     class="example-shot"
     width="1600"
     height="1600"
     loading="lazy"
     decoding="async"
   />
   ```

   Place it inside a `<div class="wrap">`; an element dropped straight into a
   `<section>` will run edge to edge.

To display a square source as a wide banner without cropping a second file, let
CSS do it — see `.classroom-shot` in `src/pages/curriculum.astro`, which uses
`aspect-ratio` with `object-fit: cover` and an `object-position` that keeps the
subject in frame.

## Images we intentionally left out

- **The books-vs-Bible graphic**: its book covers have garbled, misspelled text
  ("Wonderfful Wizerare of Oz", "Machefff"). That message is clean text on the
  home page instead. If a corrected version turns up, it can go back in.
- **The Facebook post screenshots**: their wording is now real text on the site;
  the screenshots themselves (with Facebook's like/comment bar) aren't used.
