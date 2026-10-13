# RockLadder website (2026 redesign)

Single-page, scroll-driven story site for RockLadder Technologies. Static HTML, no build step.

**Story:** Base camp (the threat) → Rung 01 Assess → 02 Test → 03 Defend → 04 Lead → Summit (analytics) → About → Contact.
A fixed altitude rail on the left climbs from 0 to 8,848 m as you scroll.

**Stack:** GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 smooth scroll (jsDelivr), Google Fonts
(Big Shoulders Display, IBM Plex Sans, IBM Plex Mono). The hero network is a plain `<canvas>`.

**Run locally:** open `index.html`, or `npx serve rockladder-site`.

**Before going live**
- The contact form has no backend. Wire `#contact-form` to your mail service (Formspree, a serverless function, etc.).
- Review the copy against the old site: services and company facts come from public profiles, because the old site
  couldn't be fetched during the build.
- Content still to collect: client logos, testimonials, certifications, a phone number.
- Motion is fully disabled for `prefers-reduced-motion`, and all content stays readable if the CDNs fail.
