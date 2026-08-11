# New Living Health Care Services — website revamp

Static site. No build step, no dependencies to install. Upload the folder to any host (Netlify, Vercel, Cloudflare Pages, cPanel, S3) and it runs.

```
newlivinghealthcare/
├── index.html        Home
├── about.html        About Us
├── services.html     Our Services
├── staff.html        Our Staff
├── careers.html      Careers
├── contact.html      Contact Us
├── notices.html      Notices (SMS terms, SMS privacy, patient notices)
├── robots.txt
├── sitemap.xml       Update URLs if the final domain is not newlivinghealthcare.com
└── assets/
    ├── css/style.css
    ├── js/main.js
    ├── img/favicon.svg
    └── docs/           Notice of Privacy Practices + Complaint and Grievance Policy PDFs
```

To preview locally: `python3 -m http.server` in this folder, then open `http://localhost:8000`.

---

## Design system

| Token | Value | Role |
|---|---|---|
| `--ink` | `#1C3A26` | Text, dark ground |
| `--ink-deep` | `#12251A` | Hero, footer |
| `--paper` | `#F3F5EE` | Page ground |
| `--amber` | `#E4A140` | The "light of hope" — accent, used sparingly |
| `--sage` | `#7DA383` | Supportive, calm |
| `--danger` | `#B4442F` | Crisis only |

**Typefaces.** Fraunces for display, Public Sans for body and utility. Public Sans is the US federal government's open-source typeface (USWDS) — for a DBH-certified, Medicaid-funded agency that reads as the correct institutional register rather than a styling choice. Fraunces supplies the warmth. Both load from Google Fonts.

**The signature element.** A single unbroken amber line runs down the left rail on desktop and draws itself as you scroll, with a node lighting up for each section. It is the agency's clinical purpose made visible: continuity, nobody dropped between services. It is the only bold move on the site; everything else stays quiet on purpose.

---

## Motion

`anime.js 4.4.1` (UMD build) from cdnjs with subresource integrity, used for five things only: the hero entrance, staggered section reveals, the mobile nav slide, the Notices accordion, and a once-per-session draw-on of the brand mark (via `anime.svg.createDrawable`). The scroll thread runs on `requestAnimationFrame` rather than anime.js so it stays smooth. Everything is called through the `window.anime` namespace (`anime.animate`, `anime.stagger`, `anime.svg`, `anime.utils`), so the classic-script fallback still applies if the CDN fails.

**ESM adapter.** Every page also carries an import map resolving `animejs` to the v4 ESM build (with its own integrity hash). That means any anime.js v4 snippet written in module style works verbatim in a `<script type="module">` block, no build step:

```html
<script type="module">
  import { animate, stagger } from 'animejs';
  animate('.thing', { x: '4rem', delay: stagger(100) });
</script>
```

The import map costs nothing until something imports from it. If a page uses both `main.js` (UMD) and a module snippet, the browser holds two copies of the library — fine for experiments; for production, migrate the page fully to one build. And on this site, any snippet must still respect `prefers-reduced-motion`.

Motion is deliberately restrained. Some visitors to this site will be symptomatic, in crisis, or reading on an old phone. Aggressive animation is a usability failure here, not a flourish.

Two safety nets:
- **CSS holds the final state.** If anime.js fails to load or JS is off, every element is visible and the page is complete.
- **`prefers-reduced-motion` is fully respected** — all animation is killed, the thread renders complete, nothing fades.

---

## UIverse components

You asked for UIverse. The interactive components here — the sheen-sweep primary button, the border-draw ghost button, the animated underline links, the custom consent checkbox, the accordion chevron, the card hover rule, the pulsing crisis dot — are written from scratch in that idiom, using this site's tokens rather than UIverse's default palette. That keeps them on-brand and dependency-free.

To swap in an actual component from [uiverse.io](https://uiverse.io):

1. Copy the HTML and CSS from the component page.
2. Paste the CSS at the bottom of `style.css`, under a comment naming the component and its author.
3. Replace the component's hardcoded colours with our tokens: `var(--amber)`, `var(--ink)`, `var(--paper)`, `var(--sage)`.
4. Check the tap target is still at least 48px tall and that `:focus-visible` still shows an outline. Many UIverse components remove focus styling — add it back.

UIverse components are MIT licensed. Keep the author credit in a comment.

One actual UIverse component is integrated: the two-block orbit spinner by satyamchaudharydev, rethemed to `--amber`/`--sage` and sized for inline use, as the contact form's pending state (`.spinner` in `style.css`). It only shows while a submission is in flight, and the reduced-motion rule freezes it.

---

## Before this goes live

**Content and compliance**

1. **Fill the SMS placeholders.** The current live site publishes `[enter the type of SMS communications]` and `[Company Contact Number and/or Email]` verbatim. Carriers check this during 10DLC campaign registration, and unfilled placeholders can get a campaign rejected. Both are marked with `<mark>` on `notices.html`.
2. **Link the two PDFs** — done. Notice of Privacy Practices and Complaint and Grievance Policy live under `assets/docs/` and are linked from `notices.html`. Note: the source Complaint and Grievance Policy PDF contains an apparent drafting error (items 3 b–e repeat the same sentence four times, and two consecutive sections are both numbered "Procedures for the qualified practitioner") — worth correcting in the source document and re-exporting.
3. **Add staff licensure.** Post-nominals (LGSW, LICSW, APRN) beside each name on `staff.html`. It is the first thing a referring hospital or a family member looks for. There is a note in the page marking where.
4. **Staff photographs** only with written consent from each person.
5. **Wire the contact form.** It currently intercepts submission and tells the user to call. Do not accept real submissions until it posts to a handler you control — and keep the "do not include health information" notice regardless, since a public web form is not an appropriate channel for PHI.
6. **Verify the crisis and grievance numbers** before launch. The DBH consumer grievance line on notices.html is published as 202-673-4374 (client-provided); note DBH's public Consumer Rights page lists (202) 673-4372 for grievance specialists — confirm which is correct with DBH. 988 (Suicide & Crisis Lifeline) and 1-888-793-4357 (DC DBH Access HelpLine) are included in the top bar of every page and in a block at the foot of every page. This was the largest gap on the existing site — a behavioral health provider whose site offered no route to help outside of 9–6 office hours.

**Technical**

7. Favicon and `apple-touch-icon.png` — done, generated from the official tree-of-hands logo (`assets/img/logo-tree.png`, also now the header/footer mark; the footer renders it as a white silhouette via CSS filter). Still worth adding a root `favicon.ico` for very old browsers.
8. Add an `og:image` (1200×630) so links shared on social and in messages render properly.
9. Add `LocalBusiness` / `MedicalOrganization` JSON-LD structured data with the address, phone, and hours — meaningful for local search in Ward 7.
10. Add `sitemap.xml` and `robots.txt`.
11. Serve over HTTPS with HSTS.
12. Set up analytics with a cookie notice, or use a cookieless analytics tool and skip the banner.

---

## Copy changes made

Content is faithful to the existing site — same services, same mission and vision, same staff, same careers text, same address and hours, same notices. What changed:

- Fixed typos carried on the live site: "inspireconfidence" → "inspire confidence", "skillls" → "skills".
- Rewrote service descriptions so each one ends with a plain-language **"What this means for you"** line. The originals describe the service from the agency's regulatory perspective; a person in distress needs to know what will actually happen to them.
- Added a **"How it starts"** three-step section. This is the only place numbering is used, because intake genuinely is a sequence. Nothing else on the site is numbered.
- Added the crisis resources described above.
- Added an expanded EEO statement with protected categories named, and an accommodation contact for applicants.
