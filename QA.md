# Verification — المواطن ضد الغلاء 3D (2026-10-08)

## Executed successfully

- npm install: resolved dependencies and updated package-lock.json for version 2.
- npm run check: TypeScript passed.
- npm test: 31 tests passed, 0 failed (21 new/current-game checks plus 10 preserved regression tests).
- npm run build: production bundle built for index.html and admin.html.
- All eight mission logic paths tested for success/failure, funds, decisions, timing, and duplicate transactions.
- Three stage-8 minigames: exact fuel amount, budget phone selection, and school/reserve decisions.
- Progress tests: best-result aggregation, no repeated completion rewards, resume of market/bills/runner, corruption handling and ledger consistency.
- Babylon NullEngine: city, expansion, fictional dollar, materials/textures, collision coordinator, ray picking and reachable destinations/market positions initialized.
- Bundled citizen-original.glb loaded through Babylon's glTF loader with seven named animation groups and a moustache mesh.
- Existing official-original.glb regression retained; no old assets removed.

The reachability check originally detected a taxi marker overlapping a vehicle clearance and stall interactions too near counters. These positions were corrected, then the final test suite passed.

## Browser/device limits

No live browser, WebGL screenshot, or Safari/Android device test was executed. Playwright packages exist in the shared runtime, but no installed Chromium/Chrome binary was found at the checked standard paths; a browser was not installed for this task. NullEngine tests do not measure frame rate or validate GPU rendering, actual multi-touch, Arabic appearance on Safari, camera feel, or blackout-free operation on a physical device. Those checks remain outstanding.

## Build and performance observations

Build succeeds with Vite's warning about some chunks exceeding 500KB uncompressed. The shared sceneLoader/engine chunk is approximately 869KB (211KB gzip); lazy glTF chunk approximately 664KB (163KB gzip); the citizen GLB is approximately 627KB. Quality presets, capped render resolution, palm instancing, produce LOD, distant detail culling, and background rendering pause are implemented. 30/60fps remain targets, not measured results.

## Scope and visual limits

The main scene, locomotion, market purchasing, lane runner, currency and bill collisions are implemented. Stages 3–8 combine 3D navigation with HTML decision dialogs; they are not full driving/household physical simulations. The model is an original simplified cartoon asset with transform animation groups, not a polished commercial character or a face reconstructed from a photo. The graphics are not claimed to match the reference image's detail.

## Publishing state

Code delivered to the independent branch codex/citizen-vs-inflation with a pull request. Cloudflare account settings and the prior production branch were not changed. To preview the new game, set Cloudflare Pages Production branch to codex/citizen-vs-inflation, build command npm run build, output dist, NODE_VERSION=22.
