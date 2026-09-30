## [2.0.0](https://github.com/ElJijuna/floaty-widget/compare/v1.11.0...v2.0.0) (2026-09-30)

### ⚠ BREAKING CHANGES

* enhance floating widget resize functionality and update documentation

### Features

* add --floaty-reveal-zone CSS variable and update Floaty component to utilize it for frame visibility ([1cbed07](https://github.com/ElJijuna/floaty-widget/commit/1cbed077949e25e5a69eb8d1da465243eb67e885))
* add chrome insets handling for floating widget positioning and update tests ([c9e586c](https://github.com/ElJijuna/floaty-widget/commit/c9e586c042fd078cce4fb23692b4bd3f4cb8bac0))
* add docking options for window arrangement in Floaty widget ([5ad2192](https://github.com/ElJijuna/floaty-widget/commit/5ad219215057bd14dcaad89b3abf63141771057a))
* enhance floating widget resize functionality and update documentation ([fd33329](https://github.com/ElJijuna/floaty-widget/commit/fd333291b064a4172980f7d4d09db901b691b73f))
* enhance widget movement functionality with dedicated move handle and keyboard controls ([eb4848a](https://github.com/ElJijuna/floaty-widget/commit/eb4848a916e6a3c30788b1c6a841a84a60b33aef))
* enhance window arrangement with animated transitions and new geometry options ([e1b1f61](https://github.com/ElJijuna/floaty-widget/commit/e1b1f61053d3cecba5ebb4b01c8648815d4a4429))
* implement floating chrome functionality and add built-in SVG icons for header buttons ([372e3cd](https://github.com/ElJijuna/floaty-widget/commit/372e3cda18f5c3c142a6da34cd860503d6793529))
* implement grace period for floating frame visibility to prevent flickering ([e98b846](https://github.com/ElJijuna/floaty-widget/commit/e98b8468e699701f66a2cd8d3800067ab4db9029))
* implement persistent window layout management with setLayout() and update related tests ([c7feacc](https://github.com/ElJijuna/floaty-widget/commit/c7feacce3663b462ab1ab3e0f004bf7868a3f237))
* merge windows into tabs by dragging onto a title bar ([a75d99b](https://github.com/ElJijuna/floaty-widget/commit/a75d99b8c29b65b0503d7d7c6c55fb89d4e6e7ae))
* resizable dividers between windows of an active layout ([9cb040b](https://github.com/ElJijuna/floaty-widget/commit/9cb040bb32f8a5c6957c685043d6a8509f715e14))
* reveal floating widget frame and controls on pointer hover near top edge ([6fe6239](https://github.com/ElJijuna/floaty-widget/commit/6fe6239171c8054a1d81407a4bd2769aa30dfdfb))
* update move handle functionality and improve keyboard accessibility in Floaty component ([bb021bc](https://github.com/ElJijuna/floaty-widget/commit/bb021bc030bf9ddc9885aa560e2774bdef6aafbc))
* update README and CSS for floating mode enhancements; adjust component imports in stories ([d0ea7d0](https://github.com/ElJijuna/floaty-widget/commit/d0ea7d051450c1a50a5d478cc4dec4ef9f587179))
* update semantic release configuration to use conventional commits preset and enhance documentation for Floaty component ([8bd243b](https://github.com/ElJijuna/floaty-widget/commit/8bd243b9214180b35ccc99e6e0284c8934de3625))
* update window arrangement options to use insets instead of bottomInset for better layout management ([754960f](https://github.com/ElJijuna/floaty-widget/commit/754960f96eed3e963f7ef203c510444e9f040832))

# [1.11.0](https://github.com/ElJijuna/floaty-widget/compare/v1.10.0...v1.11.0) (2026-09-25)


### Bug Fixes

* disable declaration map in TypeScript configuration ([0ec26ed](https://github.com/ElJijuna/floaty-widget/commit/0ec26edbc16f1f6e08edb21227fdfd5322b91f87))


### Features

* add focus management options for Floaty widget with autoFocus and restoreFocus props ([dd35614](https://github.com/ElJijuna/floaty-widget/commit/dd356146b4ff71345d63908397aea22c00517114))
* implement keyboard resizing for window mode and update related tests ([7c2ab3f](https://github.com/ElJijuna/floaty-widget/commit/7c2ab3f5cff404601819db63cc85f31ee0d22b9b))

# [1.10.0](https://github.com/ElJijuna/floaty-widget/compare/v1.9.0...v1.10.0) (2026-09-21)


### Features

* implement touch support for Floaty component with pinch-to-resize and drag functionality ([9aa993c](https://github.com/ElJijuna/floaty-widget/commit/9aa993cd9526bab51c69367435ffd2840d402dcf))

# [1.9.0](https://github.com/ElJijuna/floaty-widget/compare/v1.8.0...v1.9.0) (2026-09-19)


### Features

* add controlled state management to Floaty component with external state handling ([dbc7214](https://github.com/ElJijuna/floaty-widget/commit/dbc72142fb241470fc42946953bbc2afd93a64df))

# [1.8.0](https://github.com/ElJijuna/floaty-widget/compare/v1.7.1...v1.8.0) (2026-09-19)


### Features

* add window style options for Floaty widget with corresponding styles and icons ([20f2e54](https://github.com/ElJijuna/floaty-widget/commit/20f2e5483e2dab0cc10f9023e0efef797cbc9dd6))
* enhance CI workflow with coverage check, update README for clarity, improve floaty.spec.ts tests, and adjust coverage thresholds in vite.config ([90d7902](https://github.com/ElJijuna/floaty-widget/commit/90d7902d9c76ecd05df82a586ce8da3a9de4656f))
* implement window arrangement feature with grid, columns, and rows layout options, including geometry persistence and corresponding tests ([7bb8678](https://github.com/ElJijuna/floaty-widget/commit/7bb8678a6dca8f2b603ccb50cfe9d7dbb0cbdfdb))

## [1.7.1](https://github.com/ElJijuna/floaty-widget/compare/v1.7.0...v1.7.1) (2026-09-18)


### Bug Fixes

* update peerDependencies for react and react-dom to support version ranges ([f5ee3cf](https://github.com/ElJijuna/floaty-widget/commit/f5ee3cfe71392a9e50fc3f6b673ed48519e9db01))

# [1.7.0](https://github.com/ElJijuna/floaty-widget/compare/v1.6.0...v1.7.0) (2026-09-09)


### Features

* update FloatyPreview to use zoom for scaling and improve test descriptions ([243f179](https://github.com/ElJijuna/floaty-widget/commit/243f179b94b6f6acd10c86cc9ff3dd5939b93f48))

# [1.6.0](https://github.com/ElJijuna/floaty-widget/compare/v1.5.0...v1.6.0) (2026-08-30)


### Features

* add desktop window management with snap, resize, persistence, and taskbar ([e4ab366](https://github.com/ElJijuna/floaty-widget/commit/e4ab3663cf05169c786e31d2d740704aa0320567))

# [1.5.0](https://github.com/ElJijuna/floaty-widget/compare/v1.4.0...v1.5.0) (2026-08-30)


### Features

* add Playwright E2E testing setup and update documentation ([bc829d7](https://github.com/ElJijuna/floaty-widget/commit/bc829d7fabd2a578f86f075a21a62a791995d6f3))
* add window mode for Floaty widget with integrated header and update related tests and documentation ([9a0f7e1](https://github.com/ElJijuna/floaty-widget/commit/9a0f7e1dbb7565aa2858f89881aa688617bb1b38))
* enhance Floaty widget functionality and improve testing ([69cb5fa](https://github.com/ElJijuna/floaty-widget/commit/69cb5faf047fa3bac48e600f0ad738f798ee2e55))

# [1.4.0](https://github.com/ElJijuna/floaty-widget/compare/v1.3.0...v1.4.0) (2026-05-30)


### Bug Fixes

* remove unused floaty fade and active shadow tokens ([fa178e4](https://github.com/ElJijuna/floaty-widget/commit/fa178e42c4a7dff33bc659370a48492a58f8d241))


### Features

* add drag blur tokens with opacity fallback ([40348cf](https://github.com/ElJijuna/floaty-widget/commit/40348cff287f7d091d00ceeaab0d261ee42e1a8e))

# [1.3.0](https://github.com/ElJijuna/floaty-widget/compare/v1.2.0...v1.3.0) (2026-05-30)


### Bug Fixes

* remove shadow and Header and content space ([b5ff1e4](https://github.com/ElJijuna/floaty-widget/commit/b5ff1e4f80f361b46da25ed703891d669bdfbe6f))


### Features

* gate resize behind header toggle ([ed10a77](https://github.com/ElJijuna/floaty-widget/commit/ed10a7725cd89716300dd98890e68227b014bddc))
* style floaty body overflow states ([8765477](https://github.com/ElJijuna/floaty-widget/commit/87654776bbbb2ed1d2209751f51e5d17ddeaaa1c))

# [1.2.0](https://github.com/ElJijuna/floaty-widget/compare/v1.1.3...v1.2.0) (2026-05-27)


### Bug Fixes

* reduce floaty drag and viewport render overhead ([a2a7cb8](https://github.com/ElJijuna/floaty-widget/commit/a2a7cb8527a48f54d4c987f7cdf7d12fe9bb8bca))


### Features

* active focus, viewport clamping, lazy error boundary, and double-click collapse ([99c4814](https://github.com/ElJijuna/floaty-widget/commit/99c4814ec37df62a0f2f2e731cd3b052851d1f77))
* add floaty widget preview ([4197627](https://github.com/ElJijuna/floaty-widget/commit/41976277f923a079c8f64fdde8caba70f828fd04))
* improve floaty keyboard and responsive UX ([8b74e40](https://github.com/ElJijuna/floaty-widget/commit/8b74e40f05431fb88b2420d30a2af76c48002267))
* support lazy-loaded floaty widgets ([3e3b8e1](https://github.com/ElJijuna/floaty-widget/commit/3e3b8e1443ebf3eff54c72ee12a6f3bc074e463c))

## [1.1.3](https://github.com/ElJijuna/floaty-widget/compare/v1.1.2...v1.1.3) (2026-05-25)


### Bug Fixes

* export types ([2fc5ec5](https://github.com/ElJijuna/floaty-widget/commit/2fc5ec55a8ebe8e24c19efc407325ad978f00406))

## [1.1.2](https://github.com/ElJijuna/floaty-widget/compare/v1.1.1...v1.1.2) (2026-05-25)


### Bug Fixes

* add css to exports ([d0cd70f](https://github.com/ElJijuna/floaty-widget/commit/d0cd70f06440c677d2af2c78cc1f3f09a11f3f91))

## [1.1.1](https://github.com/ElJijuna/floaty-widget/compare/v1.1.0...v1.1.1) (2026-05-25)


### Bug Fixes

* change config in vite ([88521e7](https://github.com/ElJijuna/floaty-widget/commit/88521e7511c6901a21a265bdb8958fcf1068a8cf))

# [1.1.0](https://github.com/ElJijuna/floaty-widget/compare/v1.0.0...v1.1.0) (2026-05-25)


### Features

* add singleton and hook to open and close widget from simple api ([a03d59a](https://github.com/ElJijuna/floaty-widget/commit/a03d59a5b3accfacb914f25ecb8af756dbb8b03a))

# [1.0.0](https://github.com/ElJijuna/floaty-widget/compare/289c77c2d326e4fba6a3bcce92b432d1abd63c57...v1.0.0) (2026-05-25)


### Bug Fixes

* remove transition in resise event ([6e7c7a4](https://github.com/ElJijuna/floaty-widget/commit/6e7c7a4731703205610402dc0fac582bc288e909))
* solved error in drag event ([fa0f3cd](https://github.com/ElJijuna/floaty-widget/commit/fa0f3cd3fb6d6dc7c5d0477c8160fbe648414307))


### Features

* add new tokens to change colors pending in widget floaty ([ea419ed](https://github.com/ElJijuna/floaty-widget/commit/ea419edb132f0829f7777f77e8c5b3aa887dc639))
* add support to override theme ([2f40b0c](https://github.com/ElJijuna/floaty-widget/commit/2f40b0c26a90d70ab965862504389798b2e22d29))
* add widget manafer. ([5af8788](https://github.com/ElJijuna/floaty-widget/commit/5af87887d2f4b148d220b8fdebcfde22eb7df24b))
* add widget resize and minimize controls ([1d0cebc](https://github.com/ElJijuna/floaty-widget/commit/1d0cebcbb62c6c56cf1ab28dad5f848dea1283c8))
* add widget store and viewport rendering API ([d9e478e](https://github.com/ElJijuna/floaty-widget/commit/d9e478ebd40334650b3f98b4fdb119bd3f544278))
* initialize floaty-widget project with full setup. ([289c77c](https://github.com/ElJijuna/floaty-widget/commit/289c77c2d326e4fba6a3bcce92b432d1abd63c57))
* new version of widget ([277e823](https://github.com/ElJijuna/floaty-widget/commit/277e823e69efadf18c27e48dfa23ad8b8903d661))
* update and fix errors in floaty component and improvements in FloatyWidgetManager ([28560fa](https://github.com/ElJijuna/floaty-widget/commit/28560fafab67c52d368ec4be3fcfb9a9420a8da1))
