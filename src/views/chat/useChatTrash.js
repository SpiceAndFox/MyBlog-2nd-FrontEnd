import { ref } from "vue";
import { deleteChatSessionPermanently, listChatTrashedSessions, restoreChatSession } from "@/api/chat";
import { mapSession } from "./mappers";

export function useChatTrash({ handleApiError } = {}) {
  const trashedSessions = ref([]);
  const isTrashLoading = ref(false);

  async function refreshTrash({ silent = false } = {}) {
    if (isTrashLoading.value) return trashedSessions.value;
    isTrashLoading.value = true;
    try {
      const rawSessions = await listChatTrashedSessions();
      trashedSessions.value = rawSessions.map(mapSession).filter(Boolean);
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

  return {
    trashedSessions,
    isTrashLoading,
    refreshTrash,
    restore,
    deletePermanently,
  };
}
