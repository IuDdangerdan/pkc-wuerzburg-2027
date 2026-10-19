import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source = fs.readFileSync("public/theme.js", "utf8");
function setup(saved, blocked = false) {
  const classes = new Set(),
    events = new Map(),
    storage = new Map(saved ? [["pkc-theme", saved]] : []);
  const createButton = () => ({
    attributes: {},
    innerHTML: "",
    setAttribute(key, value) {
      this.attributes[key] = value;
    },
  });
  let button = createButton();
  const context = vm.createContext({
    document: {
      body: {
        classList: {
          toggle(name, on) {
            on ? classes.add(name) : classes.delete(name);
          },
        },
      },
      querySelector() {
        return button;
      },
      addEventListener(name, fn) {
        events.set(name, fn);
      },
    },
    localStorage: {
      getItem(key) {
        if (blocked) throw Error("Storage unavailable");
        return storage.get(key);
      },
      setItem(key, value) {
        if (blocked) throw Error("Storage unavailable");
        storage.set(key, value);
      },
    },
  });
  vm.runInContext(source, context);
  return {
    classes,
    storage,
    get button() {
      return button;
    },
    replaceButton() {
      button = createButton();
    },
    click() {
      events.get("click")({
        target: {
          closest(selector) {
            return selector === "#theme" ? button : null;
          },
        },
      });
    },
    ready() {
      events.get("DOMContentLoaded")();
    },
    sync() {
      vm.runInContext("syncThemeControl()", context);
    },
  };
}
const app = setup("dark");
assert.ok(app.classes.has("dark"));
assert.equal(app.button.attributes["aria-pressed"], "true");
const oldButton = app.button;
app.replaceButton();
app.click();
assert.ok(!app.classes.has("dark"));
assert.equal(app.button.attributes["aria-label"], "Dunkelmodus einschalten");
assert.equal(app.storage.get("pkc-theme"), "light");
assert.notEqual(app.button, oldButton);
app.click();
app.sync();
assert.ok(app.classes.has("dark"));
assert.equal(app.storage.get("pkc-theme"), "dark");
app.replaceButton();
app.ready();
assert.equal(app.button.attributes["aria-pressed"], "true");
const reloaded = setup(app.storage.get("pkc-theme"));
assert.ok(reloaded.classes.has("dark"));
const blocked = setup(null, true);
blocked.click();
blocked.sync();
assert.ok(blocked.classes.has("dark"));
blocked.click();
assert.ok(!blocked.classes.has("dark"));
console.log(
  "PASS: theme switch survives header replacement, restores preference after reload, and works without browser storage.",
);
