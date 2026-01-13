"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\nasync function register() {\n    if (true) {\n        const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;\n        if (proxyUrl) {\n            const { setGlobalDispatcher, ProxyAgent } = await __webpack_require__.e(/*! import() */ \"vendor-chunks/undici\").then(__webpack_require__.t.bind(__webpack_require__, /*! undici */ \"(instrument)/./node_modules/undici/index.js\", 19));\n            const proxyAgent = new ProxyAgent(proxyUrl);\n            setGlobalDispatcher(proxyAgent);\n            console.log(`[Proxy] Global proxy configured: ${proxyUrl}`);\n        }\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxlQUFlQTtJQUNwQixJQUFJQyxJQUFxQyxFQUFFO1FBQ3pDLE1BQU1HLFdBQVdILFFBQVFDLEdBQUcsQ0FBQ0csV0FBVyxJQUFJSixRQUFRQyxHQUFHLENBQUNJLFdBQVcsSUFBSUwsUUFBUUMsR0FBRyxDQUFDSyxVQUFVLElBQUlOLFFBQVFDLEdBQUcsQ0FBQ00sVUFBVTtRQUV2SCxJQUFJSixVQUFVO1lBQ1osTUFBTSxFQUFFSyxtQkFBbUIsRUFBRUMsVUFBVSxFQUFFLEdBQUcsTUFBTSxvTEFBZ0I7WUFDbEUsTUFBTUMsYUFBYSxJQUFJRCxXQUFXTjtZQUNsQ0ssb0JBQW9CRTtZQUNwQkMsUUFBUUMsR0FBRyxDQUFDLENBQUMsaUNBQWlDLEVBQUVULFVBQVU7UUFDNUQ7SUFDRjtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMva2Vrby9Eb2N1bWVudHMv576O6aOf572R56uZbmV3L2luc3RydW1lbnRhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5ORVhUX1JVTlRJTUUgPT09ICdub2RlanMnKSB7XG4gICAgY29uc3QgcHJveHlVcmwgPSBwcm9jZXNzLmVudi5IVFRQU19QUk9YWSB8fCBwcm9jZXNzLmVudi5odHRwc19wcm94eSB8fCBwcm9jZXNzLmVudi5IVFRQX1BST1hZIHx8IHByb2Nlc3MuZW52Lmh0dHBfcHJveHk7XG5cbiAgICBpZiAocHJveHlVcmwpIHtcbiAgICAgIGNvbnN0IHsgc2V0R2xvYmFsRGlzcGF0Y2hlciwgUHJveHlBZ2VudCB9ID0gYXdhaXQgaW1wb3J0KCd1bmRpY2knKTtcbiAgICAgIGNvbnN0IHByb3h5QWdlbnQgPSBuZXcgUHJveHlBZ2VudChwcm94eVVybCk7XG4gICAgICBzZXRHbG9iYWxEaXNwYXRjaGVyKHByb3h5QWdlbnQpO1xuICAgICAgY29uc29sZS5sb2coYFtQcm94eV0gR2xvYmFsIHByb3h5IGNvbmZpZ3VyZWQ6ICR7cHJveHlVcmx9YCk7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOlsicmVnaXN0ZXIiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9SVU5USU1FIiwicHJveHlVcmwiLCJIVFRQU19QUk9YWSIsImh0dHBzX3Byb3h5IiwiSFRUUF9QUk9YWSIsImh0dHBfcHJveHkiLCJzZXRHbG9iYWxEaXNwYXRjaGVyIiwiUHJveHlBZ2VudCIsInByb3h5QWdlbnQiLCJjb25zb2xlIiwibG9nIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ }),

/***/ "node:assert":
/*!******************************!*\
  !*** external "node:assert" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:assert");

/***/ }),

/***/ "node:async_hooks":
/*!***********************************!*\
  !*** external "node:async_hooks" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:async_hooks");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ "node:console":
/*!*******************************!*\
  !*** external "node:console" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("node:console");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "node:diagnostics_channel":
/*!*******************************************!*\
  !*** external "node:diagnostics_channel" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = require("node:diagnostics_channel");

/***/ }),

/***/ "node:dns":
/*!***************************!*\
  !*** external "node:dns" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("node:dns");

/***/ }),

/***/ "node:events":
/*!******************************!*\
  !*** external "node:events" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:events");

/***/ }),

/***/ "node:fs/promises":
/*!***********************************!*\
  !*** external "node:fs/promises" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:fs/promises");

/***/ }),

/***/ "node:http":
/*!****************************!*\
  !*** external "node:http" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:http");

/***/ }),

/***/ "node:http2":
/*!*****************************!*\
  !*** external "node:http2" ***!
  \*****************************/
/***/ ((module) => {

module.exports = require("node:http2");

/***/ }),

/***/ "node:net":
/*!***************************!*\
  !*** external "node:net" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("node:net");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ "node:perf_hooks":
/*!**********************************!*\
  !*** external "node:perf_hooks" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("node:perf_hooks");

/***/ }),

/***/ "node:querystring":
/*!***********************************!*\
  !*** external "node:querystring" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:querystring");

/***/ }),

/***/ "node:sqlite":
/*!******************************!*\
  !*** external "node:sqlite" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:sqlite");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:stream");

/***/ }),

/***/ "node:timers":
/*!******************************!*\
  !*** external "node:timers" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:timers");

/***/ }),

/***/ "node:tls":
/*!***************************!*\
  !*** external "node:tls" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("node:tls");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ "node:util/types":
/*!**********************************!*\
  !*** external "node:util/types" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("node:util/types");

/***/ }),

/***/ "node:worker_threads":
/*!**************************************!*\
  !*** external "node:worker_threads" ***!
  \**************************************/
/***/ ((module) => {

module.exports = require("node:worker_threads");

/***/ }),

/***/ "node:zlib":
/*!****************************!*\
  !*** external "node:zlib" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();