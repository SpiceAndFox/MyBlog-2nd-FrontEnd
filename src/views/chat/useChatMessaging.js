import { computed, nextTick, reactive, ref, watch } from "vue";
import { isMemoryPendingError, memoryBlockingMessage } from "./memoryReadiness";
import { editChatMessage, getChatPrivacyOperation, listChatMessages, resumeChatMessage, sendChatMessage, streamChatMessage } from "@/api/chat";
import { createId, isAbortError } from "./helpers";
import { mapMessage } from "./mappers";

export function useChatMessaging({
  memoryHealth,
  refreshMemoryHealth,
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
  const resumingMessageId = ref("");
  let activeStreamAbortController = null;

  const pendingMemoryMessage = ref("");
  const memoryLockMessage = computed(() => memoryBlockingMessage(memoryHealth?.value) || pendingMemoryMessage.value);
  const pendingTurns = new Map();

  function isMemoryRebuildingError(error) {
    return isMemoryPendingError(error);
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
    pendingMemoryMessage.value = error?.code === "CHAT_PRIVACY_PENDING"
      ? "记忆正在重建，完成前暂时无法发送新消息"
      : String(error?.message || "记忆重建中，请稍后再试");
    void refreshMemoryHealth?.();
  }

  function clearMemoryLocked() {
    pendingMemoryMessage.value = "";
  }

  if (memoryHealth) watch(memoryHealth, (health) => {
    if (health?.memory?.scope?.chatBlocked === false) clearMemoryLocked();
  });

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

  function applyUserMessagePayload(optimisticUserMessage, rawMessage) {
    if (!rawMessage || !optimisticUserMessage) return null;
    const mapped = mapMessage(rawMessage);
    if (!mapped) return null;
    optimisticUserMessage.id = mapped.id;
    optimisticUserMessage.role = mapped.role;
    optimisticUserMessage.content = mapped.content;
    optimisticUserMessage.createdAt = mapped.createdAt;
    optimisticUserMessage.replyStatus = mapped.replyStatus;
    optimisticUserMessage.canResume = mapped.canResume;
    optimisticUserMessage.replyInFlight = isSending.value;
    return mapped;
  }

  function removeOptimisticTurn(sessionId, optimisticUserMessage, optimisticAssistantMessage) {
    if (!sessionId) return;
    messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || []).filter(
      (m) => m !== optimisticUserMessage && m !== optimisticAssistantMessage
    );
  }

  function keepPendingTurn(error, sessionId, content, idempotencyKey, userMessage, assistantMessage) {
    const persisted = applyServerPayload(sessionId, error?.data, { optimisticUserMessage: userMessage }).userMessage;
    if (persisted) {
      userMessage.replyStatus = "incomplete";
      userMessage.canResume = true;
      userMessage.replyInFlight = false;
      pendingTurns.set(sessionId, { content, idempotencyKey, messageId: persisted.id });
      messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || []).filter(message => message !== assistantMessage);
    } else {
      removeOptimisticTurn(sessionId, userMessage, assistantMessage);
    }
    restoreComposerDraftIfIdle(content);
    setMemoryLocked(error);
  }

  async function waitForPrivacyOperation(operationId, targetStatus, signal) {
    const intervalMs = 1000;
    while (true) {
      if (signal?.aborted) throw new Error("aborted");
      const { privacy } = await getChatPrivacyOperation(operationId);
      if (String(privacy?.status) === String(targetStatus)) return;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  async function resumeRegeneration(sessionId, {
    content,
    settings,
    regeneration,
    privacy,
    optimisticUserMessage,
    optimisticAssistantMessage,
    signal,
    onError,
  }) {
    if (regeneration?.status === "blocked_until_privacy_completed") {
      const operationId = privacy?.operationId;
      if (!operationId) throw new Error("缺少隐私操作ID，无法恢复生成");
      pendingMemoryMessage.value = "记忆正在重建，完成后将自动继续生成；长对话可能需要较长时间…";
      try {
        await waitForPrivacyOperation(operationId, regeneration.resumeAfterStatus || "completed", signal);
      } finally {
        clearMemoryLocked();
      }
    }
    const idempotencyKey = regeneration?.idempotencyKey;
    if (!idempotencyKey) throw new Error("缺少幂等键，无法恢复生成");
    try {
      if (settings?.stream) {
        await streamChatMessage(sessionId, {
          content,
          settings,
          idempotencyKey,
          signal,
          onStart: (payload) => {
            applyServerPayload(sessionId, payload, { optimisticUserMessage });
          },
          onDelta: (delta) => {
            if (optimisticAssistantMessage) optimisticAssistantMessage.content += delta;
          },
          onDone: (payload) => {
            applyServerPayload(sessionId, payload, { optimisticUserMessage, optimisticAssistantMessage });
          },
          onError: (message) => {
            if (optimisticAssistantMessage) optimisticAssistantMessage.content = `（请求失败）${message}`;
            onError?.(message);
          },
        });
      } else {
        const result = await sendChatMessage(sessionId, { content, settings, idempotencyKey });
        applyServerPayload(sessionId, result, { optimisticUserMessage, optimisticAssistantMessage });
      }
      pendingTurns.delete(sessionId);
    } catch (error) {
      if (isMemoryRebuildingError(error)) {
        keepPendingTurn(error, sessionId, content, idempotencyKey, optimisticUserMessage, optimisticAssistantMessage);
      }
      throw error;
    }
  }

  function applyServerPayload(sessionId, payload, { optimisticUserMessage, optimisticAssistantMessage } = {}) {
    const applied = { userMessage: null, assistantMessage: null };

    if (payload?.session) {
      upsertSession(payload.session);
      bringSessionToTop(sessionId);
    }

    if (payload?.user_message && optimisticUserMessage) {
      applied.userMessage = applyUserMessagePayload(optimisticUserMessage, payload.user_message);
    }

    if (payload?.assistant_message) {
      const mapped = mapMessage(payload.assistant_message);
      if (!mapped) return applied;
      applied.assistantMessage = mapped;
      if (optimisticUserMessage) {
        optimisticUserMessage.replyStatus = "complete";
        optimisticUserMessage.canResume = false;
        optimisticUserMessage.replyInFlight = false;
      }

      if (optimisticAssistantMessage) {
        optimisticAssistantMessage.id = mapped.id;
        optimisticAssistantMessage.createdAt = mapped.createdAt;
        optimisticAssistantMessage.content = mapped.content || optimisticAssistantMessage.content;
        return applied;
      }

      messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), mapped];
    }

    return applied;
  }

  async function refreshTurnMessages(sessionId) {
    try {
      const messages = await listChatMessages(sessionId);
      messagesBySessionId[sessionId] = messages.map(mapMessage).filter(Boolean);
    } catch {
      // Retain the known persisted turn while offline; a page reload also
      // reconstructs reply status from the server, without a local retry key.
    }
  }

  async function recoverFailedTurn(error, sessionId, userMessage, assistantMessage) {
    applyServerPayload(sessionId, error?.data, { optimisticUserMessage: userMessage });
    const persisted = /^\d+$/.test(String(userMessage?.id || ""));
    messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || [])
      .filter(entry => entry !== assistantMessage && (persisted || entry !== userMessage));
    if (persisted) {
      userMessage.replyStatus = "incomplete";
      userMessage.canResume = true;
      userMessage.replyInFlight = false;
      userMessage.replyError = isAbortError(error) ? "回复已中断，可以补回复" : String(error?.message || "回复未完成");
    } else {
      restoreComposerDraftIfIdle(userMessage?.content || "");
    }
    // The server may have committed even when the response was lost.
    await refreshTurnMessages(sessionId);
    if (!isAbortError(error)) handleApiError(error, { silent: persisted });
  }

  async function resumeReply(message) {
    if (isSending.value || isStreaming.value || isEditingActive.value || isEditingMessage.value || memoryLockMessage.value) return;
    const sessionId = String(activeSessionId.value || "");
    const target = (messagesBySessionId[sessionId] || []).find(entry => entry.id === message?.id);
    if (!sessionId || target?.role !== "user" || !target.canResume || target.replyStatus !== "incomplete") return;
    isSending.value = true;
    resumingMessageId.value = target.id;
    target.replyInFlight = true;
    target.replyError = "";
    const outgoingSettings = buildOutgoingSettings();
    const abortController = new AbortController();
    activeStreamAbortController = abortController;
    isStreaming.value = Boolean(outgoingSettings.stream);
    const optimisticAssistantMessage = reactive({ id: createId("tmp_msg"), role: "assistant", content: "",
      createdAt: new Date().toISOString() });
    messagesBySessionId[sessionId] = [...messagesBySessionId[sessionId], optimisticAssistantMessage];
    let completed = false;
    try {
      await resumeChatMessage(sessionId, target.id, {
        settings: outgoingSettings, signal: abortController.signal,
        onStart: payload => applyServerPayload(sessionId, payload, { optimisticUserMessage: target }),
        onDelta: delta => { optimisticAssistantMessage.content += delta; },
        onDone: payload => {
          applyServerPayload(sessionId, payload, { optimisticUserMessage: target, optimisticAssistantMessage });
          completed = Boolean(payload?.assistant_message);
        },
      });
      if (!completed) throw new Error("回复尚未完成，请重试补回复");
      pendingTurns.delete(sessionId);
      clearMemoryLocked();
    } catch (error) {
      target.replyError = isAbortError(error) ? "回复已中断，可以再次补回复" : String(error?.message || "补回复失败");
      target.replyInFlight = false;
      if (error?.code === "CHAT_RESUME_NOT_LATEST" || error?.code === "CHAT_RESUME_UNAVAILABLE") target.canResume = false;
      if (isMemoryRebuildingError(error)) setMemoryLocked(error);
      handleApiError(error, { silent: true });
    } finally {
      if (!completed) {
        messagesBySessionId[sessionId] = (messagesBySessionId[sessionId] || []).filter(entry => entry !== optimisticAssistantMessage);
        await refreshTurnMessages(sessionId);
      }
      if (activeStreamAbortController === abortController) activeStreamAbortController = null;
      target.replyInFlight = false;
      isStreaming.value = false;
      isSending.value = false;
      resumingMessageId.value = "";
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
    let editCommitted = false;

    try {
      await ensureMessagesLoaded(sessionId);

      const list = messagesBySessionId[sessionId] || [];
      const messageIndex = list.findIndex((m) => String(m.id) === targetMessageId);
      if (messageIndex === -1) throw new Error("未找到要修改的消息");

      const targetMessage = list[messageIndex];
      targetMessage.replyInFlight = true;
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
          const editResult = await editChatMessage(sessionId, targetMessageId, {
            content: normalizedContent,
            truncate: true,
            regenerate: true,
            settings: outgoingSettings,
            signal: abortController.signal,
          });
          editCommitted = true;
          applyServerPayload(sessionId, editResult, { optimisticUserMessage: targetMessage });

          if (editResult.kind === "regeneration_required" || editResult.kind === "privacy_pending") {
            await resumeRegeneration(sessionId, {
              content: normalizedContent,
              settings: outgoingSettings,
              regeneration: editResult.regeneration,
              privacy: editResult.privacy,
              optimisticUserMessage: targetMessage,
              optimisticAssistantMessage,
              signal: abortController.signal,
            });
            clearMemoryLocked();
          } else {
            applyServerPayload(sessionId, editResult, { optimisticUserMessage: targetMessage });
            clearMemoryLocked();
          }
        } catch (error) {
          if (!editCommitted) {
            messagesBySessionId[sessionId] = snapshot;
            handleApiError(error);
            return;
          }
          if (isMemoryRebuildingError(error)) {
            setMemoryLocked(error);
            handleApiError(error, { silent: true });
            return;
          }
          await recoverFailedTurn(error, sessionId, targetMessage, optimisticAssistantMessage);
        } finally {
          if (activeStreamAbortController === abortController) activeStreamAbortController = null;
          isStreaming.value = false;
        }

        return;
      }

      const editResult = await editChatMessage(sessionId, targetMessageId, {
        content: normalizedContent,
        truncate: true,
        regenerate: true,
        settings: outgoingSettings,
      });
      editCommitted = true;
      applyServerPayload(sessionId, editResult, { optimisticUserMessage: targetMessage });

      if (editResult.kind === "regeneration_required" || editResult.kind === "privacy_pending") {
        await resumeRegeneration(sessionId, {
          content: normalizedContent,
          settings: outgoingSettings,
          regeneration: editResult.regeneration,
          privacy: editResult.privacy,
          optimisticUserMessage: targetMessage,
        });
        clearMemoryLocked();
      } else {
        applyServerPayload(sessionId, editResult, { optimisticUserMessage: targetMessage });
        clearMemoryLocked();
      }
    } catch (error) {
      if (!editCommitted) messagesBySessionId[sessionId] = snapshot;
      if (isMemoryRebuildingError(error)) {
        setMemoryLocked(error);
        handleApiError(error, { silent: true });
        return;
      }
      if (editCommitted) {
        const target = (messagesBySessionId[sessionId] || []).find(message => message.id === targetMessageId);
        await recoverFailedTurn(error, sessionId, target);
      } else handleApiError(error);
    } finally {
      const target = (messagesBySessionId[sessionId] || []).find(message => message.id === targetMessageId);
      if (target) target.replyInFlight = false;
      isSending.value = false;
      isEditingMessage.value = false;
    }
  }

  async function sendMessage(text) {
    if (isSending.value) return;
    if (isReadOnly?.value) return;
    if (memoryLockMessage.value) return;

    const content = String(text || "").trim();
    if (!content) return;

    clearMemoryLocked();

    isSending.value = true;
    const nowIso = new Date().toISOString();

    let sessionId = "";
    let optimisticUserMessage = null;
    let optimisticAssistantMessage = null;
    let idempotencyKey = createId("chat_turn");

    try {
      sessionId = await ensureWritableSessionId();
      await ensureMessagesLoaded(sessionId);

      const pending = pendingTurns.get(sessionId);
      if (pending?.content === content) {
        idempotencyKey = pending.idempotencyKey;
        optimisticUserMessage = (messagesBySessionId[sessionId] || []).find(message => message.id === pending.messageId);
      }

      if (!optimisticUserMessage) {
        const optimisticUserMessageId = createId("tmp_msg");
        optimisticUserMessage = reactive({
          id: optimisticUserMessageId,
          clientId: optimisticUserMessageId,
          role: "user",
          content,
          createdAt: nowIso,
        });
        messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), optimisticUserMessage];
      }
      optimisticUserMessage.replyInFlight = true;

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
            idempotencyKey,
            settings: outgoingSettings,
            signal: abortController.signal,
            onStart: (payload) => {
              applyServerPayload(sessionId, payload, { optimisticUserMessage });
            },
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
          pendingTurns.delete(sessionId);
        } catch (error) {
          if (isMemoryRebuildingError(error)) {
            keepPendingTurn(error, sessionId, content, idempotencyKey, optimisticUserMessage, optimisticAssistantMessage);
            handleApiError(error, { silent: true });
            return;
          }
          await recoverFailedTurn(error, sessionId, optimisticUserMessage, optimisticAssistantMessage);
        } finally {
          if (activeStreamAbortController === abortController) activeStreamAbortController = null;
          isStreaming.value = false;
        }

        return;
      }

      const result = await sendChatMessage(sessionId, { content, settings: outgoingSettings, idempotencyKey });
      applyServerPayload(sessionId, result, { optimisticUserMessage });
      pendingTurns.delete(sessionId);
      clearMemoryLocked();
    } catch (error) {
      if (isMemoryRebuildingError(error)) {
        keepPendingTurn(error, sessionId, content, idempotencyKey, optimisticUserMessage, optimisticAssistantMessage);
        handleApiError(error, { silent: true });
        return;
      }
      if (sessionId) await recoverFailedTurn(error, sessionId, optimisticUserMessage, optimisticAssistantMessage);
      else handleApiError(error);
    } finally {
      if (optimisticUserMessage) optimisticUserMessage.replyInFlight = false;
      isSending.value = false;
    }
  }

  return {
    isSending,
    isStreaming,
    resumingMessageId,
    resumeReply,
    memoryLockMessage,
    stopStreaming,
    requestEditMessage,
    updateEditDraft,
    cancelEditMessage,
    commitEditMessage,
    sendMessage,
  };
}
