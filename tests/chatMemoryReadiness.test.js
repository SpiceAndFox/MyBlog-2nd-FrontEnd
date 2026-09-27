import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { computed, createRenderer, createSSRApp, nextTick, reactive, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { createServer } from "vite";

let server;
let useChatMessaging;
let useChatHealth;
let Banner;
before(async () => {
  server = await createServer({ mode: "test", logLevel: "error", optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
  ({ useChatMessaging } = await server.ssrLoadModule("/src/views/chat/useChatMessaging.js"));
  ({ useChatHealth } = await server.ssrLoadModule("/src/views/chat/useChatHealth.js"));
  Banner = (await server.ssrLoadModule("/src/components/Chat/ChatHealthBanner.vue")).default;
});
after(async () => server?.close());

function mount(t, setup) {
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {},
    parentNode: () => null, nextSibling: () => null });
  let value;
  const app = renderer.createApp({ setup() { value = setup(); return () => null; } });
  app.mount({});
  t.after(() => app.unmount());
  return value;
}

function messaging(t, stream = false) {
  const health = ref({ memory: { scope: { chatBlocked: false } } });
  const draft = ref("");
  const messages = reactive({ "1": [] });
  const activeSessionId = ref("1");
  const editingMessageId = ref("");
  const editingSessionId = ref("");
  const editingOriginalContent = ref("");
  const editingDraft = ref("");
  const chat = mount(t, () => useChatMessaging({ memoryHealth: health, refreshMemoryHealth: async () => {},
    settings: ref({ stream }), getComposerDraft: () => draft.value, setComposerDraft: value => { draft.value = value; },
    sessions: ref([{ id: "1", presetId: "companion" }]), messagesBySessionId: messages, activeSessionId,
    ensureMessagesLoaded: async () => {}, ensureTodaySession: async () => "1", isReadOnly: ref(false),
    bringSessionToTop() {}, upsertSession() {}, handleApiError: () => false,
    editingMessageId, editingSessionId, editingOriginalContent, editingDraft,
    isEditingActive: computed(() => Boolean(editingMessageId.value)), isEditingMessage: ref(false),
    resetEditingState() { editingMessageId.value = ""; editingSessionId.value = ""; },
  }));
  return { chat, health, draft, messages, activeSessionId };
}

test("rebuild health locks immediately with real progress, survives a session switch, and unlocks on recovery", async t => {
  const h = messaging(t);
  h.health.value = { memory: { scope: { chatBlocked: true, availability: "rebuilding",
    progress: { processedMessages: 176, totalMessages: 5615 } } } };
  await nextTick();
  assert.match(h.chat.memoryLockMessage.value, /记忆正在重建/);
  assert.match(h.chat.memoryLockMessage.value, /176\/5615/);
  await h.chat.sendMessage("must not send");
  assert.equal(h.messages["1"].length, 0);
  h.activeSessionId.value = "2";
  await nextTick();
  assert.match(h.chat.memoryLockMessage.value, /记忆正在重建/);
  h.health.value = { memory: { scope: { chatBlocked: false, availability: "ready" } } };
  await nextTick();
  assert.equal(h.chat.memoryLockMessage.value, "");
});

test("blocking rebuild warnings remain visible while ordinary background updates stay quiet", async () => {
  const ordinary = { component: "memory", status: "rebuilding", message: "记忆正在后台更新" };
  const hidden = await renderToString(createSSRApp(Banner, { warnings: [ordinary] }));
  assert.doesNotMatch(hidden, /记忆正在后台更新/);
  const shown = await renderToString(createSSRApp(Banner, { warnings: [ordinary,
    { component: "memory", status: "rebuilding", chatBlocked: true, message: "记忆正在重建，暂时无法继续对话" }] }));
  assert.match(shown, /暂时无法继续对话/);
  assert.match(shown, /等待记忆恢复/);
});

for (const stream of [false, true]) test(`coverage-pending replies keep persisted messages and reuse the original key on retry (stream=${stream})`, async t => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(options.headers["Idempotency-Key"]);
    const payload = calls.length === 1 ? { code: "CHAT_MEMORY_COVERAGE_PENDING",
      error: "记忆正在补齐上下文，请稍后重试", user_message: { id: 88, role: "user", content: "你好" } }
      : { user_message: { id: 88, role: "user", content: "你好" },
          assistant_message: { id: 89, role: "assistant", content: "回复" } };
    return new Response(calls.length > 1 && stream ? `data: ${JSON.stringify({ type: "done", ...payload })}\n\n`
      : JSON.stringify(payload), { status: calls.length === 1 ? 409 : 200 });
  });
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => "test-token" };
  t.after(() => { if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage; });
  const calls = [];
  const h = messaging(t, stream);
  await h.chat.sendMessage("你好");
  assert.equal(h.messages["1"].length, 1);
  assert.equal(h.messages["1"][0].id, "88");
  assert.equal(h.draft.value, "你好");
  assert.match(h.chat.memoryLockMessage.value, /记忆/);
  h.health.value = { memory: { scope: { chatBlocked: false } } };
  await nextTick();
  await h.chat.sendMessage("你好");
  assert.equal(calls.length, 2);
  assert.equal(calls[0], calls[1]);
  assert.equal(h.messages["1"].filter(message => message.role === "user").length, 1);
  assert.equal(h.messages["1"].filter(message => message.role === "assistant").length, 1);
});

for (const stream of [false, true]) test(`a committed edit survives coverage-pending regeneration and retries without duplicating the edited message (stream=${stream})`, async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(options);
    const user_message = { id: 88, role: "user", content: "修改后的消息" };
    if (options.method === "PATCH") return new Response(JSON.stringify({ user_message,
      regeneration: { idempotencyKey: "edit-original-key" } }), { status: 409 });
    if (calls.length === 2) return new Response(JSON.stringify({ code: "CHAT_MEMORY_COVERAGE_PENDING",
      error: "记忆正在补齐上下文，请稍后重试", user_message }), { status: 409 });
    const payload = { user_message, assistant_message: { id: 91, role: "assistant", content: "修改后的回复" } };
    return new Response(stream ? `data: ${JSON.stringify({ type: "done", ...payload })}\n\n` : JSON.stringify(payload));
  });
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => "test-token" };
  t.after(() => { if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage; });
  const h = messaging(t, stream);
  h.messages["1"] = [{ id: "88", role: "user", content: "原来的消息" },
    { id: "89", role: "assistant", content: "原来的回复" }];
  h.chat.requestEditMessage(h.messages["1"][0]);
  h.chat.updateEditDraft("修改后的消息");
  await h.chat.commitEditMessage("88");
  assert.equal(calls.length, 2);
  assert.deepEqual(h.messages["1"].map(message => message.content), ["修改后的消息"]);
  assert.equal(h.draft.value, "修改后的消息");
  assert.match(h.chat.memoryLockMessage.value, /记忆/);
  h.health.value = { memory: { scope: { chatBlocked: false } } };
  await nextTick();
  await h.chat.sendMessage("修改后的消息");
  assert.equal(calls[1].headers["Idempotency-Key"], "edit-original-key");
  assert.equal(calls[2].headers["Idempotency-Key"], "edit-original-key");
  assert.deepEqual(h.messages["1"].map(message => message.content), ["修改后的消息", "修改后的回复"]);
});

test("health polling preserves the blocked flag and continues after a transient failure", async t => {
  const saved = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage };
  const timers = [];
  globalThis.window = { setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {} };
  globalThis.document = Object.assign(new EventTarget(), { hidden: false });
  globalThis.localStorage = { getItem: () => "test-token" };
  let fail = false;
  let blocked = true;
  t.mock.method(globalThis, "fetch", async () => {
    if (fail) throw new Error("offline");
    return new Response(JSON.stringify({ memory: { scope: { chatBlocked: blocked } }, warnings: blocked
      ? [{ component: "memory", status: "rebuilding", chatBlocked: true, message: "等待重建" }] : [] }));
  });
  const health = mount(t, () => useChatHealth({ activePresetId: ref("companion"), handleApiError() {} }));
  t.after(() => { for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  } });
  await health.refresh();
  assert.equal(health.warnings.value[0].chatBlocked, true);
  assert.equal(timers.at(-1).ms, 3000);
  fail = true;
  await health.refresh();
  assert.equal(health.health.value.memory.scope.chatBlocked, true);
  assert.equal(timers.at(-1).ms, 30000);
  fail = false; blocked = false;
  await health.refresh();
  assert.equal(health.health.value.memory.scope.chatBlocked, false);
});
