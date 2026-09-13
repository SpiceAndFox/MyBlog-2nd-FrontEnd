<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ChatSessionSidebar from "@/components/Chat/ChatSessionSidebar.vue";
import ChatConversationPanel from "@/components/Chat/ChatConversationPanel.vue";
import ChatSettingsModal from "@/components/Chat/ChatSettingsModal.vue";
import ChatPresetModal from "@/components/Chat/ChatPresetModal.vue";
import ChatTrashModal from "@/components/Chat/ChatTrashModal.vue";
import ChatConfirmDialog from "@/components/Chat/ChatConfirmDialog.vue";
import { DEFAULT_SESSION_TITLE } from "@/config/chat";
import { useChatComposerSlashFocus } from "./chat/useChatComposerSlashFocus";
import { useChatPage } from "./chat/useChatPage";

const router = useRouter();

const {
  isMobile,
  isSidebarCollapsed,
  isMobileSidebarOpen,
  isSettingsOpen,
  isPresetsOpen,
  isTrashOpen,
  isSending,
  isStreaming,
  memoryLockMessage,
  stopStreaming,
  healthWarnings,
  healthRetryableComponents,
  isHealthLoading,
  healthRetrying,
  refreshHealth,
  retryHealth,
  providers,
  promptPresets,
  chatDefaults,
  settings,
  isPresetLocked,
  composerDraft,
  dayRollover,
  sessions,
  activeSessionId,
  activeSession,
  activeMessages,
  isReadOnly,
  todayKey,
  activeSessionDateKey,
  userProfile,
  assistantProfile,
  editingMessageId,
  editingDraft,
  isEditingActive,
  isEditingMessage,
  refreshPromptPresets,
  createPromptPreset,
  updatePromptPreset,
  deletePromptPreset,
  rebuildPromptPresetMemory,
  uploadPromptPresetAvatar,
  openMobileSidebar,
  closeMobileSidebar,
  toggleSidebarCollapsed,
  goToToday,
  selectSession,
  deleteDialog,
  requestDeleteSession,
  cancelDeleteSession,
  confirmDeleteSession,
  sendMessage,
  requestEditMessage,
  updateEditDraft,
  commitEditMessage,
  cancelEditMessage,
  trashedSessions,
  trashedPresets,
  isTrashLoading,
  refreshTrash,
  openTrash,
  closeTrash,
  restoreTrashedSession,
  deleteTrashedSessionPermanently,
  restoreTrashedPreset,
  deleteTrashedPresetPermanently,
  openSettings,
  closeSettings,
  saveSettings,
  openPresets,
  selectPreset,
  closePresets,
  savePresetSelection,
} = useChatPage({ router });

const conversationPanelRef = ref(null);
const sidebarRef = ref(null);
const pageRef = ref(null);
let dialogReturnFocus = null;
const anyDialogOpen = computed(
  () =>
    isSettingsOpen.value ||
    isPresetsOpen.value ||
    isTrashOpen.value ||
    deleteDialog.value?.open,
);

function activeDialog() {
  return pageRef.value?.querySelector(
    '.modal-overlay[role="dialog"], .dialog-overlay[role="dialog"]',
  );
}

function dialogControls() {
  return Array.from(
    activeDialog()?.querySelectorAll(
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
    ) || [],
  ).filter((element) => element.getClientRects().length > 0);
}

watch(anyDialogOpen, async (open) => {
  if (open) dialogReturnFocus = document.activeElement;
  await nextTick();
  if (open) dialogControls()[0]?.focus();
  else if (
    dialogReturnFocus?.isConnected &&
    dialogReturnFocus.getClientRects().length
  )
    dialogReturnFocus.focus();
  else if (isMobile.value) conversationPanelRef.value?.focusSidebarButton?.();
  else sidebarRef.value?.focusToggle();
});

function onDialogKeydown(event) {
  if (!anyDialogOpen.value || event.key !== "Tab") return;
  const controls = dialogControls();
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

watch(isMobileSidebarOpen, async (open, wasOpen) => {
  if (open || !wasOpen || anyDialogOpen.value) return;
  await nextTick();
  if (isMobile.value) conversationPanelRef.value?.focusSidebarButton?.();
  else sidebarRef.value?.focusToggle();
});

async function handleGoToToday(options) {
  await goToToday(options);
  await nextTick();
  conversationPanelRef.value?.focusComposer?.();
}

useChatComposerSlashFocus({
  isSettingsOpen,
  isPresetsOpen,
  isTrashOpen,
  deleteDialog,
  focusComposer: () => conversationPanelRef.value?.focusComposer?.(),
});
</script>

<template>
  <div ref="pageRef" class="chat-page" @keydown="onDialogKeydown">
    <ChatSessionSidebar
      ref="sidebarRef"
      :inert="anyDialogOpen ? true : undefined"
      :sessions="sessions"
      :activeSessionId="activeSessionId"
      :collapsed="isSidebarCollapsed"
      :isMobile="isMobile"
      :mobileOpen="isMobileSidebarOpen"
      :todayKey="todayKey"
      @select-session="selectSession"
      @toggle-collapse="toggleSidebarCollapsed"
      @request-close="closeMobileSidebar"
      @request-delete-session="requestDeleteSession"
      @open-presets="openPresets"
      @open-trash="openTrash"
      @open-settings="openSettings"
    />

    <ChatConversationPanel
      ref="conversationPanelRef"
      class="chat-conversation"
      :inert="
        anyDialogOpen || (isMobile && isMobileSidebarOpen) ? true : undefined
      "
      :sessionTitle="activeSessionDateKey || todayKey || DEFAULT_SESSION_TITLE"
      :messages="activeMessages"
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
      :promptPresets="promptPresets"
      :activePresetId="settings.systemPromptPresetId"
      :presetLocked="isPresetLocked"
      :todayKey="todayKey"
      :isMobile="isMobile"
      :readOnly="isReadOnly"
      v-model:composerDraft="composerDraft"
      :dayRollover="dayRollover"
      :isSending="isSending"
      :isStreaming="isStreaming"
      :memoryLockMessage="memoryLockMessage"
      :isEditingActive="isEditingActive"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="isEditingMessage"
      :healthWarnings="healthWarnings"
      :healthRetryableComponents="healthRetryableComponents"
      :healthLoading="isHealthLoading"
      :healthRetrying="healthRetrying"
      @open-sidebar="openMobileSidebar"
      @select-preset="selectPreset"
      @open-presets="openPresets"
      @open-settings="openSettings"
      @open-trash="openTrash"
      @go-today="handleGoToToday"
      @send-message="sendMessage"
      @stop-output="stopStreaming"
      @request-edit-message="requestEditMessage"
      @update-edit-draft="updateEditDraft"
      @commit-edit-message="commitEditMessage"
      @cancel-edit-message="cancelEditMessage"
      @refresh-health="refreshHealth"
      @retry-health="retryHealth"
    />

    <ChatSettingsModal
      :open="isSettingsOpen"
      :providers="providers"
      :currentSettings="settings"
      :defaultSettings="chatDefaults"
      @close="closeSettings"
      @save="saveSettings"
    />

    <ChatPresetModal
      :open="isPresetsOpen"
      :promptPresets="promptPresets"
      :currentSettings="settings"
      :defaultSettings="chatDefaults"
      :presetLocked="isPresetLocked"
      :refreshPresets="
        () => refreshPromptPresets({ silent: false, forceSystemPrompt: true })
      "
      :createPreset="createPromptPreset"
      :updatePreset="updatePromptPreset"
      :deletePreset="deletePromptPreset"
      :rebuildPresetMemory="rebuildPromptPresetMemory"
      :uploadPresetAvatar="uploadPromptPresetAvatar"
      @close="closePresets"
      @save="savePresetSelection"
    />

    <ChatTrashModal
      :open="isTrashOpen"
      :sessions="trashedSessions"
      :presets="trashedPresets"
      :promptPresets="promptPresets"
      :loading="isTrashLoading"
      @close="closeTrash"
      @refresh="refreshTrash"
      @restore-session="restoreTrashedSession"
      @delete-session-permanent="deleteTrashedSessionPermanently"
      @restore-preset="restoreTrashedPreset"
      @delete-preset-permanent="deleteTrashedPresetPermanently"
    />

    <ChatConfirmDialog
      :open="deleteDialog.open"
      :title="deleteDialog.step === 2 ? '二次确认' : '移入回收站'"
      :message="
        deleteDialog.step === 2
          ? '注意：移入回收站会触发该预设的“记忆重建”，期间将暂时无法继续对话，并可能产生额外模型调用开销。仍要继续吗？'
          : `确定要将“${deleteDialog.sessionTitle}”移入回收站吗？你可以在回收站中恢复，或彻底删除。`
      "
      :confirmText="deleteDialog.step === 2 ? '确认移入回收站' : '继续'"
      cancelText="取消"
      @confirm="confirmDeleteSession"
      @cancel="cancelDeleteSession"
    />
  </div>
</template>

<style scoped>
.chat-page {
  --chat-sidebar-bg: #f7f6f3;
  --chat-sidebar-border: #eae9e4;
  --chat-sidebar-text: #393934;
  --chat-sidebar-muted: #74746c;
  --chat-sidebar-hover: #eeede8;
  --chat-sidebar-active: var(--chat-accent-soft);
  --chat-sidebar-actions-bg: #f7f6f3;

  --chat-surface: #fffefd;
  --chat-surface-2: #f7f6f3;
  --chat-border: #eae9e4;
  --chat-text: #393934;
  --chat-muted: #74746c;
  --chat-scrollbar: #d3d1c9;

  --chat-accent: #996a77;
  --chat-accent-strong: #825563;
  --chat-accent-soft: #f0e7e9;
  --chat-focus-ring: #e5d4da;
  --chat-overlay: rgba(53, 48, 45, 0.32);

  --chat-topbar-bg: #fffefd;
  --chat-topbar-hover: #eeede8;
  --chat-composer-bg: #fffefd;

  --chat-bubble-bg: transparent;
  --chat-bubble-user-bg: #f7f6f3;
  --chat-bubble-border: transparent;
  --chat-bubble-user-border: transparent;

  --chat-avatar-bg: #e7ddd6;
  --chat-avatar-text: #766355;
  --chat-avatar-user-bg: var(--chat-accent);
  --chat-avatar-user-text: #ffffff;

  --chat-card-shadow: 0 8px 28px rgba(53, 53, 47, 0.08);

  --chat-radius-lg: 14px;
  --chat-radius-md: 10px;
  --chat-radius-sm: 8px;

  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  overflow: hidden;
  overscroll-behavior: none;
  position: relative;

  background: var(--chat-surface);
}

.chat-conversation {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
