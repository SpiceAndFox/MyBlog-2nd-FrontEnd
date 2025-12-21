import { computed, reactive, ref } from "vue";
import {
  createChatSession,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
  renameChatSession,
} from "@/api/chat";
import { DEFAULT_SESSION_TITLE } from "./constants";
import { mapMessage, mapSession } from "./mappers";

export function useChatSessions({ settings, handleApiError, closeMobileSidebar, resetEditingState }) {
  const sessions = ref([]);
  const messagesBySessionId = reactive({});
  const activeSessionId = ref("");

  const activeSession = computed(() => sessions.value.find((s) => s.id === activeSessionId.value) || null);
  const activeMessages = computed(() => messagesBySessionId[activeSessionId.value] || []);

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

  async function activateSession(sessionId, { closeSidebar = true } = {}) {
    const normalizedId = String(sessionId || "");
    activeSessionId.value = normalizedId;
    if (closeSidebar) closeMobileSidebar?.();
    resetEditingState?.();
    if (!normalizedId) return;
    await ensureMessagesLoaded(normalizedId);
  }

  async function loadSessions() {
    const rawSessions = await listChatSessions();
    sessions.value = rawSessions.map(mapSession).filter(Boolean);
    await activateSession(sessions.value[0]?.id || "", { closeSidebar: false });
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

  return {
    sessions,
    messagesBySessionId,
    activeSessionId,
    activeSession,
    activeMessages,
    upsertSession,
    ensureMessagesLoaded,
    activateSession,
    loadSessions,
    selectSession,
    bringSessionToTop,
    createSession,
    createNewSession,
    renameSession,
    deleteDialog,
    requestDeleteSession,
    cancelDeleteSession,
    confirmDeleteSession,
  };
}
