<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { useRouter } from "vue-router";
import ChatSessionSidebar from "@/components/Chat/ChatSessionSidebar.vue";
import ChatConversationPanel from "@/components/Chat/ChatConversationPanel.vue";
import ChatSettingsModal from "@/components/Chat/ChatSettingsModal.vue";
import ChatConfirmDialog from "@/components/Chat/ChatConfirmDialog.vue";
import { DEFAULT_ASSISTANT_AVATAR_URL } from "@/config/chat";
import { getMeApi } from "@/api/auth";
import {
  createChatSession,
  createChatPreset,
  deleteChatSession,
  deleteChatPreset,
  editChatMessage,
  getChatMeta,
  listChatMessages,
  listChatPresets,
  listChatSessions,
  renameChatSession,
  sendChatMessage,
  streamEditChatMessage,
  streamChatMessage,
  updateChatPreset,
  uploadChatPresetAvatar,
} from "@/api/chat";

const router = useRouter();

function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_SESSION_TITLE = "新对话";
const SETTINGS_STORAGE_KEY = "chat_settings_v1";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

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
    if (!isPlainObject(parsed)) return null;
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

function mapPreset(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    systemPrompt: typeof raw.systemPrompt === "string" ? raw.systemPrompt : "",
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl.trim() : "",
    isBuiltin: Boolean(raw.isBuiltin ?? raw.is_builtin),
  };
}

function mapModel(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;
  const name = String(raw.name ?? id).trim() || id;
  return { id, name };
}

function mapProvider(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;
  const name = String(raw.name ?? id).trim() || id;
  const models = (Array.isArray(raw.models) ? raw.models : []).map(mapModel).filter(Boolean);
  if (!models.length) return null;
  return { id, name, models };
}

function mapMetaDefaults(rawDefaults) {
  const defaults = isPlainObject(rawDefaults) ? rawDefaults : {};

  const mapped = {};

  if (typeof defaults.providerId === "string") mapped.providerId = defaults.providerId.trim();
  if (typeof defaults.modelId === "string") mapped.modelId = defaults.modelId.trim();
  if (typeof defaults.systemPromptPresetId === "string") mapped.systemPromptPresetId = defaults.systemPromptPresetId.trim();

  const temperature = Number(defaults.temperature);
  if (Number.isFinite(temperature)) mapped.temperature = temperature;

  const topP = Number(defaults.topP);
  if (Number.isFinite(topP)) mapped.topP = topP;

  const maxOutputTokens = Number(defaults.maxOutputTokens);
  if (Number.isFinite(maxOutputTokens)) mapped.maxOutputTokens = maxOutputTokens;

  const presencePenalty = Number(defaults.presencePenalty);
  if (Number.isFinite(presencePenalty)) mapped.presencePenalty = presencePenalty;

  const frequencyPenalty = Number(defaults.frequencyPenalty);
  if (Number.isFinite(frequencyPenalty)) mapped.frequencyPenalty = frequencyPenalty;

  if (typeof defaults.stream === "boolean") mapped.stream = defaults.stream;
  if (typeof defaults.enableWebSearch === "boolean") mapped.enableWebSearch = defaults.enableWebSearch;

  return mapped;
}

function normalizeSettings({ forceSystemPrompt = false } = {}) {
  const base = isPlainObject(settings.value) ? settings.value : {};
  const defaults = isPlainObject(chatDefaults.value) ? chatDefaults.value : {};

  const normalized = { ...defaults, ...base };

  const providerList = Array.isArray(providers.value) ? providers.value : [];
  const desiredProviderId = String(normalized.providerId || "").trim();
  const defaultProviderId = String(defaults.providerId || "").trim();

  const provider =
    providerList.find((p) => p.id === desiredProviderId) ||
    providerList.find((p) => p.id === defaultProviderId) ||
    providerList[0] ||
    null;

  if (provider?.id) normalized.providerId = provider.id;

  const models = provider?.models || [];
  const desiredModelId = String(normalized.modelId || "").trim();
  const defaultModelId = String(defaults.modelId || "").trim();

  const model =
    models.find((m) => m.id === desiredModelId) ||
    (provider?.id && provider.id === defaultProviderId ? models.find((m) => m.id === defaultModelId) : null) ||
    models[0] ||
    null;

  if (model?.id) normalized.modelId = model.id;

  const temperature = Number(normalized.temperature);
  normalized.temperature = Number.isFinite(temperature) ? temperature : defaults.temperature;

  const topP = Number(normalized.topP);
  normalized.topP = Number.isFinite(topP) ? topP : defaults.topP;

  const maxOutputTokens = Number(normalized.maxOutputTokens);
  normalized.maxOutputTokens = Number.isFinite(maxOutputTokens) ? maxOutputTokens : defaults.maxOutputTokens;

  const presencePenalty = Number(normalized.presencePenalty);
  normalized.presencePenalty = Number.isFinite(presencePenalty) ? presencePenalty : defaults.presencePenalty;

  const frequencyPenalty = Number(normalized.frequencyPenalty);
  normalized.frequencyPenalty = Number.isFinite(frequencyPenalty) ? frequencyPenalty : defaults.frequencyPenalty;

  normalized.stream = typeof normalized.stream === "boolean" ? normalized.stream : defaults.stream;
  normalized.enableWebSearch =
    typeof normalized.enableWebSearch === "boolean" ? normalized.enableWebSearch : defaults.enableWebSearch;

  const presetList = Array.isArray(promptPresets.value) ? promptPresets.value : [];
  const desiredPresetId = String(normalized.systemPromptPresetId || "").trim();
  const defaultPresetId = String(defaults.systemPromptPresetId || "").trim();

  const preset =
    presetList.find((p) => p.id === desiredPresetId) ||
    presetList.find((p) => p.id === defaultPresetId) ||
    presetList.find((p) => p.id === "default") ||
    presetList[0] ||
    null;

  if (preset?.id) normalized.systemPromptPresetId = preset.id;

  const hasBaseSystemPrompt =
    Object.prototype.hasOwnProperty.call(base, "systemPrompt") && typeof base.systemPrompt === "string";

  if (forceSystemPrompt || !hasBaseSystemPrompt || typeof normalized.systemPrompt !== "string") {
    normalized.systemPrompt = preset?.systemPrompt || "";
  }

  settings.value = normalized;
}

async function refreshChatMeta({ silent = false } = {}) {
  try {
    const meta = await getChatMeta();

    const mappedProviders = (meta?.providers || []).map(mapProvider).filter(Boolean);
    providers.value = mappedProviders;
    chatDefaults.value = mapMetaDefaults(meta?.defaults);

    normalizeSettings();
    persistSettings(settings.value);

    return meta;
  } catch (error) {
    handleApiError(error, { silent });
    return null;
  }
}

async function refreshPromptPresets({ silent = false, forceSystemPrompt = false } = {}) {
  try {
    const rawPresets = await listChatPresets();
    const mapped = rawPresets.map(mapPreset).filter((p) => p && p.id);
    promptPresets.value = mapped;

    normalizeSettings({ forceSystemPrompt });
    persistSettings(settings.value);

    return promptPresets.value;
  } catch (error) {
    handleApiError(error, { silent });
    return promptPresets.value;
  }
}

async function loadCurrentUser({ silent = false } = {}) {
  try {
    currentUser.value = await getMeApi();
    return currentUser.value;
  } catch (error) {
    handleApiError(error, { silent });
    return null;
  }
}

async function createPromptPreset(payload) {
  try {
    const preset = await createChatPreset(payload);
    await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
    return preset;
  } catch (error) {
    handleApiError(error, { silent: true });
    throw error;
  }
}

async function updatePromptPreset(presetId, payload) {
  try {
    const preset = await updateChatPreset(presetId, payload);
    await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
    return preset;
  } catch (error) {
    handleApiError(error, { silent: true });
    throw error;
  }
}

async function deletePromptPreset(presetId) {
  try {
    await deleteChatPreset(presetId);
    await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
  } catch (error) {
    handleApiError(error, { silent: true });
    throw error;
  }
}

async function uploadPromptPresetAvatar(presetId, file) {
  try {
    const preset = await uploadChatPresetAvatar(presetId, file);
    await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
    return preset;
  } catch (error) {
    handleApiError(error, { silent: true });
    throw error;
  }
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

const providers = ref([]);
const promptPresets = ref([]);
const chatDefaults = ref({});
const currentUser = ref(null);

const initialSettingsRaw = loadPersistedSettings();
const settings = ref(isPlainObject(initialSettingsRaw) ? initialSettingsRaw : {});

const sessions = ref([]);
const messagesBySessionId = reactive({});
const activeSessionId = ref("");

const activeSession = computed(() => sessions.value.find((s) => s.id === activeSessionId.value) || null);
const activeMessages = computed(() => messagesBySessionId[activeSessionId.value] || []);

const userProfile = computed(() => ({
  username: currentUser.value?.username || "User",
  avatarUrl: currentUser.value?.avatar_url || currentUser.value?.avatarUrl || "",
}));

const assistantPresetId = computed(() => {
  const fromSession = activeSession.value?.settings?.systemPromptPresetId;
  return String(fromSession || settings.value?.systemPromptPresetId || "default");
});

const assistantPreset = computed(
  () =>
    promptPresets.value.find((preset) => preset.id === assistantPresetId.value) ||
    promptPresets.value.find((preset) => preset.id === "default") ||
    promptPresets.value[0] ||
    null
);

const assistantProfile = computed(() => ({
  name: assistantPreset.value?.name || "Assistant",
  avatarUrl: assistantPreset.value?.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL,
}));

const editingMessageId = ref("");
const editingSessionId = ref("");
const editingOriginalContent = ref("");
const editingDraft = ref("");
const isEditingActive = computed(() => Boolean(editingMessageId.value));
const isEditingMessage = ref(false);

function resetEditingState() {
  editingMessageId.value = "";
  editingSessionId.value = "";
  editingOriginalContent.value = "";
  editingDraft.value = "";
}

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
    await loadCurrentUser({ silent: true });
    await refreshChatMeta({ silent: true });
    await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
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
  resetEditingState();
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

function requestEditMessage(message) {
  if (isSending.value || isStreaming.value || isEditingMessage.value) return;
  const sessionId = activeSessionId.value;
  if (!sessionId) return;
  if (!message || message.role !== "user") return;

  editingSessionId.value = sessionId;
  editingMessageId.value = String(message.id || "");
  editingOriginalContent.value = String(message.content || "");
  editingDraft.value = editingOriginalContent.value;
}

function updateEditDraft(nextDraft) {
  if (!isEditingActive.value) return;
  editingDraft.value = String(nextDraft ?? "");
}

function cancelEditMessage() {
  if (isEditingMessage.value) return;
  resetEditingState();
}

async function commitEditMessage(messageId) {
  if (!isEditingActive.value) return;
  if (isEditingMessage.value || isSending.value || isStreaming.value) return;

  const sessionId = String(editingSessionId.value || "");
  const targetMessageId = String(messageId || editingMessageId.value || "");
  if (!sessionId || !targetMessageId) return;

  if (sessionId !== activeSessionId.value) {
    resetEditingState();
    return;
  }

  const normalizedContent = String(editingDraft.value || "").trim();
  if (!normalizedContent) {
    window.alert("内容不能为空");
    return;
  }

  const originalTrimmed = String(editingOriginalContent.value || "").trim();
  resetEditingState();

  if (normalizedContent === originalTrimmed) return;

  isEditingMessage.value = true;
  isSending.value = true;
  const nowIso = new Date().toISOString();

  const snapshot = (messagesBySessionId[sessionId] || []).map((m) => ({ ...m }));

  try {
    await ensureMessagesLoaded(sessionId);

    const list = messagesBySessionId[sessionId] || [];
    const messageIndex = list.findIndex((m) => String(m.id) === targetMessageId);
    if (messageIndex === -1) throw new Error("未找到要修改的消息");

    const targetMessage = list[messageIndex];
    targetMessage.content = normalizedContent;
    messagesBySessionId[sessionId] = list.slice(0, messageIndex + 1);

    const session = sessions.value.find((s) => s.id === sessionId);
    if (session) {
      if (session.title === DEFAULT_SESSION_TITLE && messageIndex === 0) {
        session.title = formatSessionTitleFromMessage(normalizedContent);
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
        await streamEditChatMessage(sessionId, targetMessageId, {
          content: normalizedContent,
          truncate: true,
          settings: outgoingSettings,
          signal: abortController.signal,
          onDelta: (delta) => {
            optimisticAssistantMessage.content += delta;
          },
          onDone: (payload) => {
            applyServerPayload(sessionId, payload, {
              optimisticUserMessage: targetMessage,
              optimisticAssistantMessage,
            });
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
        } else if (!handleApiError(error, { silent: true })) {
          optimisticAssistantMessage.content = `（请求失败）${error?.message || error}`;
        }
      } finally {
        if (activeStreamAbortController === abortController) activeStreamAbortController = null;
        isStreaming.value = false;
      }

      return;
    }

    const result = await editChatMessage(sessionId, targetMessageId, {
      content: normalizedContent,
      truncate: true,
      regenerate: true,
      settings: outgoingSettings,
    });

    applyServerPayload(sessionId, result, { optimisticUserMessage: targetMessage });
  } catch (error) {
    messagesBySessionId[sessionId] = snapshot;
    handleApiError(error);
  } finally {
    isSending.value = false;
    isEditingMessage.value = false;
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
  const base = isPlainObject(settings.value) ? settings.value : {};
  const override = isPlainObject(nextSettings) ? nextSettings : {};
  settings.value = { ...base, ...override };
  normalizeSettings();
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
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
      :isMobile="isMobile"
      :isSending="isSending"
      :isStreaming="isStreaming"
      :isEditingActive="isEditingActive"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="isEditingMessage"
      @open-sidebar="openMobileSidebar"
      @send-message="sendMessage"
      @stop-output="stopStreaming"
      @request-edit-message="requestEditMessage"
      @update-edit-draft="updateEditDraft"
      @commit-edit-message="commitEditMessage"
      @cancel-edit-message="cancelEditMessage"
    />

    <ChatSettingsModal
      :open="isSettingsOpen"
      :providers="providers"
      :promptPresets="promptPresets"
      :currentSettings="settings"
      :defaultSettings="chatDefaults"
      :refreshPresets="() => refreshPromptPresets({ silent: false, forceSystemPrompt: true })"
      :createPreset="createPromptPreset"
      :updatePreset="updatePromptPreset"
      :deletePreset="deletePromptPreset"
      :uploadPresetAvatar="uploadPromptPresetAvatar"
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
