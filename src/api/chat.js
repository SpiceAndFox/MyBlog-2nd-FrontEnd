// src/api/chat.js

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("尚未登录或登录已过期");
  return { Authorization: `Bearer ${token}` };
}

async function readJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function normalizeSessionId(sessionId) {
  const normalized = String(sessionId ?? "").trim();
  if (!normalized) throw new Error("缺少会话ID");
  return normalized;
}

function normalizeMessageId(messageId) {
  const normalized = String(messageId ?? "").trim();
  if (!normalized) throw new Error("缺少消息ID");
  return normalized;
}

export async function listChatSessions() {
  const res = await fetch("/api/chat/sessions", {
    headers: { ...getAuthHeader() },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "获取会话列表失败");
  return data.sessions || [];
}

export async function listChatTrashedSessions() {
  const res = await fetch("/api/chat/sessions/trash", {
    headers: { ...getAuthHeader() },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "获取回收站失败");
  return data.sessions || [];
}

export async function listChatPresets() {
  const res = await fetch("/api/chat/presets", {
    headers: { ...getAuthHeader() },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "获取预设失败");
  return data.presets || [];
}

export async function getChatMeta() {
  const res = await fetch("/api/chat/meta", {
    headers: { ...getAuthHeader() },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "获取聊天配置失败");
  return data; // { providers, defaults }
}

export async function createChatPreset({ id, name, systemPrompt } = {}) {
  const res = await fetch("/api/chat/presets", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ id, name, systemPrompt }),
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "创建预设失败");
  return data.preset;
}

export async function updateChatPreset(presetId, { id, name, systemPrompt } = {}) {
  const normalizedId = String(presetId ?? "").trim();
  if (!normalizedId) throw new Error("缺少预设ID");
  const res = await fetch(`/api/chat/presets/${encodeURIComponent(normalizedId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ id, name, systemPrompt }),
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "更新预设失败");
  return data.preset;
}

export async function deleteChatPreset(presetId) {
  const normalizedId = String(presetId ?? "").trim();
  if (!normalizedId) throw new Error("缺少预设ID");
  const res = await fetch(`/api/chat/presets/${encodeURIComponent(normalizedId)}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (res.status === 204) return;
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "删除预设失败");
}

export async function uploadChatPresetAvatar(presetId, file) {
  const normalizedId = String(presetId ?? "").trim();
  if (!normalizedId) throw new Error("缺少预设ID");
  if (!(file instanceof File)) throw new Error("缺少头像文件");

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`/api/chat/presets/${encodeURIComponent(normalizedId)}/avatar`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: formData,
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "上传头像失败");
  return data.preset;
}

export async function createChatSession({ title, settings, presetId } = {}) {
  const res = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ title, settings, presetId }),
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "创建会话失败");
  return data.session;
}

export async function deleteChatSession(sessionId) {
  const normalizedId = normalizeSessionId(sessionId);
  const res = await fetch(`/api/chat/sessions/${normalizedId}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (res.status === 204) return;
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "删除会话失败");
}

export async function restoreChatSession(sessionId) {
  const normalizedId = normalizeSessionId(sessionId);
  const res = await fetch(`/api/chat/sessions/${normalizedId}/restore`, {
    method: "PATCH",
    headers: { ...getAuthHeader() },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "恢复会话失败");
  return data.session;
}

export async function deleteChatSessionPermanently(sessionId) {
  const normalizedId = normalizeSessionId(sessionId);
  const res = await fetch(`/api/chat/sessions/${normalizedId}/permanent`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (res.status === 204) return;
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "彻底删除会话失败");
}

export async function listChatMessages(sessionId) {
  const normalizedId = normalizeSessionId(sessionId);
  const res = await fetch(`/api/chat/sessions/${normalizedId}/messages`, {
    headers: { ...getAuthHeader() },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "获取消息失败");
  return data.messages || [];
}

export async function sendChatMessage(sessionId, { content, settings } = {}) {
  const normalizedId = normalizeSessionId(sessionId);
  const res = await fetch(`/api/chat/sessions/${normalizedId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ content, settings }),
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "发送消息失败");
  return data; // { session, user_message, assistant_message }
}

export async function editChatMessage(sessionId, messageId, { content, settings, truncate = false, regenerate = false } = {}) {
  const normalizedSessionId = normalizeSessionId(sessionId);
  const normalizedMessageId = normalizeMessageId(messageId);
  const res = await fetch(`/api/chat/sessions/${normalizedSessionId}/messages/${normalizedMessageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ content, settings, truncate, regenerate }),
  });
  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(data.error || "修改对话失败");
  return data; // { session, user_message, assistant_message? }
}

function parseSseFrames(chunkText, state) {
  state.buffer += chunkText;

  while (true) {
    const boundary = state.buffer.indexOf("\n\n");
    if (boundary === -1) break;

    const frame = state.buffer.slice(0, boundary);
    state.buffer = state.buffer.slice(boundary + 2);

    const lines = frame.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataPart = trimmed.slice("data:".length).trim();
      if (!dataPart) continue;
      state.onData?.(dataPart);
    }
  }
}

export async function streamChatMessage(
  sessionId,
  { content, settings, onDelta, onStart, onDone, onError, signal } = {}
) {
  const normalizedId = normalizeSessionId(sessionId);
  const res = await fetch(`/api/chat/sessions/${normalizedId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ content, settings: { ...(settings || {}), stream: true } }),
    signal,
  });

  if (!res.ok) {
    const data = await readJsonSafe(res);
    throw new Error(data.error || "发送消息失败");
  }

  if (!res.body) throw new Error("响应流不可用");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  const state = {
    buffer: "",
    onData: (dataPart) => {
      let payload;
      try {
        payload = JSON.parse(dataPart);
      } catch {
        return;
      }

      if (payload?.type === "start") {
        onStart?.(payload);
        return;
      }

      if (payload?.type === "delta") {
        const delta = typeof payload.delta === "string" ? payload.delta : "";
        if (delta) onDelta?.(delta);
        return;
      }

      if (payload?.type === "done") {
        onDone?.(payload);
        return;
      }

      if (payload?.type === "error") {
        onError?.(payload.error || "未知错误");
      }
    },
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    parseSseFrames(decoder.decode(value, { stream: true }), state);
  }
}

export async function streamEditChatMessage(
  sessionId,
  messageId,
  { content, settings, truncate = true, onDelta, onStart, onDone, onError, signal } = {}
) {
  const normalizedSessionId = normalizeSessionId(sessionId);
  const normalizedMessageId = normalizeMessageId(messageId);
  const res = await fetch(`/api/chat/sessions/${normalizedSessionId}/messages/${normalizedMessageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ content, truncate, regenerate: true, settings: { ...(settings || {}), stream: true } }),
    signal,
  });

  if (!res.ok) {
    const data = await readJsonSafe(res);
    throw new Error(data.error || "修改对话失败");
  }

  if (!res.body) throw new Error("响应流不可用");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  const state = {
    buffer: "",
    onData: (dataPart) => {
      let payload;
      try {
        payload = JSON.parse(dataPart);
      } catch {
        return;
      }

      if (payload?.type === "start") {
        onStart?.(payload);
        return;
      }

      if (payload?.type === "delta") {
        const delta = typeof payload.delta === "string" ? payload.delta : "";
        if (delta) onDelta?.(delta);
        return;
      }

      if (payload?.type === "done") {
        onDone?.(payload);
        return;
      }

      if (payload?.type === "error") {
        onError?.(payload.error || "未知错误");
      }
    },
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    parseSseFrames(decoder.decode(value, { stream: true }), state);
  }
}
