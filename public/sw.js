self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Intentionally no fetch handler: pages, images, APIs and advertisements always
// use the network so impression and delivery behavior remains unchanged.
