self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {
      title: "Circle",
      message: event.data ? event.data.text() : ""
    };
  }

  const title = data.title || "Circle";
  const page = data.page || "home";

  const options = {
    body: data.message || "",
    tag: data.tag || `circle-notification-${data.id || Date.now()}`,
    renotify: true,
    data: {
      id: data.id || null,
      page
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const page =
    event.notification.data?.page || "home";

  const target = new URL(
    `./#${page}`,
    self.registration.scope
  );

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {

      for (const client of clientList) {

        if ("focus" in client) {

          try {
            client.postMessage({
              type: "circle-open-notification",
              page
            });
          } catch (_) {}

          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(target.href);
      }
    })
  );
});
