# Where your image files go

The site currently uses **placeholder SVGs** so it renders before your real
artwork is in place. Here's how to swap in the real files.

## Folder
Put image files in: `public/images/`
Anything in `public/` is served from the site root — e.g.
`public/images/logo.png` becomes `https://www.tampatower.org/images/logo.png`.

## Files to provide

| File to add | What it is | Used for |
|---|---|---|
| `logo.png` | Your real crest (the gold/navy Tampa Tower Academy shield). Ideally a **square PNG with a transparent background**, at least 512×512. | Social-share preview (Open Graph), Apple touch icon, schema.org logo. |
| `step-up-badge.png` *(optional)* | The "Approved Provider — Step Up For Students EMA Marketplace" badge. Square, transparent background. | Can replace the placeholder badge SVG. |

## How the swap works
- The **on-page logo and badge** currently point at `logo.svg` and
  `step-up-badge.svg` (crisp placeholders). Once you give me the real PNGs,
  I'll either (a) point the tags at your `.png`, or (b) convert your crest to a
  clean `.svg` so it stays razor-sharp at every size. Either is a one-line change.
- `logo.png` is *also* referenced for social previews and the schema markup, so
  it's worth adding even if we keep the on-page logo as SVG.

## Images we intentionally left out
- **The books-vs-Bible graphic**: its book covers have garbled, misspelled text
  ("Wonderfful Wizerare of Oz", "Machefff"). We rebuilt that message as clean
  text on the home page instead. If you get a corrected version, we can add it.
- **The Facebook post screenshots**: their wording is now real text on the site;
  the screenshots themselves (with Facebook's like/comment bar) aren't used.
