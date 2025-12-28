import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
  const chatSessions = useChatSessions({
    settings: chatSettings.settings,
    handleApiError,
    closeMobileSidebar,
    resetEditingState,
  });
  const chatTrash = useChatTrash({ handleApiError });

  const chatMessaging = useChatMessaging({
    settings: chatSettings.settings,
    sessions: chatSessions.sessions,
    messagesBySessionId: chatSessions.messagesBySessionId,
    activeSessionId: chatSessions.activeSessionId,
    ensureMessagesLoaded: chatSessions.ensureMessagesLoaded,
    createSession: chatSessions.createSession,
    activateSession: chatSessions.activateSession,
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

  const assistantPresetId = computed(() => {
    const fromSession =
      chatSessions.activeSession.value?.presetId || chatSessions.activeSession.value?.settings?.systemPromptPresetId;
    return String(fromSession || chatSettings.settings.value?.systemPromptPresetId || DEFAULT_PROMPT_PRESET_ID);
  });

  const assistantPreset = computed(
    () =>
      chatSettings.promptPresets.value.find((preset) => preset.id === assistantPresetId.value) ||
      chatSettings.promptPresets.value.find((preset) => preset.id === DEFAULT_PROMPT_PRESET_ID) ||
      chatSettings.promptPresets.value[0] ||
      null
  );

  const assistantProfile = computed(() => ({
    name: assistantPreset.value?.name || "Assistant",
    avatarUrl: assistantPreset.value?.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL,
  }));

  const isPresetLocked = computed(() => Boolean(chatSessions.activeSessionId.value));

  function syncSettingsToSessionPreset(session, presets) {
    if (!session) return;
    const rawPresetId = session?.presetId || session?.preset_id || session?.settings?.systemPromptPresetId;
    const sessionPresetId = String(rawPresetId || "").trim();
    if (!sessionPresetId) return;

    const presetList = Array.isArray(presets) ? presets : [];
    const resolvedPreset =
      presetList.find((preset) => preset.id === sessionPresetId) ||
      presetList.find((preset) => preset.id === DEFAULT_PROMPT_PRESET_ID) ||
      presetList[0] ||
      null;

    const currentSettings = isPlainObject(chatSettings.settings.value) ? chatSettings.settings.value : {};
    const nextPresetId = resolvedPreset?.id || sessionPresetId;
    const nextSystemPrompt = resolvedPreset?.systemPrompt ?? currentSettings.systemPrompt ?? "";

    if (
      currentSettings.systemPromptPresetId === nextPresetId &&
      String(currentSettings.systemPrompt ?? "") === String(nextSystemPrompt)
    ) {
      return;
    }

    chatSettings.settings.value = {
      ...currentSettings,
      systemPromptPresetId: nextPresetId,
      systemPrompt: nextSystemPrompt,
    };
  }

  watch(
    [chatSessions.activeSession, chatSettings.promptPresets],
    ([session, presets]) => {
      syncSettingsToSessionPreset(session, presets);
    },
    { immediate: true }
  );

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

  async function initializeChat() {
    try {
      await loadCurrentUser({ silent: true });
      await chatSettings.refreshChatMeta({ silent: true });
      await chatSettings.refreshPromptPresets({ silent: true, forceSystemPrompt: true });
      await chatSessions.loadSessions();
    } catch (error) {
      handleApiError(error);
    }
  }

  let stopNavTracking = null;
  let releaseBodyScrollLock = null;

  onMounted(() => {
    releaseBodyScrollLock = lockBodyScroll();
    stopNavTracking = startNavHeightTracking(navHeight);
    void initializeChat();
  });

  onBeforeUnmount(() => {
    stopNavTracking?.();
    stopNavTracking = null;
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

    sessions: chatSessions.sessions,
    activeSessionId: chatSessions.activeSessionId,
    activeSession: chatSessions.activeSession,
    activeMessages: chatSessions.activeMessages,

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

    trashedSessions: chatTrash.trashedSessions,
    isTrashLoading: chatTrash.isTrashLoading,
    refreshTrash: chatTrash.refreshTrash,
    openTrash,
    closeTrash,
    restoreTrashedSession,
    deleteTrashedSessionPermanently,

    createNewSession: chatSessions.createNewSession,
    selectSession: chatSessions.selectSession,
    renameSession: chatSessions.renameSession,

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
    savePresetSelection,
  };
}
