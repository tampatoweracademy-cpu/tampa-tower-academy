# Tampa Tower Academy — website

A fast, static website for Tampa Tower Academy, built with [Astro](https://astro.build).
Ships almost no JavaScript, deploys free on Cloudflare Pages, and is fully under
your control in Git.

## Run it locally

```bash
npm install      # once
npm run dev      # start dev server → http://localhost:4321
```

Other commands:

```bash
npm run build    # production build into ./dist
npm run preview  # preview the production build locally
```

## Project structure

```
src/
  layouts/Base.astro       # <head>, SEO, schema.org, header + footer wrapper
  components/Header.astro   # sticky nav (responsive burger menu)
  components/Footer.astro
  pages/                    # one file per URL
    index.astro   → /
    about.astro   → /about
    curriculum.astro → /curriculum
    programs.astro → /programs
    contact.astro → /contact
  styles/global.css         # design system (navy + gold, from the crest)
public/
  images/                   # logo, badge — see ASSETS_README.md
  favicon.svg, robots.txt
```

## Editing content
- Text lives directly in the `.astro` page files (plain HTML with a small
  frontmatter block at the top between `---` fences).
- The enrollment link (`https://forms.gle/GSf12Znbd63fsDfk7`) is set in
  `Header.astro`, `Footer.astro`, and each page's frontmatter.
- Contact details are in `Footer.astro` and `src/pages/contact.astro`.

## Deploying to Cloudflare Pages
1. Push this repo to GitHub.
2. In Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. You'll get a free `*.pages.dev` URL to test.
5. Once verified, add the custom domain `www.tampatower.org` in the Pages
   project (Custom domains tab). Do the DNS cutover only after the domain's DNS
   is on Cloudflare — see the migration checklist shared separately.

## Analytics
Cookie-free Cloudflare Web Analytics is pre-wired (commented out) in
`src/layouts/Base.astro`. After deploying, paste your beacon token there and
uncomment the snippet. No cookie banner required.

## TODO before launch
- [ ] Add real `logo.png` (and optional `step-up-badge.png`) — see `ASSETS_README.md`
- [ ] Replace placeholder Facebook / Instagram URLs (Footer, Contact, Base schema `sameAs`)
- [ ] Add the school's full mission + program details (marked "coming" in About/Programs)
- [ ] Paste Cloudflare Web Analytics token
