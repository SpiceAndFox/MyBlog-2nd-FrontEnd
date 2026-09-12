import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { getChatHealth, retryChatHealth } from "@/api/chat";

const DEGRADED_REFRESH_INTERVAL_MS = 30_000;

function normalizedWarning(warning) {
  const message = String(warning?.message || "").trim();
  if (!message) return null;
  return {
    component: String(warning?.component || "memory"),
    status: String(warning?.status || "degraded"),
    message,
    nextRetryAt: warning?.nextRetryAt || null,
    retryMode: warning?.retryMode || null,
  };
}

function deduplicateWarnings(warnings) {
  const seen = new Set();
  const result = [];
  for (const warning of warnings) {
    const normalized = normalizedWarning(warning);
    if (!normalized) continue;
    const key = `${normalized.component}\u0000${normalized.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

export function useChatHealth({ activePresetId, handleApiError } = {}) {
  const health = ref(null);
  const loadError = ref("");
  const isLoading = ref(false);
  const retrying = reactive({ memory: false });
  let requestVersion = 0;
  let refreshTimer = null;

  const warnings = computed(() => {
    const serverWarnings = Array.isArray(health.value?.warnings) ? health.value.warnings : [];
    const rows = deduplicateWarnings(serverWarnings);
    if (loadError.value) {
      rows.unshift({
        component: "health",
        status: "degraded",
        message: "暂时无法确认长期记忆是否可用",
        nextRetryAt: null,
        retryMode: "manual",
      });
    }
    return rows;
  });

  const retryableComponents = computed(() => {
    const components = new Set();
    const memoryNeedsAttention = health.value?.memory?.scope?.targets?.some(
      (target) => target?.status === "needs_attention"
    );
    if (
      memoryNeedsAttention ||
      health.value?.memory?.provider?.status === "needs_attention"
    ) {
      components.add("memory");
    }
    return [...components];
  });

  function clearRefreshTimer() {
    if (!refreshTimer) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  function scheduleRefresh(delayMs = DEGRADED_REFRESH_INTERVAL_MS, { force = false } = {}) {
    clearRefreshTimer();
    const hasServerWarning = Array.isArray(health.value?.warnings) && health.value.warnings.length > 0;
    if (!force && !hasServerWarning) return;
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      void refresh({ silent: true });
    }, delayMs);
  }

  async function refresh({ silent = true } = {}) {
    const presetId = String(activePresetId?.value || "").trim();
    if (!presetId) return null;
    const version = ++requestVersion;
    isLoading.value = true;
    try {
      const next = await getChatHealth(presetId);
      if (version !== requestVersion || presetId !== String(activePresetId?.value || "").trim()) return null;
      health.value = next;
      loadError.value = "";
      scheduleRefresh();
      return next;
    } catch (error) {
      if (version !== requestVersion) return null;
      loadError.value = String(error?.message || "获取记忆服务状态失败");
      clearRefreshTimer();
      handleApiError?.(error, { silent });
      return null;
    } finally {
      if (version === requestVersion) isLoading.value = false;
    }
  }

  async function retry(component) {
    const normalizedComponent = String(component || "").trim();
    const presetId = String(activePresetId?.value || "").trim();
    if (normalizedComponent !== "memory" || !presetId) return null;
    if (retrying[normalizedComponent]) return null;
    retrying[normalizedComponent] = true;
    try {
      const result = await retryChatHealth(normalizedComponent, presetId);
      await refresh({ silent: true });
      return result;
    } catch (error) {
      handleApiError?.(error);
      return null;
    } finally {
      retrying[normalizedComponent] = false;
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) return;
    if (warnings.value.length) void refresh({ silent: true });
  }

  watch(
    activePresetId,
    () => {
      health.value = null;
      loadError.value = "";
      clearRefreshTimer();
      void refresh({ silent: true });
    },
    { immediate: true }
  );

  document.addEventListener("visibilitychange", handleVisibilityChange);
  onBeforeUnmount(() => {
    requestVersion += 1;
    clearRefreshTimer();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  return {
    health,
    warnings,
    retryableComponents,
    isLoading,
    retrying,
    refresh,
    retry,
    scheduleRefresh,
  };
}
