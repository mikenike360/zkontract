if(!self.define){let e,s={};const c=(c,n)=>(c=new URL(c+".js",n).href,s[c]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=s,document.head.appendChild(e)}else e=c,importScripts(c),s()})).then((()=>{let e=s[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e})));self.define=(n,a)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let i={};const r=e=>c(e,t),d={module:{uri:t},exports:i,require:r};s[t]=Promise.all(n.map((e=>d[e]||r(e)))).then((e=>(a(...e),i)))}}define(["./workbox-1bb06f5e"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/OpTlE8D4TAYQ2yyoTXpX0/_buildManifest.js",revision:"8c80e0783dfbdab291ff4833d2507095"},{url:"/_next/static/OpTlE8D4TAYQ2yyoTXpX0/_middlewareManifest.js",revision:"fb2823d66b3e778e04a3f681d0d2fb19"},{url:"/_next/static/OpTlE8D4TAYQ2yyoTXpX0/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/131-2697098176d670ce.js",revision:"2697098176d670ce"},{url:"/_next/static/chunks/152-e4e9317e91a3dbdd.js",revision:"e4e9317e91a3dbdd"},{url:"/_next/static/chunks/186.744e06d21d0c9bd4.js",revision:"744e06d21d0c9bd4"},{url:"/_next/static/chunks/210-f33c5f3df410b6a3.js",revision:"f33c5f3df410b6a3"},{url:"/_next/static/chunks/266-d6b370dec183e9f3.js",revision:"d6b370dec183e9f3"},{url:"/_next/static/chunks/28.b885fe065423824c.js",revision:"b885fe065423824c"},{url:"/_next/static/chunks/569-18675ded1660e3c7.js",revision:"18675ded1660e3c7"},{url:"/_next/static/chunks/596-23d5ccc8d98dc0f6.js",revision:"23d5ccc8d98dc0f6"},{url:"/_next/static/chunks/632cba62-6680edf3478f2715.js",revision:"6680edf3478f2715"},{url:"/_next/static/chunks/636-18308ebdea279202.js",revision:"18308ebdea279202"},{url:"/_next/static/chunks/893-bb0cb304165fac47.js",revision:"bb0cb304165fac47"},{url:"/_next/static/chunks/966-d0325c4293f3afc3.js",revision:"d0325c4293f3afc3"},{url:"/_next/static/chunks/999.98ad859f77c7e866.js",revision:"98ad859f77c7e866"},{url:"/_next/static/chunks/framework-f06cfe3d091bf6bf.js",revision:"f06cfe3d091bf6bf"},{url:"/_next/static/chunks/main-6931c80d1d951dd4.js",revision:"6931c80d1d951dd4"},{url:"/_next/static/chunks/pages/404-271a1cec7fbac4c5.js",revision:"271a1cec7fbac4c5"},{url:"/_next/static/chunks/pages/_app-eee56071b504b548.js",revision:"eee56071b504b548"},{url:"/_next/static/chunks/pages/_error-81838cdbdba28a6f.js",revision:"81838cdbdba28a6f"},{url:"/_next/static/chunks/pages/admin-59c2b9fa4cf29583.js",revision:"59c2b9fa4cf29583"},{url:"/_next/static/chunks/pages/board-2b3fb62080171699.js",revision:"2b3fb62080171699"},{url:"/_next/static/chunks/pages/bounty/%5Bid%5D-e875216ecc410e60.js",revision:"e875216ecc410e60"},{url:"/_next/static/chunks/pages/debug-s3-03280fe5b0b28ffb.js",revision:"03280fe5b0b28ffb"},{url:"/_next/static/chunks/pages/deploy-f80ada0cb923d824.js",revision:"f80ada0cb923d824"},{url:"/_next/static/chunks/pages/fetch-9b5c54313e379c6a.js",revision:"9b5c54313e379c6a"},{url:"/_next/static/chunks/pages/index-5ed4a3062c56d954.js",revision:"5ed4a3062c56d954"},{url:"/_next/static/chunks/pages/post-bounty-b3eb205e073a2b15.js",revision:"b3eb205e073a2b15"},{url:"/_next/static/chunks/pages/test-bounty-654fb2062c676541.js",revision:"654fb2062c676541"},{url:"/_next/static/chunks/pages/test-transfer-bcc5914be9aa5e99.js",revision:"bcc5914be9aa5e99"},{url:"/_next/static/chunks/pages/user-dashboard-df39ab8bbf72b782.js",revision:"df39ab8bbf72b782"},{url:"/_next/static/chunks/polyfills-5cd94c89d3acac5f.js",revision:"99442aec5788bccac9b2f0ead2afdd6b"},{url:"/_next/static/chunks/webpack-9acf8228dc9b92f1.js",revision:"9acf8228dc9b92f1"},{url:"/_next/static/css/390d4f65ce006251.css",revision:"390d4f65ce006251"},{url:"/_next/static/css/7daf39ff6cb1a32f.css",revision:"7daf39ff6cb1a32f"},{url:"/_next/static/css/f4ce3a239cae13c2.css",revision:"f4ce3a239cae13c2"},{url:"/android-chrome-192x192.png",revision:"e80aefa40dd8ce738ab1743152a6978e"},{url:"/android-chrome-512x512.png",revision:"012ba10f1994ba69771df6302e6e7a1c"},{url:"/apple-touch-icon.png",revision:"e80aefa40dd8ce738ab1743152a6978e"},{url:"/contract.jpg",revision:"c19305c1dea103b5d662295d60d2503a"},{url:"/favicon-16x16.png",revision:"815d6d4bfe1d03636e86757253cf29e5"},{url:"/favicon-32x32.png",revision:"85b1d72a89b5f0e7cc8f6ac052ac2d54"},{url:"/favicon.ico",revision:"43db90084175b9b3f595c505de98196f"},{url:"/site.webmanifest",revision:"053100cb84a50d2ae7f5492f7dd7f25e"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:c,state:n})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
