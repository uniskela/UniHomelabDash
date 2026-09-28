# Changelog

## [0.9.1](https://github.com/uniskela/UniHomelabDash/compare/v0.9.3...v0.9.1) (2026-09-28)


### Features

* add authenticated stack membership API ([44f2c31](https://github.com/uniskela/UniHomelabDash/commit/44f2c31fdbabd294aea0499646087ad7920786f0))
* add Open Control Room documentation homepage ([0e43506](https://github.com/uniskela/UniHomelabDash/commit/0e43506e5d53962c65e1b96b194a70200f710cb7))
* add read-only Portainer integration ([ad07c14](https://github.com/uniskela/UniHomelabDash/commit/ad07c14d84088c874a5714cd8c6b4d03e368faef))
* add read-only Portainer stack visibility ([feef0ba](https://github.com/uniskela/UniHomelabDash/commit/feef0ba66752605dd86f37af018099f9ae22c4ac))
* add stack container drawer ([c5bb358](https://github.com/uniskela/UniHomelabDash/commit/c5bb358b40f5c268fb51eecddc51bf4efe6816d9))
* Container Control Centre (v0.9.0) ([f48ee81](https://github.com/uniskela/UniHomelabDash/commit/f48ee815438b56c5ea011c16614b37eb27ced54e))
* expand Docker container integrations ([8f3c332](https://github.com/uniskela/UniHomelabDash/commit/8f3c3325075480b8c5d7b75767f472ac7cd54a9e))
* link stack members to container search ([4961c8d](https://github.com/uniskela/UniHomelabDash/commit/4961c8dd1824c2841ca4193b3c16ecadae90e7fb))
* model Portainer endpoint availability ([b0f241f](https://github.com/uniskela/UniHomelabDash/commit/b0f241fec7660898fcac859390ab8927a0c11a01))
* polish Containers UI with views, grouping, hide, and prefixed search ([3856bc8](https://github.com/uniskela/UniHomelabDash/commit/3856bc86efbbd45b2f581999a57b2ce2d06a161f))
* resolve Portainer stack containers ([2d1fd2d](https://github.com/uniskela/UniHomelabDash/commit/2d1fd2d3fd379526701c43f86cf348c96ad23366))
* ship Container Control Centre for v0.9.0 ([9d8e3dc](https://github.com/uniskela/UniHomelabDash/commit/9d8e3dc9fbc837fee91a3a128b00744c3b105d3d))
* speed up Containers loading and add list filters ([71f0151](https://github.com/uniskela/UniHomelabDash/commit/71f0151ea826abfb456b4881ae479790d3242e34))


### Bug Fixes

* add light documentation wordmark ([761e5ee](https://github.com/uniskela/UniHomelabDash/commit/761e5eeec72ea617bc705b0a8cae1a5663971f35))
* address final v0.8.0 review ([9598aa5](https://github.com/uniskela/UniHomelabDash/commit/9598aa570e3881d9e2d24bbf5c8e33dee335e0c8))
* address Portainer PR review findings ([d662f7d](https://github.com/uniskela/UniHomelabDash/commit/d662f7d3670f03393496f2cfe83d8b48c103b46a))
* address v0.8.0 verification findings ([6987e20](https://github.com/uniskela/UniHomelabDash/commit/6987e2082d9ddcfeed6bc00474dc43b2c871dcbf))
* bind lifecycle test to loopback ([c8b56d2](https://github.com/uniskela/UniHomelabDash/commit/c8b56d2ff86a2bbc8c0775b6644d4d6009f01277))
* correct quick-start security link ([e516ade](https://github.com/uniskela/UniHomelabDash/commit/e516adee0044fbb244e0e54ebb489c64a11f269f))
* harden Portainer requests and partial failure handling ([b83fad2](https://github.com/uniskela/UniHomelabDash/commit/b83fad203bc6c415bf173d8b80e44be58fcbddd5))
* isolate hung Docker requests and Portainer host metadata ([0181c13](https://github.com/uniskela/UniHomelabDash/commit/0181c134e9462b6c2e7f0becf02ccc751233db54))
* make stack refresh bypass cache ([8141f70](https://github.com/uniskela/UniHomelabDash/commit/8141f7079aca163882ff5a4f022ed30e7fa9ddea))
* mark disconnected Portainer stacks unavailable ([c403eee](https://github.com/uniskela/UniHomelabDash/commit/c403eee970a95e7ec75aa403e4c2f78fd260a0af))
* pause live metrics off Metrics tab and keep last sample ([eb4d892](https://github.com/uniskela/UniHomelabDash/commit/eb4d892718b008a5f784f05a6ab458975b9e990b))
* resolve npm supply-chain advisories from Semgrep SCA ([b107361](https://github.com/uniskela/UniHomelabDash/commit/b107361dacbdf34e5fc9ba0b2d8f18c12d478b2f))
* resolve Portainer base URL prefixes, IPv6 hosts, and scheme casing ([1d808b7](https://github.com/uniskela/UniHomelabDash/commit/1d808b72ec6c6a084b5a2aec7ebd29482167fdc2))
* resolve Semgrep/npm supply-chain advisories ([74bfa33](https://github.com/uniskela/UniHomelabDash/commit/74bfa332967e5112a7e9b008538dcacd065188fe))
* restore documentation light theme ([0519209](https://github.com/uniskela/UniHomelabDash/commit/0519209bbaefbc56288a013b835614d59dd3fd9a))
* restrict stacks to known Docker endpoints ([dbb05fd](https://github.com/uniskela/UniHomelabDash/commit/dbb05fd6986025aa070e716a4510a15a00007306))
* retain metrics sample without setState-in-effect ([97282bd](https://github.com/uniskela/UniHomelabDash/commit/97282bdbb405ed5545fd569f009801934e4ae469))
* sync stack drawer after refresh ([e4d185f](https://github.com/uniskela/UniHomelabDash/commit/e4d185f6681b62a7e590ad1a1d5a084042c27f98))


### Documentation

* add operator and integration guides ([04d0fbc](https://github.com/uniskela/UniHomelabDash/commit/04d0fbc99648be08a7290e8fe0ba9420571d5bae))
* clarify scoped stack membership ([a4a2cb6](https://github.com/uniskela/UniHomelabDash/commit/a4a2cb6c89cc23f8f35e8b94ca4d365d54020eb4))
* connect project and contributor documentation ([7771bf5](https://github.com/uniskela/UniHomelabDash/commit/7771bf5201cf03a5556159b6f28ccf04743e2fbf))
* dedupe 0.9.3 changelog supply-chain fix entry ([aa064fe](https://github.com/uniskela/UniHomelabDash/commit/aa064feeb4f9038117c9676fee30e5b2729fdca8))
* design documentation maintenance policy ([52d4b1a](https://github.com/uniskela/UniHomelabDash/commit/52d4b1aa0911564ad8947b4e2c9da19255f91f41))
* design GitHub Pages website ([b36c7c0](https://github.com/uniskela/UniHomelabDash/commit/b36c7c0a3d5bbf37f93fe802805c106d1205bf6f))
* design v0.8.0 stack container drill-down ([eafc292](https://github.com/uniskela/UniHomelabDash/commit/eafc2920d5f15664e3133c1371a3240de9457b87))
* mark v0.9.1 as shipped after release ([#59](https://github.com/uniskela/UniHomelabDash/issues/59)) ([9c080e1](https://github.com/uniskela/UniHomelabDash/commit/9c080e1ffd99396d1dc0ab592fb510bee027ecdc))
* plan documentation maintenance policy ([d982ae4](https://github.com/uniskela/UniHomelabDash/commit/d982ae48cd8cdb39c3aef25b34c3a6bf41046762))
* plan GitHub Pages implementation ([91f1f69](https://github.com/uniskela/UniHomelabDash/commit/91f1f69766c1c7aab0eeaff14a0fbc52952b1cd6))
* plan v0.8.0 stack container drill-down ([dda412f](https://github.com/uniskela/UniHomelabDash/commit/dda412fdd22f0217dde6452ad17157521d630dc0))
* prepare v0.7.0 stack visibility release ([c4f7586](https://github.com/uniskela/UniHomelabDash/commit/c4f7586a1286b5a0cca7e6b2680b782938187f4d))
* prepare v0.8.0 stack container release ([bc21972](https://github.com/uniskela/UniHomelabDash/commit/bc21972104a1e8110735873abf402fa6ba5aa90b))
* require website updates with project changes ([77d715c](https://github.com/uniskela/UniHomelabDash/commit/77d715c6788ab802f0f157b29d0719f5601847b7))


### Miscellaneous

* force Release Please 0.9.1 after squash dropped Release-As ([4d6d339](https://github.com/uniskela/UniHomelabDash/commit/4d6d339534534d5bafe516a22fa1df9eb05cfb6a))

## [0.9.3](https://github.com/uniskela/UniHomelabDash/compare/v0.9.2...v0.9.3) (2026-09-28)


### Bug Fixes

* resolve Semgrep/npm supply-chain advisories ([#62](https://github.com/uniskela/UniHomelabDash/pull/62)) ([74bfa33](https://github.com/uniskela/UniHomelabDash/commit/74bfa332967e5112a7e9b008538dcacd065188fe))

## [0.9.2](https://github.com/uniskela/UniHomelabDash/compare/v0.9.1...v0.9.2) (2026-09-27)


### Documentation

* mark v0.9.1 as shipped after release ([#59](https://github.com/uniskela/UniHomelabDash/issues/59)) ([9c080e1](https://github.com/uniskela/UniHomelabDash/commit/9c080e1ffd99396d1dc0ab592fb510bee027ecdc))

## [0.9.1](https://github.com/uniskela/UniHomelabDash/compare/v0.9.0...v0.9.1) (2026-09-27)

### Features

* UX polish pass: consistent status colours, calmer Containers (manual Refresh, filters first, Display options on demand), restructured Settings, larger touch targets, reduced-motion support, and accessibility fixes ([#55](https://github.com/uniskela/UniHomelabDash/pull/55))

### Miscellaneous

* Add Release Please and force the 0.9.1 release after a squash merge dropped `Release-As` ([#56](https://github.com/uniskela/UniHomelabDash/pull/56), [#57](https://github.com/uniskela/UniHomelabDash/pull/57))
