import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  createChatSession,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
} from "@/api/chat";
import { formatLocalDateKey, getMsUntilNextDayBoundary, getSessionDateKey } from "./helpers";
import { mapMessage, mapSession } from "./mappers";

export function useChatSessions({
  settings,
  activePresetId,
  handleApiError,
  closeMobileSidebar,
  resetEditingState,
} = {}) {
  const sessions = ref([]);
  const messagesBySessionId = reactive({});
  const activeSessionId = ref("");
  const isDraftSession = ref(false);

  const resolvedActivePresetId = computed(() => {
    const raw = activePresetId?.value ?? settings?.value?.systemPromptPresetId;
    const normalized = String(raw || "default").trim();
    return normalized || "default";
  });

  const todayKey = ref(formatLocalDateKey(new Date()));
  let todayKeyTimer = null;

  function refreshTodayKey() {
    const nextKey = formatLocalDateKey(new Date());
    if (nextKey && nextKey !== todayKey.value) todayKey.value = nextKey;
  }

  function clearTodayKeyTimer() {
    if (!todayKeyTimer) return;
    window.clearTimeout(todayKeyTimer);
    todayKeyTimer = null;
  }

  function scheduleMidnightRefresh() {
    clearTodayKeyTimer();
    const delay = getMsUntilNextDayBoundary(new Date());
    todayKeyTimer = window.setTimeout(() => {
      refreshTodayKey();
      scheduleMidnightRefresh();
    }, delay + 250);
  }

  function onVisibilityOrFocus() {
    if (typeof document !== "undefined" && document.hidden) return;
    refreshTodayKey();
    scheduleMidnightRefresh();
  }

  onMounted(() => {
    refreshTodayKey();
    scheduleMidnightRefresh();
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
  });

  onBeforeUnmount(() => {
    clearTodayKeyTimer();
    window.removeEventListener("focus", onVisibilityOrFocus);
    document.removeEventListener("visibilitychange", onVisibilityOrFocus);
  });

  const activeSession = computed(() => sessions.value.find((s) => s.id === activeSessionId.value) || null);
  const activeMessages = computed(() => messagesBySessionId[activeSessionId.value] || []);

  const sessionsForActivePreset = computed(() =>
    sessions.value.filter((session) => String(session?.presetId || "") === resolvedActivePresetId.value)
  );

  const activeSessionDateKey = computed(() => (activeSession.value ? getSessionDateKey(activeSession.value) : ""));
  const isActiveSessionToday = computed(
    () => Boolean(activeSession.value) && activeSessionDateKey.value === todayKey.value
  );
  const isActiveSessionReadOnly = computed(() => Boolean(activeSession.value) && !isActiveSessionToday.value);

  function upsertSession(rawSession) {
    const normalized = mapSession(rawSession);
    if (!normalized?.id) return;
    const existing = sessions.value.find((s) => s.id === normalized.id);
    if (existing) {
      existing.title = normalized.title;
      existing.updatedAt = normalized.updatedAt;
      existing.presetId = normalized.presetId;
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

  async function activateSession(sessionId, { closeSidebar = true } = {}) {
    const normalizedId = String(sessionId || "");
    activeSessionId.value = normalizedId;
    if (closeSidebar) closeMobileSidebar?.();
    resetEditingState?.();
    if (!normalizedId) return;
    isDraftSession.value = false;
    await ensureMessagesLoaded(normalizedId);
  }

  function enterDraft({ closeSidebar = true } = {}) {
    isDraftSession.value = true;
    activeSessionId.value = "";
    if (closeSidebar) closeMobileSidebar?.();
    resetEditingState?.();
  }

  function resolvePresetId(rawPresetId) {
    const normalized = String(rawPresetId || resolvedActivePresetId.value || "default").trim();
    return normalized || "default";
  }

  function findTodaySessionId(presetId) {
    const resolvedPresetId = resolvePresetId(presetId);
    const dateKey = todayKey.value || formatLocalDateKey(new Date());
    if (!dateKey) return "";

    const match = sessions.value.find(
      (session) => String(session?.presetId || "") === resolvedPresetId && getSessionDateKey(session) === dateKey
    );
    return match?.id || "";
  }

  async function activateTodayContext({ presetId, closeSidebar = true } = {}) {
    const resolvedPresetId = resolvePresetId(presetId);
    const todaySessionId = findTodaySessionId(resolvedPresetId);
    if (todaySessionId) {
      await activateSession(todaySessionId, { closeSidebar });
      return todaySessionId;
    }

    enterDraft({ closeSidebar });
    return "";
  }

  async function createTodaySession({ presetId } = {}) {
    const resolvedPresetId = resolvePresetId(presetId);
    const title = todayKey.value || formatLocalDateKey(new Date());
    const created = await createChatSession({ title, settings: settings?.value, presetId: resolvedPresetId });
    const session = mapSession(created);
    if (!session) throw new Error("创建会话失败");

    sessions.value.unshift(session);
    messagesBySessionId[session.id] = [];
    return session;
  }

  async function ensureTodaySession({ presetId } = {}) {
    const resolvedPresetId = resolvePresetId(presetId);

    const todaySessionId = findTodaySessionId(resolvedPresetId);
    if (todaySessionId) {
      await activateSession(todaySessionId);
      return todaySessionId;
    }

    const session = await createTodaySession({ presetId: resolvedPresetId });
    await activateSession(session.id);
    return session.id;
  }

  async function loadSessions({ preserveActive = true } = {}) {
    const rawSessions = await listChatSessions();
    sessions.value = rawSessions.map(mapSession).filter(Boolean);
    const sessionIds = new Set(sessions.value.map((session) => session.id));
    for (const key of Object.keys(messagesBySessionId)) {
      if (!sessionIds.has(key)) delete messagesBySessionId[key];
    }

    if (!preserveActive) return;
    if (isDraftSession.value) return;

    const existingActiveId = String(activeSessionId.value || "").trim();
    if (existingActiveId && sessions.value.some((session) => session.id === existingActiveId)) return;

    await activateTodayContext({ presetId: resolvedActivePresetId.value, closeSidebar: false });
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
      sessionTitle: getSessionDateKey(target) || "该会话",
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
        await activateTodayContext({ presetId: resolvedActivePresetId.value, closeSidebar: false });
      }
    } catch (error) {
      handleApiError(error);
    }
  }

  return {
    sessions,
    messagesBySessionId,
    activeSessionId,
    activeSession,
    activeMessages,
    todayKey,
    sessionsForActivePreset,
    activeSessionDateKey,
    isActiveSessionReadOnly,
    upsertSession,
    ensureMessagesLoaded,
    activateSession,
    activateTodayContext,
    ensureTodaySession,
    loadSessions,
    selectSession,
    bringSessionToTop,
    deleteDialog,
    requestDeleteSession,
    cancelDeleteSession,
    confirmDeleteSession,
  };
}
