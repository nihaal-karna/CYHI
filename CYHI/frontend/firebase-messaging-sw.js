/* global firebase */
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBN0U2f8SWd3DVP7z_O-rEl_mwgPrCPgL8",
  authDomain: "cyhi-daf42.firebaseapp.com",
  projectId: "cyhi-daf42",
  storageBucket: "cyhi-daf42.firebasestorage.app",
  messagingSenderId: "374526862670",
  appId: "1:374526862670:web:f01840904dd26a38d9ea1f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const title = data.title || "New Student Doubt";
  const options = {
    body: data.body || "A student raised a new doubt.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.doubtId ? `cyhi-doubt-${data.doubtId}` : "cyhi-new-doubt",
    renotify: false,
    data: {
      doubtId: data.doubtId || "",
      classId: data.classId || "",
      url: data.url || `/professor.html?doubt=${encodeURIComponent(data.doubtId || "")}#professor`
    }
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/professor.html#professor";
  const absoluteTarget = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            return client.navigate(absoluteTarget).then(() => client.focus());
          }
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(absoluteTarget) : undefined;
    })
  );
});
