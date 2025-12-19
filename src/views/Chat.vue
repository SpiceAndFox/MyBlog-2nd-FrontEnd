<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { useRouter } from "vue-router";
import ChatSessionSidebar from "@/components/Chat/ChatSessionSidebar.vue";
import ChatConversationPanel from "@/components/Chat/ChatConversationPanel.vue";
import ChatSettingsModal from "@/components/Chat/ChatSettingsModal.vue";
import ChatConfirmDialog from "@/components/Chat/ChatConfirmDialog.vue";
import { CHAT_PROVIDERS, CHAT_PROMPT_PRESETS, normalizeChatSettings } from "@/config/chat";
import {
  createChatSession,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
  renameChatSession,
  sendChatMessage,
  streamChatMessage,
} from "@/api/chat";

const router = useRouter();

function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_SESSION_TITLE = "新对话";
const SETTINGS_STORAGE_KEY = "chat_settings_v1";

function formatSessionTitleFromMessage(messageText) {
  const normalized = String(messageText || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return DEFAULT_SESSION_TITLE;
  return normalized.length > 22 ? `${normalized.slice(0, 22)}…` : normalized;
}

function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistSettings(nextSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  } catch {
    // ignore
  }
}

function shouldRedirectToLogin(error) {
  const msg = String(error?.message || "");
  if (!msg) return false;
  return /token|登录|过期|unauthorized|forbidden/i.test(msg);
}

function handleApiError(error, { silent = false } = {}) {
  console.error(error);
  if (shouldRedirectToLogin(error)) {
    router.push({ name: "LogIn" });
    return true;
  }
  if (!silent) window.alert(error?.message || "请求失败");
  return false;
}

const isMobile = useMediaQuery("(max-width: 900px)");
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isSettingsOpen = ref(false);
const navHeight = ref(60);
const isSending = ref(false);
const isStreaming = ref(false);
let activeStreamAbortController = null;

function isAbortError(error) {
  return error?.name === "AbortError" || /abort/i.test(String(error?.message || ""));
}

function stopStreaming() {
  if (!isStreaming.value) return;
  activeStreamAbortController?.abort?.();
}

function updateNavHeight() {
  const navigation = document.querySelector(".navigation");
  if (!navigation) return;
  navHeight.value = Math.max(0, Math.round(navigation.getBoundingClientRect().height));
}

let navResizeObserver;

onMounted(() => {
  updateNavHeight();
  window.addEventListener("resize", updateNavHeight);

  const navigation = document.querySelector(".navigation");
  if (navigation && typeof ResizeObserver !== "undefined") {
    navResizeObserver = new ResizeObserver(updateNavHeight);
    navResizeObserver.observe(navigation);
  }

  void initializeChat();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateNavHeight);
  navResizeObserver?.disconnect();
  stopStreaming();
});

const promptPresets = CHAT_PROMPT_PRESETS;
const providers = CHAT_PROVIDERS;

const settings = ref(normalizeChatSettings(loadPersistedSettings()));

const sessions = ref([]);
const messagesBySessionId = reactive({});
const activeSessionId = ref("");

const activeSession = computed(() => sessions.value.find((s) => s.id === activeSessionId.value) || null);
const activeMessages = computed(() => messagesBySessionId[activeSessionId.value] || []);

function mapSession(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id ?? ""),
    title: raw.title || DEFAULT_SESSION_TITLE,
    settings: raw.settings || {},
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

function mapMessage(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id ?? ""),
    role: raw.role,
    content: raw.content || "",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

function upsertSession(rawSession) {
  const normalized = mapSession(rawSession);
  if (!normalized?.id) return;
  const existing = sessions.value.find((s) => s.id === normalized.id);
  if (existing) {
    existing.title = normalized.title;
    existing.updatedAt = normalized.updatedAt;
    existing.settings = normalized.settings;
    return;
  }
  sessions.value.unshift(normalized);
}

async function ensureMessagesLoaded(sessionId) {
  const normalizedId = String(sessionId || "");
  if (!normalizedId) return;
  if (messagesBySessionId[normalizedId] !== undefined) return;

  const rawMessages = await listChatMessages(normalizedId);
  messagesBySessionId[normalizedId] = rawMessages.map(mapMessage).filter(Boolean);
}

async function loadSessions() {
  const rawSessions = await listChatSessions();
  sessions.value = rawSessions.map(mapSession).filter(Boolean);
  await activateSession(sessions.value[0]?.id || "", { closeSidebar: false });
}

async function initializeChat() {
  try {
    await loadSessions();
  } catch (error) {
    handleApiError(error);
  }
}

function openMobileSidebar() {
  if (!isMobile.value) return;
  isMobileSidebarOpen.value = true;
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false;
}

function toggleSidebarCollapsed() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

async function activateSession(sessionId, { closeSidebar = true } = {}) {
  const normalizedId = String(sessionId || "");
  activeSessionId.value = normalizedId;
  if (closeSidebar) closeMobileSidebar();
  if (!normalizedId) return;
  await ensureMessagesLoaded(normalizedId);
}

async function selectSession(sessionId) {
  try {
    await activateSession(sessionId);
  } catch (error) {
    handleApiError(error);
  }
}

function bringSessionToTop(sessionId) {
  const normalizedId = String(sessionId || "");
  const index = sessions.value.findIndex((s) => s.id === normalizedId);
  if (index <= 0) return;
  const [session] = sessions.value.splice(index, 1);
  sessions.value.unshift(session);
}

async function createSession() {
  const created = await createChatSession({ title: DEFAULT_SESSION_TITLE, settings: settings.value });
  const session = mapSession(created);
  if (!session) throw new Error("创建会话失败");

  sessions.value.unshift(session);
  messagesBySessionId[session.id] = [];
  return session;
}

async function createNewSession() {
  try {
    const session = await createSession();
    await activateSession(session.id);
  } catch (error) {
    handleApiError(error);
  }
}

async function renameSession({ sessionId, title }) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return;

  try {
    const updated = await renameChatSession(sessionId, { title: normalizedTitle });
    upsertSession(updated);
    bringSessionToTop(String(sessionId));
  } catch (error) {
    handleApiError(error);
  }
}

const deleteDialog = ref({
  open: false,
  sessionId: "",
  sessionTitle: "",
});

function requestDeleteSession(sessionId) {
  const target = sessions.value.find((s) => s.id === sessionId);
  deleteDialog.value = {
    open: true,
    sessionId,
    sessionTitle: target?.title || "该会话",
  };
}

function cancelDeleteSession() {
  deleteDialog.value.open = false;
}

async function confirmDeleteSession() {
  const sessionId = deleteDialog.value.sessionId;
  deleteDialog.value.open = false;
  if (!sessionId) return;

  try {
    await deleteChatSession(sessionId);

    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
    delete messagesBySessionId[sessionId];

    if (activeSessionId.value === sessionId) {
      await activateSession(sessions.value[0]?.id || "", { closeSidebar: false });
    }
  } catch (error) {
    handleApiError(error);
  }
}

async function ensureActiveSession() {
  if (activeSessionId.value) return activeSessionId.value;

  const session = await createSession();
  await activateSession(session.id);
  return session.id;
}

function applyServerPayload(sessionId, payload, { optimisticUserMessage, optimisticAssistantMessage } = {}) {
  if (payload?.session) {
    upsertSession(payload.session);
    bringSessionToTop(sessionId);
  }

  if (payload?.user_message && optimisticUserMessage) {
    const mapped = mapMessage(payload.user_message);
    if (mapped) {
      optimisticUserMessage.id = mapped.id;
      optimisticUserMessage.createdAt = mapped.createdAt;
    }
  }

  if (payload?.assistant_message) {
    const mapped = mapMessage(payload.assistant_message);
    if (!mapped) return;

    if (optimisticAssistantMessage) {
      optimisticAssistantMessage.id = mapped.id;
      optimisticAssistantMessage.createdAt = mapped.createdAt;
      optimisticAssistantMessage.content = mapped.content || optimisticAssistantMessage.content;
      return;
    }

    messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), mapped];
  }
}

async function sendMessage(text) {
  if (isSending.value) return;

  const content = String(text || "").trim();
  if (!content) return;

  isSending.value = true;
  const nowIso = new Date().toISOString();

  let sessionId = "";

  try {
    sessionId = await ensureActiveSession();
    await ensureMessagesLoaded(sessionId);

    const optimisticUserMessage = reactive({
      id: createId("tmp_msg"),
      role: "user",
      content,
      createdAt: nowIso,
    });
    messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), optimisticUserMessage];

    const session = sessions.value.find((s) => s.id === sessionId);
    if (session) {
      if (session.title === DEFAULT_SESSION_TITLE && (messagesBySessionId[sessionId] || []).length <= 1) {
        session.title = formatSessionTitleFromMessage(content);
      }
      session.updatedAt = nowIso;
      bringSessionToTop(sessionId);
    }

    await nextTick();

    const outgoingSettings = { ...settings.value };

    if (outgoingSettings.stream) {
      isStreaming.value = true;
      const abortController = new AbortController();
      activeStreamAbortController = abortController;

      const optimisticAssistantMessage = reactive({
        id: createId("tmp_msg"),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      });
      messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), optimisticAssistantMessage];

      try {
        await streamChatMessage(sessionId, {
          content,
          settings: outgoingSettings,
          signal: abortController.signal,
          onDelta: (delta) => {
            optimisticAssistantMessage.content += delta;
          },
          onDone: (payload) => {
            applyServerPayload(sessionId, payload, { optimisticUserMessage, optimisticAssistantMessage });
          },
          onError: (message) => {
            optimisticAssistantMessage.content = `（请求失败）${message}`;
          },
        });
      } catch (error) {
        if (isAbortError(error)) {
          if (!String(optimisticAssistantMessage.content || "").trim()) {
            messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || []).filter(
              (m) => m !== optimisticAssistantMessage
            );
          }
          return;
        }
        if (handleApiError(error, { silent: true })) return;
        optimisticAssistantMessage.content = `（请求失败）${error?.message || error}`;
      } finally {
        if (activeStreamAbortController === abortController) activeStreamAbortController = null;
        isStreaming.value = false;
      }

      return;
    }

    const result = await sendChatMessage(sessionId, { content, settings: outgoingSettings });
    applyServerPayload(sessionId, result, { optimisticUserMessage });
  } catch (error) {
    const redirected = handleApiError(error, { silent: Boolean(sessionId) });

    if (!redirected && sessionId) {
      messagesBySessionId[sessionId] = [
        ...(messagesBySessionId[sessionId] || []),
        {
          id: createId("msg"),
          role: "assistant",
          content: `（请求失败）${error?.message || error}`,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  } finally {
    isSending.value = false;
  }
}

function openSettings() {
  isSettingsOpen.value = true;
  closeMobileSidebar();
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function saveSettings(nextSettings) {
  settings.value = normalizeChatSettings({ ...settings.value, ...nextSettings });
  persistSettings(settings.value);
  closeSettings();
}

watch(isMobile, (mobile) => {
  isMobileSidebarOpen.value = false;
});
</script>

<template>
  <div class="chat-page" :style="{ '--chat-nav-height': navHeight + 'px' }">
    <ChatSessionSidebar
      :sessions="sessions"
      :activeSessionId="activeSessionId"
      :collapsed="isSidebarCollapsed"
      :isMobile="isMobile"
      :mobileOpen="isMobileSidebarOpen"
      @select-session="selectSession"
      @create-session="createNewSession"
      @toggle-collapse="toggleSidebarCollapsed"
      @request-close="closeMobileSidebar"
      @request-rename-session="renameSession"
      @request-delete-session="requestDeleteSession"
      @open-settings="openSettings"
    />

    <ChatConversationPanel
      class="chat-conversation"
      :sessionTitle="activeSession?.title || DEFAULT_SESSION_TITLE"
      :messages="activeMessages"
      :isMobile="isMobile"
      :isSending="isSending"
      :isStreaming="isStreaming"
      @open-sidebar="openMobileSidebar"
      @send-message="sendMessage"
      @stop-output="stopStreaming"
    />

    <ChatSettingsModal
      :open="isSettingsOpen"
      :providers="providers"
      :promptPresets="promptPresets"
      :currentSettings="settings"
      @close="closeSettings"
      @save="saveSettings"
    />

    <ChatConfirmDialog
      :open="deleteDialog.open"
      title="删除会话"
      :message="`确定要删除“${deleteDialog.sessionTitle}”吗？此操作会删除该会话的所有聊天记录，且不可恢复。`"
      confirmText="删除"
      cancelText="取消"
      @confirm="confirmDeleteSession"
      @cancel="cancelDeleteSession"
    />
  </div>
</template>

<style scoped>
.chat-page {
  /* Light / ChatGPT-like theme */
  --chat-sidebar-bg: #f9fafb;
  --chat-sidebar-border: rgba(15, 23, 42, 0.12);
  --chat-sidebar-text: rgba(15, 23, 42, 0.92);
  --chat-sidebar-muted: rgba(15, 23, 42, 0.58);
  --chat-sidebar-hover: rgba(15, 23, 42, 0.05);
  --chat-sidebar-active: rgba(15, 23, 42, 0.06);
  --chat-sidebar-actions-bg: rgba(255, 255, 255, 0.82);

  --chat-surface: #ffffff;
  --chat-surface-2: #ffffff;
  --chat-border: rgba(15, 23, 42, 0.12);
  --chat-text: #0f172a;
  --chat-muted: rgba(15, 23, 42, 0.58);

  --chat-accent: #10a37f;
  --chat-accent-strong: #0f8a6c;

  --chat-topbar-bg: rgba(255, 255, 255, 0.92);
  --chat-topbar-hover: rgba(15, 23, 42, 0.05);
  --chat-composer-bg: rgba(255, 255, 255, 0.92);

  --chat-bubble-bg: rgba(255, 255, 255, 0.98);
  --chat-bubble-user-bg: rgba(16, 163, 127, 0.1);
  --chat-bubble-border: rgba(15, 23, 42, 0.1);
  --chat-bubble-user-border: rgba(16, 163, 127, 0.22);

  --chat-avatar-bg: rgba(15, 23, 42, 0.12);
  --chat-avatar-text: rgba(15, 23, 42, 0.92);
  --chat-avatar-user-bg: var(--chat-accent);
  --chat-avatar-user-text: #ffffff;

  --chat-card-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

  --chat-radius-lg: 14px;
  --chat-radius-md: 10px;
  --chat-radius-sm: 8px;

  --chat-nav-height: 60px;

  flex: none;
  height: calc(100vh - var(--chat-nav-height, 60px));
  height: calc(100dvh - var(--chat-nav-height, 60px));
  min-height: 0;
  display: flex;
  overflow: hidden;
  position: relative;

  background: var(--chat-surface);
}

.chat-conversation {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
