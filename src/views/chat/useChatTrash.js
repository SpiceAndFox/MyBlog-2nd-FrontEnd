import { ref } from "vue";
import {
  deleteChatPresetPermanently,
  deleteChatSessionPermanently,
  listChatTrashedPresets,
  listChatTrashedSessions,
  restoreChatPreset,
  restoreChatSession,
} from "@/api/chat";
import { mapPreset, mapSession } from "./mappers";

export function useChatTrash({ handleApiError } = {}) {
  const trashedSessions = ref([]);
  const trashedPresets = ref([]);
  const isTrashLoading = ref(false);

  async function refreshTrash({ silent = false } = {}) {
    if (isTrashLoading.value) return trashedSessions.value;
    isTrashLoading.value = true;
    try {
      const [rawSessions, rawPresets] = await Promise.all([listChatTrashedSessions(), listChatTrashedPresets()]);
      trashedSessions.value = rawSessions.map(mapSession).filter(Boolean);
      trashedPresets.value = rawPresets.map(mapPreset).filter((p) => p && p.id);
      return trashedSessions.value;
    } catch (error) {
      handleApiError?.(error, { silent });
      return trashedSessions.value;
    } finally {
      isTrashLoading.value = false;
    }
  }

  async function restore(sessionId) {
    try {
      const restored = await restoreChatSession(sessionId);
      await refreshTrash({ silent: true });
      return restored;
    } catch (error) {
      handleApiError?.(error);
      throw error;
    }
  }

  async function deletePermanently(sessionId) {
    try {
      await deleteChatSessionPermanently(sessionId);
      await refreshTrash({ silent: true });
    } catch (error) {
      handleApiError?.(error);
      throw error;
    }
  }

  async function restorePreset(presetId) {
    try {
      const restored = await restoreChatPreset(presetId);
      await refreshTrash({ silent: true });
      return restored;
    } catch (error) {
      handleApiError?.(error);
      throw error;
    }
  }

  async function deletePresetPermanently(presetId) {
    try {
      await deleteChatPresetPermanently(presetId);
      await refreshTrash({ silent: true });
    } catch (error) {
      handleApiError?.(error);
      throw error;
    }
  }

  return {
    trashedSessions,
    trashedPresets,
    isTrashLoading,
    refreshTrash,
    restore,
    deletePermanently,
    restorePreset,
    deletePresetPermanently,
  };
}
