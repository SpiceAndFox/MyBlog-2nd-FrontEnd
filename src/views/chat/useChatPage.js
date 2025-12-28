import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { DEFAULT_ASSISTANT_AVATAR_URL, DEFAULT_PROMPT_PRESET_ID } from "@/config/chat";
import { getMeApi } from "@/api/auth";
import { createApiErrorHandler } from "./apiError";
import { isPlainObject } from "./helpers";
import { lockBodyScroll, startNavHeightTracking } from "./ui";
import { useChatMessaging } from "./useChatMessaging";
import { useChatSessions } from "./useChatSessions";
import { useChatSettings } from "./useChatSettings";
import { useChatTrash } from "./useChatTrash";

export function useChatPage({ router }) {
  const handleApiError = createApiErrorHandler(router);

  const isMobile = useMediaQuery("(max-width: 900px)");
  const isSidebarCollapsed = ref(false);
  const isMobileSidebarOpen = ref(false);
  const isSettingsOpen = ref(false);
  const isPresetsOpen = ref(false);
  const isTrashOpen = ref(false);
  const navHeight = ref(60);

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

  watch(isMobile, () => {
    isMobileSidebarOpen.value = false;
  });

  const currentUser = ref(null);

  async function loadCurrentUser({ silent = false } = {}) {
    try {
      currentUser.value = await getMeApi();
      return currentUser.value;
    } catch (error) {
      handleApiError(error, { silent });
      return null;
    }
  }

  const userProfile = computed(() => ({
    username: currentUser.value?.username || "User",
    avatarUrl: currentUser.value?.avatar_url || currentUser.value?.avatarUrl || "",
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

  const chatSettings = useChatSettings({ handleApiError });
  const activePresetId = computed(() =>
    String(chatSettings.settings.value?.systemPromptPresetId || DEFAULT_PROMPT_PRESET_ID)
  );

  const COMPOSER_DRAFT_STORAGE_PREFIX = "blog.chat.composerDraft.v1:";
  const composerDraftByPresetId = reactive({});
  const draftPersistTimers = new Map();

  function normalizePresetId(rawPresetId) {
    const normalized = String(rawPresetId || DEFAULT_PROMPT_PRESET_ID).trim();
    return normalized || DEFAULT_PROMPT_PRESET_ID;
  }

  function loadComposerDraft(presetId) {
    const normalizedPresetId = normalizePresetId(presetId);
    try {
      const raw = localStorage.getItem(`${COMPOSER_DRAFT_STORAGE_PREFIX}${normalizedPresetId}`);
      return String(raw ?? "");
    } catch {
      return "";
    }
  }

  function persistComposerDraft(presetId, draftText) {
    const normalizedPresetId = normalizePresetId(presetId);
    const normalizedDraft = String(draftText ?? "");
    const storageKey = `${COMPOSER_DRAFT_STORAGE_PREFIX}${normalizedPresetId}`;

    try {
      if (!normalizedDraft) {
        localStorage.removeItem(storageKey);
        return;
      }
      localStorage.setItem(storageKey, normalizedDraft);
    } catch {
      // ignore
    }
  }

  function ensureComposerDraftLoaded(presetId) {
    const normalizedPresetId = normalizePresetId(presetId);
    if (Object.prototype.hasOwnProperty.call(composerDraftByPresetId, normalizedPresetId)) return;
    composerDraftByPresetId[normalizedPresetId] = loadComposerDraft(normalizedPresetId);
  }

  function scheduleDraftPersist(presetId) {
    const normalizedPresetId = normalizePresetId(presetId);
    const existing = draftPersistTimers.get(normalizedPresetId);
    if (existing) window.clearTimeout(existing);

    const timer = window.setTimeout(() => {
      draftPersistTimers.delete(normalizedPresetId);
      persistComposerDraft(normalizedPresetId, composerDraftByPresetId[normalizedPresetId] || "");
    }, 350);

    draftPersistTimers.set(normalizedPresetId, timer);
  }

  function flushDraftPersistence() {
    const pending = Array.from(draftPersistTimers.entries());
    for (const [presetId, timer] of pending) {
      window.clearTimeout(timer);
      draftPersistTimers.delete(presetId);
      persistComposerDraft(presetId, composerDraftByPresetId[presetId] || "");
    }
  }

  function onVisibilityChange() {
    if (typeof document === "undefined") return;
    if (!document.hidden) return;
    flushDraftPersistence();
  }

  const composerDraft = computed({
    get: () => {
      const presetId = normalizePresetId(activePresetId.value);
      ensureComposerDraftLoaded(presetId);
      return composerDraftByPresetId[presetId] || "";
    },
    set: (nextDraft) => {
      const presetId = normalizePresetId(activePresetId.value);
      composerDraftByPresetId[presetId] = String(nextDraft ?? "");
      scheduleDraftPersist(presetId);
    },
  });

  watch(activePresetId, (presetId) => {
    ensureComposerDraftLoaded(presetId);
  });

  const chatSessions = useChatSessions({
    settings: chatSettings.settings,
    activePresetId,
    handleApiError,
    closeMobileSidebar,
    resetEditingState,
  });
  const chatTrash = useChatTrash({ handleApiError });

  const dayRollover = ref(null);

  watch(
    () => chatSessions.todayKey.value,
    (nextKey, prevKey) => {
      const next = String(nextKey || "").trim();
      const prev = String(prevKey || "").trim();
      if (!prev || !next || prev === next) return;
      if (typeof document !== "undefined" && document.hidden) return;
      dayRollover.value = { fromKey: prev, toKey: next, at: Date.now() };
    }
  );

  const chatMessaging = useChatMessaging({
    settings: chatSettings.settings,
    sessions: chatSessions.sessions,
    messagesBySessionId: chatSessions.messagesBySessionId,
    activeSessionId: chatSessions.activeSessionId,
    ensureMessagesLoaded: chatSessions.ensureMessagesLoaded,
    ensureTodaySession: chatSessions.ensureTodaySession,
    isReadOnly: chatSessions.isActiveSessionReadOnly,
    bringSessionToTop: chatSessions.bringSessionToTop,
    upsertSession: chatSessions.upsertSession,
    handleApiError,
    editingMessageId,
    editingSessionId,
    editingOriginalContent,
    editingDraft,
    isEditingActive,
    isEditingMessage,
    resetEditingState,
  });

  const assistantPreset = computed(
    () =>
      chatSettings.promptPresets.value.find((preset) => preset.id === activePresetId.value) ||
      chatSettings.promptPresets.value.find((preset) => preset.id === DEFAULT_PROMPT_PRESET_ID) ||
      chatSettings.promptPresets.value[0] ||
      null
  );

  const assistantProfile = computed(() => ({
    name: assistantPreset.value?.name || "Assistant",
    avatarUrl: assistantPreset.value?.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL,
  }));

  const isPresetLocked = computed(
    () => Boolean(chatMessaging.isSending.value || chatMessaging.isStreaming.value || isEditingActive.value || isEditingMessage.value)
  );

  watch(activePresetId, (presetId) => {
    const normalized = String(presetId || "").trim();
    if (!normalized) return;
    void chatSessions.activateTodayContext({ presetId: normalized, closeSidebar: false });
  });

  async function updatePromptPreset(presetId, payload) {
    const preset = await chatSettings.updatePromptPreset(presetId, payload);
    await chatSessions.loadSessions({ preserveActive: true });
    return preset;
  }

  async function deletePromptPreset(presetId) {
    await chatSettings.deletePromptPreset(presetId);
    await chatSessions.loadSessions({ preserveActive: true });
  }

  function openSettings() {
    isPresetsOpen.value = false;
    isTrashOpen.value = false;
    isSettingsOpen.value = true;
    closeMobileSidebar();
  }

  function closeSettings() {
    isSettingsOpen.value = false;
  }

  function openPresets() {
    isSettingsOpen.value = false;
    isTrashOpen.value = false;
    isPresetsOpen.value = true;
    closeMobileSidebar();
  }

  function closePresets() {
    isPresetsOpen.value = false;
  }

  function selectPreset(presetId) {
    if (isPresetLocked.value) return;

    const presets = Array.isArray(chatSettings.promptPresets.value) ? chatSettings.promptPresets.value : [];
    const normalizedId = String(presetId || "").trim();
    if (!normalizedId) return;

    const preset =
      presets.find((entry) => entry?.id === normalizedId) ||
      presets.find((entry) => entry?.id === DEFAULT_PROMPT_PRESET_ID) ||
      presets[0] ||
      null;

    if (!preset?.id) return;

    applySettings({
      systemPromptPresetId: preset.id,
      systemPrompt: preset.systemPrompt || "",
    });
  }

  function openTrash() {
    isSettingsOpen.value = false;
    isPresetsOpen.value = false;
    isTrashOpen.value = true;
    closeMobileSidebar();
    void chatTrash.refreshTrash({ silent: true });
  }

  function closeTrash() {
    isTrashOpen.value = false;
  }

  async function restoreTrashedSession(sessionId) {
    const restored = await chatTrash.restore(sessionId);
    await chatSessions.loadSessions({ preserveActive: true });
    return restored;
  }

  async function deleteTrashedSessionPermanently(sessionId) {
    await chatTrash.deletePermanently(sessionId);
  }

  function applySettings(nextSettings) {
    const base = isPlainObject(chatSettings.settings.value) ? chatSettings.settings.value : {};
    const override = isPlainObject(nextSettings) ? nextSettings : {};
    chatSettings.settings.value = { ...base, ...override };
    chatSettings.normalizeSettings();
    chatSettings.persistCurrentSettings();
  }

  function saveSettings(nextSettings) {
    applySettings(nextSettings);
    closeSettings();
  }

  function savePresetSelection(nextSettings) {
    applySettings(nextSettings);
    closePresets();
  }

  function goToToday({ closeSidebar = true } = {}) {
    return chatSessions.activateTodayContext({ presetId: activePresetId.value, closeSidebar });
  }

  async function initializeChat() {
    try {
      await loadCurrentUser({ silent: true });
      await chatSettings.refreshChatMeta({ silent: true });
      await chatSettings.refreshPromptPresets({ silent: true, forceSystemPrompt: true });
      await chatSessions.loadSessions();
      await chatSessions.activateTodayContext({ presetId: activePresetId.value, closeSidebar: false });
    } catch (error) {
      handleApiError(error);
    }
  }

  let stopNavTracking = null;
  let releaseBodyScrollLock = null;

  onMounted(() => {
    releaseBodyScrollLock = lockBodyScroll();
    stopNavTracking = startNavHeightTracking(navHeight);
    window.addEventListener("beforeunload", flushDraftPersistence);
    document.addEventListener("visibilitychange", onVisibilityChange);
    void initializeChat();
  });

  onBeforeUnmount(() => {
    stopNavTracking?.();
    stopNavTracking = null;
    flushDraftPersistence();
    window.removeEventListener("beforeunload", flushDraftPersistence);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    chatMessaging.stopStreaming();
    releaseBodyScrollLock?.();
    releaseBodyScrollLock = null;
  });

  return {
    isMobile,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isSettingsOpen,
    isPresetsOpen,
    isTrashOpen,
    navHeight,

    isSending: chatMessaging.isSending,
    isStreaming: chatMessaging.isStreaming,
    stopStreaming: chatMessaging.stopStreaming,

    providers: chatSettings.providers,
    promptPresets: chatSettings.promptPresets,
    chatDefaults: chatSettings.chatDefaults,
    settings: chatSettings.settings,
    isPresetLocked,

    composerDraft,
    dayRollover,

    sessions: chatSessions.sessionsForActivePreset,
    activeSessionId: chatSessions.activeSessionId,
    activeSession: chatSessions.activeSession,
    activeMessages: chatSessions.activeMessages,
    isReadOnly: chatSessions.isActiveSessionReadOnly,
    todayKey: chatSessions.todayKey,
    activeSessionDateKey: chatSessions.activeSessionDateKey,

    userProfile,
    assistantProfile,

    editingMessageId,
    editingDraft,
    isEditingActive,
    isEditingMessage,

    createPromptPreset: chatSettings.createPromptPreset,
    updatePromptPreset,
    deletePromptPreset,
    uploadPromptPresetAvatar: chatSettings.uploadPromptPresetAvatar,
    refreshPromptPresets: chatSettings.refreshPromptPresets,

    openMobileSidebar,
    closeMobileSidebar,
    toggleSidebarCollapsed,
    goToToday,

    trashedSessions: chatTrash.trashedSessions,
    isTrashLoading: chatTrash.isTrashLoading,
    refreshTrash: chatTrash.refreshTrash,
    openTrash,
    closeTrash,
    restoreTrashedSession,
    deleteTrashedSessionPermanently,

    selectSession: chatSessions.selectSession,

    deleteDialog: chatSessions.deleteDialog,
    requestDeleteSession: chatSessions.requestDeleteSession,
    cancelDeleteSession: chatSessions.cancelDeleteSession,
    confirmDeleteSession: chatSessions.confirmDeleteSession,

    sendMessage: chatMessaging.sendMessage,
    requestEditMessage: chatMessaging.requestEditMessage,
    updateEditDraft: chatMessaging.updateEditDraft,
    commitEditMessage: chatMessaging.commitEditMessage,
    cancelEditMessage: chatMessaging.cancelEditMessage,

    openSettings,
    closeSettings,
    saveSettings,
    openPresets,
    closePresets,
    selectPreset,
    savePresetSelection,
  };
}
