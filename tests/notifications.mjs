import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
function setup() {
  const nodes = new Map(),
    timers = new Map(),
    cards = [];
  let serial = 0,
    observer = null,
    send = async () => ({ ok: true });
  const node = (key) => {
    if (!nodes.has(key))
      nodes.set(key, {
        hidden: false,
        textContent: "",
        innerHTML: "",
        dataset: {},
        classes: new Set(),
        classList: {
          toggle(name, on) {
            on
              ? nodes.get(key).classes.add(name)
              : nodes.get(key).classes.delete(name);
          },
        },
        querySelector(s) {
          return node(key + " " + s);
        },
      });
    return nodes.get(key);
  };
  const state = {
    me: { id: "a", preview: false },
    notifications: [
      { id: "one", seen: 0, message: "Erste Nachricht", created: "2026-10-19" },
      {
        id: "two",
        seen: 0,
        message: "Zweite Nachricht",
        created: "2026-10-19",
      },
    ],
  };
  for (const n of state.notifications) {
    const card = node(n.id);
    card.dataset.notificationId = n.id;
    cards.push(card);
  }
  const context = vm.createContext({
    state,
    location: { hash: "#notifications" },
    document: {
      visibilityState: "visible",
      querySelector: node,
      querySelectorAll(s) {
        return s === "[data-notification-id]" ? cards : [];
      },
    },
    $: node,
    title: () => "",
    esc: String,
    fmt: String,
    post: (data) => send(data),
    setTimeout(fn) {
      const id = ++serial;
      timers.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    IntersectionObserver: class {
      constructor(fn) {
        this.callback = fn;
        this.targets = [];
        observer = this;
      }
      observe(card) {
        this.targets.push(card);
      }
      unobserve(card) {
        this.targets = this.targets.filter((c) => c !== card);
      }
      disconnect() {
        this.targets = [];
      }
    },
  });
  vm.runInContext(fs.readFileSync("public/notifications.js", "utf8"), context);
  return {
    state,
    node,
    cards,
    timers,
    context,
    setSend(fn) {
      send = fn;
    },
    get observer() {
      return observer;
    },
  };
}
const app = setup();
let resolve;
app.setSend(() => new Promise((r) => (resolve = r)));
const pending = app.context.markNotificationsRead(["one"]);
assert.equal(app.state.notifications[0].seen, 0);
assert.equal(app.node("#mobileUnread").hidden, false);
resolve({ ok: true });
await pending;
assert.equal(app.state.notifications[0].seen, 1);
assert.equal(app.state.notifications[1].seen, 0);
assert.equal(app.node("one .notification-read-label").textContent, "Gelesen");
assert.equal(app.node("two .notification-read-label").textContent, "Neu");
assert.equal(app.node("#mobileUnread").hidden, false);
app.setSend(async () => {
  throw Error("offline");
});
await app.context.markNotificationsRead(["two"]);
assert.equal(app.state.notifications[1].seen, 0);
assert.ok(
  app.node("#notificationReadStatus").textContent.includes("nicht gespeichert"),
);
app.setSend(async () => ({ ok: true }));
await app.context.markNotificationsRead(["two"]);
assert.equal(app.node("#mobileUnread").hidden, true);
assert.equal(
  app.node('#nav a[href="#notifications"] .unread-dot').hidden,
  true,
);
assert.equal(app.node("#notificationCount").textContent, "Alle gelesen");
const race = setup();
race.setSend(() => new Promise((r) => (resolve = r)));
const reading = race.context.markNotificationsRead(["one", "two"]);
race.state.notifications.push({ id: "new-arrival", seen: 0 });
resolve({ ok: true });
await reading;
assert.equal(race.state.notifications[2].seen, 0);
assert.equal(race.node("#mobileUnread").hidden, false);
const visible = setup();
visible.context.watchVisibleNotifications();
visible.observer.callback([
  { target: visible.cards[0], isIntersecting: true, intersectionRatio: 0.5 },
]);
assert.equal(visible.timers.size, 0);
visible.observer.callback([
  { target: visible.cards[0], isIntersecting: true, intersectionRatio: 0.8 },
]);
assert.equal(visible.timers.size, 1);
visible.context.stopNotificationReading();
assert.equal(visible.timers.size, 0);
assert.equal(visible.observer.targets.length, 0);
const preview = setup();
preview.state.me.preview = true;
preview.setSend(() => {
  throw Error("Preview must not write");
});
await preview.context.markNotificationsRead(["one"]);
preview.context.watchVisibleNotifications();
assert.equal(preview.state.notifications[0].seen, 0);
assert.equal(preview.observer, null);
console.log(
  "PASS: confirmed read state updates cards and dots; failures and new arrivals stay unread; visibility timers clean up; preview is read-only.",
);
