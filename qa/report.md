# MAB Solar-System Journey — Final QA Report

**Date:** 2026-08-09  
**Target:** `http://127.0.0.1:8765/index.html`  
**Project:** `C:\Users\bockr\mabai-website-concepts\solar-system`

## Executive summary

**Result: PASS**

- Open critical issues: **0**
- Open high issues: **0**
- Browser console errors: **0**
- Failed local resource requests: **0**
- Seven themed worlds loaded: **7/7**
- Mobile/reduced-motion checks: **PASS**

## Verified requirements

| Requirement | Evidence | Result |
|---|---|---|
| Cinematic intro can finish or be skipped and hands off to a ready hub | Desktop E2E | PASS |
| Opening camera starts close to a substantial Arctic planet | `01-hub-opening.png`; WebGL progress `0` | PASS |
| Seven hub planets use local, theme-specific 2:1 textures | `assets/worlds/planets/*.webp`; topology regression | PASS |
| Planet atmosphere, relief, and weather layers are present | Fresnel shader/cloud-shell regression; opening screenshot | PASS |
| Station hold is elapsed-time based and at least 2,000ms | Unit test plus browser wheel test | PASS |
| Wheel strength cannot force release during hold | Browser position remained `1400 → 1400` | PASS |
| Scrolling resumes after hold | Browser position advanced `1400 → 2196` | PASS |
| Direct station navigation does not get trapped by intermediate holds | Desktop E2E transit to `mechanism` | PASS |
| Clicking a station opens its correct full-screen world | Actual Lava CTA click | PASS |
| World route follows a closed circular orbit | Pure orbit regression plus browser midpoint `0.5` | PASS |
| Exactly one readable chapter is visible at midpoint | Card `337..664px` in a `1000px` viewport | PASS |
| Opposite-side rift becomes dominant and returns to same station | Rift power `0.9991`; active station restored to `mechanism` | PASS |
| All seven worlds use local hero/detail imagery | Seven-theme browser loop | PASS |
| Mobile chapter fits at 390×844 | Card `x=61..342`, `y=259..585` | PASS |
| Reduced-motion open/end/return path works | Responsive E2E | PASS |

## Visual evidence

- `01-hub-opening.png` — close textured Arctic opening planet
- `02-lava-station.png` — station, real environment imagery, timed hold status
- `03-lava-world-entry.png` — full-screen environment and entry rift
- `04-lava-world-midpoint.png` — circular route midpoint and single chapter panel
- `05-lava-outbound-rift.png` — opposite-side return rift
- `06-returned-to-hub.png` — restored matching hub station
- `mobile-ocean-midpoint.png` — 390×844 responsive environment
- `worlds-contact-sheet.png` — all seven final world captures

All evidence is under `qa/`.

## Resolved during live QA

1. Direct station jumps were intercepted by the first intermediate timed hold. Added a transit destination exemption while retaining normal user-scroll holds.
2. Midpoint chapter cards clipped at section boundaries. Replaced competing cards with one active viewport-fixed chapter field.
3. The world-root transform caused fixed chapter cards to scroll out of view. Removed that containing-block transform.
4. Mobile startup delayed the first chapter fade, temporarily leaving no readable copy. Mobile chapter transitions now prioritize immediate content display.
5. The old hub aperture bled through during the world-entry fade. Hub cut layer, rail, and dwell chrome are now hidden while a world owns the screen.
6. Generic-looking planets were replaced with seven seamless local photo-derived skins, physical bump, emissive response, Fresnel atmosphere, and moving cloud shells where applicable.

## Commands

```bash
npm test
npm run test:browser
npm run serve
```

`npm run test:browser` expects the local server at port `8765`.

## Scope note

The environments are high-resolution composited browser experiences—local photography/generation, layered parallax, particles, weather, fauna imagery, rifts, and a WebGL hub. They are **not** fully modeled real-time 3D ecosystems in which every leaf, animal, droplet, and person is an independent 3D asset.

Asset provenance is documented in `ASSET-CREDITS.md`.
