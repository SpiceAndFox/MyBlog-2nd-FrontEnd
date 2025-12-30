import { nextTick, reactive, ref, watch } from "vue";
import { editChatMessage, sendChatMessage, streamChatMessage, streamEditChatMessage } from "@/api/chat";
import { createId, isAbortError } from "./helpers";
import { mapMessage } from "./mappers";

export function useChatMessaging({
  settings,
  getComposerDraft,
  setComposerDraft,
  sessions,
  messagesBySessionId,
  activeSessionId,
  ensureMessagesLoaded,
  ensureTodaySession,
  isReadOnly,
  bringSessionToTop,
  upsertSession,
  handleApiError,
  editingMessageId,
  editingSessionId,
  editingOriginalContent,
  editingDraft,
  isEditingActive,
  isEditingMessage,
  resetEditingState,
}) {
  const isSending = ref(false);
  const isStreaming = ref(false);
  let activeStreamAbortController = null;

  const memoryLockMessage = ref("");

  function isMemoryRebuildingError(error) {
    return error?.code === "CHAT_MEMORY_REBUILDING" || error?.status === 423;
  }

  function restoreComposerDraftIfIdle(value) {
    if (typeof setComposerDraft !== "function") return;
    try {
      const currentDraft =
        typeof getComposerDraft === "function" ? String(getComposerDraft() ?? "") : "";
      if (currentDraft.trim()) return;
      setComposerDraft(String(value ?? ""));
    } catch {
      // ignore
    }
  }

  function setMemoryLocked(error) {
    memoryLockMessage.value = String(error?.message || "记忆重建中，请稍后再试");
  }

  function clearMemoryLocked() {
    memoryLockMessage.value = "";
  }

  watch(activeSessionId, () => {
    clearMemoryLocked();
  });

  function resolveSessionPresetId() {
    const sessionId = String(activeSessionId.value || "");
    if (!sessionId) return "";
    const session = sessions.value.find((item) => String(item?.id || "") === sessionId);
    return String(session?.presetId || session?.settings?.systemPromptPresetId || "");
  }

  function buildOutgoingSettings() {
    const base = { ...settings.value };
    const sessionPresetId = resolveSessionPresetId();
    if (sessionPresetId) {
      base.systemPromptPresetId = sessionPresetId;
    }
    return base;
  }

  function stopStreaming() {
    if (!isStreaming.value) return;
    activeStreamAbortController?.abort?.();
  }

  function requestEditMessage(message) {
    if (isSending.value || isStreaming.value || isEditingMessage.value) return;
    if (isReadOnly?.value) return;
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

  async function ensureWritableSessionId() {
    if (typeof ensureTodaySession !== "function") throw new Error("Missing ensureTodaySession");
    return await ensureTodaySession();
  }

  async function commitEditMessage(messageId) {
    if (!isEditingActive.value) return;
    if (isEditingMessage.value || isSending.value || isStreaming.value) return;
    if (isReadOnly?.value) return;

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

    clearMemoryLocked();

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
        session.updatedAt = nowIso;
        bringSessionToTop(sessionId);
      }

      await nextTick();

      const outgoingSettings = buildOutgoingSettings();

      if (outgoingSettings.stream) {
        isStreaming.value = true;
        const abortController = new AbortController();
        activeStreamAbortController = abortController;

        const optimisticAssistantMessageId = createId("tmp_msg");
        const optimisticAssistantMessage = reactive({
          id: optimisticAssistantMessageId,
          clientId: optimisticAssistantMessageId,
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
          if (isMemoryRebuildingError(error)) {
            messagesBySessionId[sessionId] = snapshot;
            setMemoryLocked(error);
            handleApiError(error, { silent: true });
            return;
          }
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
      clearMemoryLocked();
    } catch (error) {
      messagesBySessionId[sessionId] = snapshot;
      if (isMemoryRebuildingError(error)) {
        setMemoryLocked(error);
        handleApiError(error, { silent: true });
        return;
      }
      handleApiError(error);
    } finally {
      isSending.value = false;
      isEditingMessage.value = false;
    }
  }

  async function sendMessage(text) {
    if (isSending.value) return;
    if (isReadOnly?.value) return;

    const content = String(text || "").trim();
    if (!content) return;

    clearMemoryLocked();

    isSending.value = true;
    const nowIso = new Date().toISOString();

    let sessionId = "";
    let optimisticUserMessage = null;
    let optimisticAssistantMessage = null;

    try {
      sessionId = await ensureWritableSessionId();
      await ensureMessagesLoaded(sessionId);

      const optimisticUserMessageId = createId("tmp_msg");
      optimisticUserMessage = reactive({
        id: optimisticUserMessageId,
        clientId: optimisticUserMessageId,
        role: "user",
        content,
        createdAt: nowIso,
      });
      messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), optimisticUserMessage];

      const session = sessions.value.find((s) => s.id === sessionId);
      if (session) {
        session.updatedAt = nowIso;
        bringSessionToTop(sessionId);
      }

      await nextTick();

      const outgoingSettings = buildOutgoingSettings();

      if (outgoingSettings.stream) {
        isStreaming.value = true;
        const abortController = new AbortController();
        activeStreamAbortController = abortController;

        const optimisticAssistantMessageId = createId("tmp_msg");
        optimisticAssistantMessage = reactive({
          id: optimisticAssistantMessageId,
          clientId: optimisticAssistantMessageId,
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
          if (isMemoryRebuildingError(error)) {
            setMemoryLocked(error);
            restoreComposerDraftIfIdle(content);
            messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || []).filter(
              (m) => m !== optimisticUserMessage && m !== optimisticAssistantMessage
            );
            handleApiError(error, { silent: true });
            return;
          }
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
      clearMemoryLocked();
    } catch (error) {
      if (isMemoryRebuildingError(error)) {
        setMemoryLocked(error);
        restoreComposerDraftIfIdle(content);
        if (sessionId) {
          messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || []).filter(
            (m) => m !== optimisticUserMessage && m !== optimisticAssistantMessage
          );
        }
        handleApiError(error, { silent: true });
        return;
      }
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

  return {
    isSending,
    isStreaming,
    memoryLockMessage,
    stopStreaming,
    requestEditMessage,
    updateEditDraft,
    cancelEditMessage,
    commitEditMessage,
    sendMessage,
  };
}
