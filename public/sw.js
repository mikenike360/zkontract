if(!self.define){let e,s={};const c=(c,n)=>(c=new URL(c+".js",n).href,s[c]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=s,document.head.appendChild(e)}else e=c,importScripts(c),s()})).then((()=>{let e=s[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e})));self.define=(n,a)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let t={};const r=e=>c(e,i),d={module:{uri:i},exports:t,require:r};s[i]=Promise.all(n.map((e=>d[e]||r(e)))).then((e=>(a(...e),t)))}}define(["./workbox-1bb06f5e"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/BIcF5_Uib11FQrF2KBQ0-/_buildManifest.js",revision:"f7b1d590f5b33d30e8742c874e72fd5f"},{url:"/_next/static/BIcF5_Uib11FQrF2KBQ0-/_middlewareManifest.js",revision:"fb2823d66b3e778e04a3f681d0d2fb19"},{url:"/_next/static/BIcF5_Uib11FQrF2KBQ0-/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/131-2697098176d670ce.js",revision:"2697098176d670ce"},{url:"/_next/static/chunks/152-e4e9317e91a3dbdd.js",revision:"e4e9317e91a3dbdd"},{url:"/_next/static/chunks/186.744e06d21d0c9bd4.js",revision:"744e06d21d0c9bd4"},{url:"/_next/static/chunks/266-d6b370dec183e9f3.js",revision:"d6b370dec183e9f3"},{url:"/_next/static/chunks/28.f5e8470999e5afb0.js",revision:"f5e8470999e5afb0"},{url:"/_next/static/chunks/596-23d5ccc8d98dc0f6.js",revision:"23d5ccc8d98dc0f6"},{url:"/_next/static/chunks/632cba62-6680edf3478f2715.js",revision:"6680edf3478f2715"},{url:"/_next/static/chunks/636-18308ebdea279202.js",revision:"18308ebdea279202"},{url:"/_next/static/chunks/77-4a0844ab38f476a1.js",revision:"4a0844ab38f476a1"},{url:"/_next/static/chunks/966-d0325c4293f3afc3.js",revision:"d0325c4293f3afc3"},{url:"/_next/static/chunks/999.98ad859f77c7e866.js",revision:"98ad859f77c7e866"},{url:"/_next/static/chunks/framework-f06cfe3d091bf6bf.js",revision:"f06cfe3d091bf6bf"},{url:"/_next/static/chunks/main-6931c80d1d951dd4.js",revision:"6931c80d1d951dd4"},{url:"/_next/static/chunks/pages/404-7b495e2c3cfc32a4.js",revision:"7b495e2c3cfc32a4"},{url:"/_next/static/chunks/pages/_app-5df4489a442db120.js",revision:"5df4489a442db120"},{url:"/_next/static/chunks/pages/_error-81838cdbdba28a6f.js",revision:"81838cdbdba28a6f"},{url:"/_next/static/chunks/pages/admin-59c2b9fa4cf29583.js",revision:"59c2b9fa4cf29583"},{url:"/_next/static/chunks/pages/board-6dc003094b119335.js",revision:"6dc003094b119335"},{url:"/_next/static/chunks/pages/bounty/%5Bid%5D-f25bd8bef2d88e9f.js",revision:"f25bd8bef2d88e9f"},{url:"/_next/static/chunks/pages/deploy-303694a69e1c4363.js",revision:"303694a69e1c4363"},{url:"/_next/static/chunks/pages/index-fd22f42f0b657c67.js",revision:"fd22f42f0b657c67"},{url:"/_next/static/chunks/pages/post-bounty-83f65dcb9275dc36.js",revision:"83f65dcb9275dc36"},{url:"/_next/static/chunks/pages/user-dashboard-000cc1f148d08418.js",revision:"000cc1f148d08418"},{url:"/_next/static/chunks/polyfills-5cd94c89d3acac5f.js",revision:"99442aec5788bccac9b2f0ead2afdd6b"},{url:"/_next/static/chunks/webpack-b392bd1d8d8e47c6.js",revision:"b392bd1d8d8e47c6"},{url:"/_next/static/css/33d5df2c750eef27.css",revision:"33d5df2c750eef27"},{url:"/_next/static/css/390d4f65ce006251.css",revision:"390d4f65ce006251"},{url:"/_next/static/css/f4ce3a239cae13c2.css",revision:"f4ce3a239cae13c2"},{url:"/android-chrome-192x192.png",revision:"e80aefa40dd8ce738ab1743152a6978e"},{url:"/android-chrome-512x512.png",revision:"012ba10f1994ba69771df6302e6e7a1c"},{url:"/apple-touch-icon.png",revision:"e80aefa40dd8ce738ab1743152a6978e"},{url:"/contract.jpg",revision:"c19305c1dea103b5d662295d60d2503a"},{url:"/favicon-16x16.png",revision:"815d6d4bfe1d03636e86757253cf29e5"},{url:"/favicon-32x32.png",revision:"85b1d72a89b5f0e7cc8f6ac052ac2d54"},{url:"/favicon.ico",revision:"43db90084175b9b3f595c505de98196f"},{url:"/site.webmanifest",revision:"053100cb84a50d2ae7f5492f7dd7f25e"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:c,state:n})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
