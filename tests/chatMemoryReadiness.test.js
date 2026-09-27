import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { computed, createRenderer, createSSRApp, nextTick, reactive, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { createServer } from "vite";

let server;
let useChatMessaging;
let useChatHealth;
let Banner;
let Panel;
let mapMessage;
before(async () => {
  server = await createServer({ mode: "test", logLevel: "error", optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
  ({ useChatMessaging } = await server.ssrLoadModule("/src/views/chat/useChatMessaging.js"));
  ({ useChatHealth } = await server.ssrLoadModule("/src/views/chat/useChatHealth.js"));
  Banner = (await server.ssrLoadModule("/src/components/Chat/ChatHealthBanner.vue")).default;
  Panel = (await server.ssrLoadModule("/src/components/Chat/ChatConversationPanel.vue")).default;
  ({ mapMessage } = await server.ssrLoadModule("/src/views/chat/mappers.js"));
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
  const isReadOnly = ref(false);
  const chat = mount(t, () => useChatMessaging({ memoryHealth: health, refreshMemoryHealth: async () => {},
    settings: ref({ stream }), getComposerDraft: () => draft.value, setComposerDraft: value => { draft.value = value; },
    sessions: ref([{ id: "1", presetId: "companion" }]), messagesBySessionId: messages, activeSessionId,
    ensureMessagesLoaded: async () => {}, ensureTodaySession: async () => "1", isReadOnly,
    bringSessionToTop() {}, upsertSession() {}, handleApiError: () => false,
    editingMessageId, editingSessionId, editingOriginalContent, editingDraft,
    isEditingActive: computed(() => Boolean(editingMessageId.value)), isEditingMessage: ref(false),
    resetEditingState() { editingMessageId.value = ""; editingSessionId.value = ""; },
  }));
  return { chat, health, draft, messages, activeSessionId, isReadOnly };
}

function auth(t) {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => "test-token" };
  t.after(() => { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; });
}

const pendingMessage = () => ({ id: 88, role: "user", content: "昨天的问题", created_at: "2026-01-01T12:00:00Z",
  reply_status: "incomplete", can_resume: true });
const completedTurn = () => ({ user_message: { ...pendingMessage(), reply_status: "complete", can_resume: false },
  assistant_message: { id: 89, role: "assistant", content: "补回的回复" } });

for (const stream of [false, true]) test(`a reloaded read-only session resumes by message ID without editing or resending (stream=${stream})`, async t => {
  auth(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    const payload = completedTurn();
    return new Response(stream ? `data: ${JSON.stringify({ type: "done", ...payload })}\n\n` : JSON.stringify(payload));
  });
  const h = messaging(t, stream);
  h.isReadOnly.value = true;
  h.messages["1"] = [mapMessage(pendingMessage())];
  const original = h.messages["1"][0];
  await h.chat.resumeReply(original);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/chat/sessions/1/messages/88/resume");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(JSON.parse(calls[0].options.body).content, undefined);
  assert.equal(calls[0].options.headers["Idempotency-Key"], undefined);
  assert.equal(original.createdAt, "2026-01-01T12:00:00Z");
  assert.equal(original.content, "昨天的问题");
  assert.equal(original.canResume, false);
  assert.equal(original.replyInFlight, false);
  assert.deepEqual(h.messages["1"].map(message => message.id), ["88", "89"]);
  assert.equal(h.chat.isSending.value, false);
});

test("double-clicking resume sends only one request and preserves the current composer draft", async t => {
  auth(t);
  const pending = Promise.withResolvers();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; await pending.promise; return new Response(JSON.stringify(completedTurn())); });
  const h = messaging(t);
  h.messages["1"] = [mapMessage(pendingMessage())];
  h.draft.value = "今天的新草稿";
  const first = h.chat.resumeReply(h.messages["1"][0]);
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.equal(calls, 1);
  assert.equal(h.chat.resumingMessageId.value, "88");
  assert.equal(h.messages["1"][0].replyInFlight, true);
  pending.resolve();
  await first;
  assert.equal(h.draft.value, "今天的新草稿");
});

test("resume remains available after coverage timeout and unlocks when memory recovers", async t => {
  auth(t);
  let ready = false, posts = 0;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (!options.method) return new Response(JSON.stringify({ messages: [pendingMessage()] }));
    posts++;
    return new Response(JSON.stringify(ready ? completedTurn() : { code: "CHAT_MEMORY_COVERAGE_PENDING", error: "等待记忆恢复",
      user_message: pendingMessage() }), { status: ready ? 200 : 409 });
  });
  const h = messaging(t);
  h.isReadOnly.value = true;
  h.messages["1"] = [mapMessage(pendingMessage())];
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.equal(h.messages["1"].length, 1);
  assert.equal(h.messages["1"][0].canResume, true);
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.equal(posts, 1);
  ready = true;
  h.health.value = { memory: { scope: { chatBlocked: false } } };
  await nextTick();
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.equal(posts, 2);
  assert.equal(h.messages["1"].length, 2);
});

test("a streaming retry accepts the server's JSON replay without an empty assistant bubble", async t => {
  auth(t);
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ ...completedTurn(), idempotent_replay: true }),
    { headers: { "Content-Type": "application/json" } }));
  const h = messaging(t, true);
  h.messages["1"] = [mapMessage(pendingMessage())];
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.deepEqual(h.messages["1"].map(message => message.content), ["昨天的问题", "补回的回复"]);
});

for (const errorFrame of [false, true]) test(`interrupted SSE never marks a partial reply as saved (error frame=${errorFrame})`, async t => {
  auth(t);
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (!options.method) throw new Error("offline");
    return new Response(`data: ${JSON.stringify({ type: "delta", delta: "未完成的片段" })}\n\n`
      + (errorFrame ? `data: ${JSON.stringify({ type: "error", error: "服务中断" })}\n\n` : ""));
  });
  const h = messaging(t, true);
  h.messages["1"] = [mapMessage(pendingMessage())];
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.equal(h.messages["1"].length, 1);
  assert.equal(h.messages["1"][0].canResume, true);
  assert.equal(h.messages["1"][0].replyStatus, "incomplete");
  assert.match(h.messages["1"][0].replyError, /中断/);
  assert.equal(h.messages["1"][0].replyInFlight, false);
  assert.equal(h.chat.isStreaming.value, false);
});

test("a lost done event reloads the server's committed reply instead of offering another generation", async t => {
  auth(t);
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (options.method) return new Response(`data: ${JSON.stringify({ type: "delta", delta: "片段" })}\n\n`);
    const payload = completedTurn();
    return new Response(JSON.stringify({ messages: [payload.user_message, payload.assistant_message] }));
  });
  const h = messaging(t, true);
  h.messages["1"] = [mapMessage(pendingMessage())];
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.deepEqual(h.messages["1"].map(message => message.id), ["88", "89"]);
  assert.equal(h.messages["1"][0].canResume, false);
});

test("a stale resume button is removed when another conversation has advanced the preset", async t => {
  auth(t);
  t.mock.method(globalThis, "fetch", async (_url, options) => options.method
    ? new Response(JSON.stringify({ code: "CHAT_RESUME_NOT_LATEST", error: "已有后续对话" }), { status: 409 })
    : new Response(JSON.stringify({ messages: [{ ...pendingMessage(), can_resume: false }] })));
  const h = messaging(t);
  h.messages["1"] = [mapMessage(pendingMessage())];
  await h.chat.resumeReply(h.messages["1"][0]);
  assert.equal(h.messages["1"][0].canResume, false);
});

test("a failed ordinary send retains its persisted user message and exposes resume immediately", async t => {
  auth(t);
  t.mock.method(globalThis, "fetch", async (_url, options) => options.method
    ? new Response(JSON.stringify({ error: "provider unavailable", user_message: pendingMessage() }), { status: 500 })
    : new Response(JSON.stringify({ messages: [pendingMessage()] })));
  const h = messaging(t);
  await h.chat.sendMessage("昨天的问题");
  assert.equal(h.messages["1"].length, 1);
  assert.equal(h.messages["1"][0].canResume, true);
});

test("historical messages render a separate resume action while editing stays disabled", async () => {
  const html = await renderToString(createSSRApp(Panel, { readOnly: true, messages: [mapMessage(pendingMessage())] }));
  assert.match(html, /回复未完成/);
  assert.match(html, /class="resume-button"[^>]*>补回复/);
  assert.doesNotMatch(html, /aria-label="编辑这条消息"/);
  const blocked = await renderToString(createSSRApp(Panel, { readOnly: true, messages: [mapMessage(pendingMessage())], memoryLockMessage: "记忆正在重建" }));
  assert.match(blocked, /等待记忆恢复/);
  assert.match(blocked, /class="resume-button" disabled/);
  assert.match(blocked, /aria-label="记忆重建提示"/);
});

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
    assert.equal(h.messages["1"][0].replyInFlight, true, "initial sends and reused pending turns are generating before the response arrives");
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
  assert.equal(h.messages["1"][0].replyInFlight, false);
  assert.equal(h.draft.value, "你好");
  assert.match(h.chat.memoryLockMessage.value, /记忆/);
  h.health.value = { memory: { scope: { chatBlocked: false } } };
  await nextTick();
  await h.chat.sendMessage("你好");
  assert.equal(calls.length, 2);
  assert.equal(calls[0], calls[1]);
  assert.equal(h.messages["1"].filter(message => message.role === "user").length, 1);
  assert.equal(h.messages["1"].filter(message => message.role === "assistant").length, 1);
  assert.equal(h.messages["1"][0].replyInFlight, false);
});

for (const stream of [false, true]) test(`a committed edit survives coverage-pending regeneration and retries without duplicating the edited message (stream=${stream})`, async t => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(options);
    const user_message = { id: 88, role: "user", content: "修改后的消息" };
    if (options.method === "PATCH") {
      assert.equal(h.messages["1"][0].replyInFlight, true, "editing marks the turn as generating before awaiting the server");
      return new Response(JSON.stringify({ user_message,
        regeneration: { idempotencyKey: "edit-original-key" } }), { status: 409 });
    }
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
  assert.equal(h.messages["1"][0].replyInFlight, false);
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
