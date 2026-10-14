import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, listChatSessions, streamChatMessage } from "../src/api/chat.js";
import { getMeApi } from "../src/api/auth.js";
import { createApiErrorHandler, shouldRedirectToLogin } from "../src/views/chat/apiError.js";

const providerError = "This token has no access to model gemini-4-argon";

function setup(t, token = "site-token") {
  t.mock.method(console, "error", () => {});
  const previous = { localStorage: globalThis.localStorage, window: globalThis.window };
  const alerts = [];
  globalThis.localStorage = { getItem: () => token };
  globalThis.window = { alert: message => alerts.push(message) };
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  const redirects = [];
  const handler = createApiErrorHandler({ currentRoute: { value: { name: "Chat", fullPath: "/chat?preset=alice" } },
    push: target => redirects.push(target) });
  return { handler, alerts, redirects };
}

test("upstream API token and model errors never redirect based on their message text", t => {
  const { handler, alerts, redirects } = setup(t);
  for (const message of [providerError, "max_tokens exceeds the limit", "Unauthorized API key", "Forbidden model", "上游令牌已过期，请登录供应商控制台"]) {
    for (const status of [undefined, 400, 403, 500]) {
      assert.equal(handler(new ApiError(message, { status, code: "CHAT_MESSAGE_SEND_FAILED" }), { silent: true }), false);
    }
  }
  assert.deepEqual(redirects, []);
  assert.deepEqual(alerts, []);
  handler(new ApiError(providerError, { status: 500 }));
  assert.deepEqual(alerts, [providerError]);
});

test("actual site authentication failures still redirect and retain the return URL", async t => {
  const { handler, redirects } = setup(t, null);
  t.mock.method(globalThis, "fetch", () => assert.fail("missing site credentials must not send a request"));
  await assert.rejects(listChatSessions(), error => {
    assert.equal(error.code, "AUTH_REQUIRED");
    assert.equal(handler(error), true);
    return true;
  });
  assert.deepEqual(redirects, [{ name: "LogIn", query: { redirect: "/chat?preset=alice" } }]);
  assert.equal(shouldRedirectToLogin(new ApiError("Token无效或已过期", { status: 401 })), true);
  assert.equal(shouldRedirectToLogin(new ApiError("需要提供Token用于认证", { status: 403 })), true);
  assert.equal(shouldRedirectToLogin(new ApiError("Forbidden", { status: 403 })), false);
});

test("a BotCF denial received inside a successful SSE response is a chat failure", async t => {
  const { handler, redirects } = setup(t);
  const payload = { type: "error", error: providerError, code: "CHAT_MESSAGE_SEND_FAILED" };
  t.mock.method(globalThis, "fetch", async () => new Response(`data: ${JSON.stringify(payload)}\n\n`, {
    headers: { "Content-Type": "text/event-stream" },
  }));
  await assert.rejects(streamChatMessage("1", { content: "Hello", idempotencyKey: "test" }), error => {
    assert.equal(error.message, providerError);
    assert.equal(error.code, "CHAT_MESSAGE_SEND_FAILED");
    assert.equal(handler(error, { silent: true }), false);
    return true;
  });
  assert.deepEqual(redirects, []);
});

test("loading the chat user profile retains structured authentication failures", async t => {
  const { handler, redirects } = setup(t);
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Token无效或已过期" }, { status: 401 }));
  await assert.rejects(getMeApi(), error => {
    assert.equal(error.status, 401);
    assert.equal(handler(error), true);
    return true;
  });
  assert.equal(redirects.length, 1);
  globalThis.localStorage = { getItem: () => null };
  await assert.rejects(getMeApi(), error => {
    assert.equal(error.code, "AUTH_REQUIRED");
    assert.equal(shouldRedirectToLogin(error), true);
    return true;
  });
});
