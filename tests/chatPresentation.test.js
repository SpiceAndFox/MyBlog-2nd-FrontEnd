import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRenderer, createSSRApp, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { createServer } from "vite";

let server;
let dates;
let MessageBubble;
let useChatSessions;

before(async () => {
  server = await createServer({
    mode: "test",
    logLevel: "error",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
  dates = await server.ssrLoadModule("/src/components/Chat/utils/sessionDate.js");
  MessageBubble = (await server.ssrLoadModule("/src/components/Chat/ChatMessageBubble.vue")).default;
  ({ useChatSessions } = await server.ssrLoadModule("/src/views/chat/useChatSessions.js"));
});

after(async () => server?.close());

test("date labels use today/yesterday across month, year and leap-day boundaries", () => {
  for (const [today, yesterday] of [
    ["2026-09-13", "2026-09-12"],
    ["2026-09-01", "2026-08-31"],
    ["2026-01-01", "2025-12-31"],
    ["2024-03-01", "2024-02-29"],
  ]) {
    assert.equal(dates.formatSessionDateLabel(today, today), "今天");
    assert.equal(dates.formatSessionDateLabel(yesterday, today), "昨天");
  }
  assert.equal(dates.formatSessionDateLabel("2026-01-16", "2026-09-13"), "2026 年 1 月 16 日");
  assert.equal(dates.formatSessionDateLabel("2025-12-22", "2026-09-13"), "2025 年 12 月 22 日");
  assert.equal(dates.formatSessionDateLabel("未命名", "2026-09-13"), "未命名");
});

test("the configured Shanghai day changes at midnight, independent of browser time zone", () => {
  assert.equal(dates.formatLocalDateKey("2026-12-31T15:59:59.900Z"), "2026-12-31");
  assert.equal(dates.getMsUntilNextDayBoundary("2026-12-31T15:59:59.900Z"), 100);
  assert.equal(dates.formatLocalDateKey("2026-12-31T16:00:00Z"), "2027-01-01");
  assert.equal(dates.getMsUntilNextDayBoundary("2026-12-31T16:00:00Z"), 86_400_000);
});

function mountSessions(t, now = "2026-09-13T15:59:59.000Z") {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: new Date(now).getTime() });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = Object.assign(new EventTarget(), { setTimeout, clearTimeout });
  globalThis.document = Object.assign(new EventTarget(), { hidden: false });
  const renderer = createRenderer({
    createComment: () => ({}),
    insert() {},
    remove() {},
    parentNode: () => null,
    nextSibling: () => null,
  });
  let sessions;
  const app = renderer.createApp({
    setup() {
      sessions = useChatSessions({ activePresetId: ref("default") });
      return () => null;
    },
  });
  app.mount({});
  t.after(() => {
    app.unmount();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  return sessions;
}

test("an open conversation changes relative labels and becomes read-only at midnight", async (t) => {
  const sessions = mountSessions(t);
  sessions.sessions.value = [{ id: "today", title: "2026-09-13", presetId: "default" }];
  sessions.activeSessionId.value = "today";
  assert.equal(sessions.isActiveSessionReadOnly.value, false);
  t.mock.timers.tick(1_250);
  await nextTick();
  assert.equal(sessions.todayKey.value, "2026-09-14");
  assert.equal(dates.formatSessionDateLabel("2026-09-13", sessions.todayKey.value), "昨天");
  assert.equal(dates.formatSessionDateLabel("2026-09-12", sessions.todayKey.value), "2026 年 9 月 12 日");
  assert.equal(sessions.isActiveSessionReadOnly.value, true);
  assert.equal(sessions.activeSessionId.value, "today", "rollover must not discard the conversation being read");
});

test("returning from a suspended tab refreshes the day without waiting for its old timer", (t) => {
  const sessions = mountSessions(t);
  globalThis.document.hidden = true;
  t.mock.timers.setTime(new Date("2026-09-15T00:00:00Z").getTime());
  globalThis.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(sessions.todayKey.value, "2026-09-13");
  globalThis.document.hidden = false;
  globalThis.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(sessions.todayKey.value, "2026-09-15");
  t.mock.timers.setTime(new Date("2026-09-16T00:00:00Z").getTime());
  globalThis.window.dispatchEvent(new Event("focus"));
  assert.equal(sessions.todayKey.value, "2026-09-16");
});

test("the active preset archive stays in date order after an older session is updated", (t) => {
  const sessions = mountSessions(t);
  sessions.sessions.value = [
    { id: "old", title: "2025-12-22", presetId: "default" },
    { id: "other", title: "2026-09-13", presetId: "other" },
    { id: "new", title: "2026-01-16", presetId: "default" },
    { id: "middle", title: "2026-01-15", presetId: "default" },
  ];
  sessions.bringSessionToTop("middle");
  assert.deepEqual(sessions.sessionsForActivePreset.value.map(({ id }) => id), ["new", "middle", "old"]);
  assert.equal(sessions.sessions.value[0].id, "middle", "sorting the archive must not mutate the source");
});

test("both message roles render their own profile avatar and retain accessible names", async () => {
  for (const [role, name, avatar] of [
    ["user", "小林", "/user-avatar.jpg"],
    ["assistant", "小伴", "/assistant-avatar.jpg"],
  ]) {
    const html = await renderToString(createSSRApp(MessageBubble, {
      message: { role, content: "你好", createdAt: "2026-09-13T12:00:00Z" },
      userProfile: { username: "小林", avatarUrl: "/user-avatar.jpg" },
      assistantProfile: { name: "小伴", avatarUrl: "/assistant-avatar.jpg" },
    }));
    assert.ok(html.includes(`aria-label="${name}"`));
    assert.ok(html.includes(`src="${avatar}"`));
    assert.equal((html.match(/<img\b/g) || []).length, 1);
  }
});

test("missing profile images fall back to a visible initial for either role", async () => {
  for (const role of ["user", "assistant"]) {
    const html = await renderToString(createSSRApp(MessageBubble, {
      message: { role, content: "你好" },
      userProfile: { username: "小林" },
      assistantProfile: { name: "小伴" },
    }));
    assert.doesNotMatch(html, /<img\b/);
    assert.match(html, />小<\/span>/);
  }
});
