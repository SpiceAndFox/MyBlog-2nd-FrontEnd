<script setup>
import { nextTick, ref } from "vue";
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
  navHeight,
  isSending,
  isStreaming,
  memoryLockMessage,
  stopStreaming,
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
  <div class="chat-page" :style="{ '--chat-nav-height': navHeight + 'px' }">
    <ChatSessionSidebar
      :sessions="sessions"
      :activeSessionId="activeSessionId"
      :collapsed="isSidebarCollapsed"
      :isMobile="isMobile"
      :mobileOpen="isMobileSidebarOpen"
      :assistantProfile="assistantProfile"
      :promptPresets="promptPresets"
      :activePresetId="settings.systemPromptPresetId"
      :presetLocked="isPresetLocked"
      @select-session="selectSession"
      @go-today="handleGoToToday"
      @toggle-collapse="toggleSidebarCollapsed"
      @request-close="closeMobileSidebar"
      @request-delete-session="requestDeleteSession"
      @select-preset="selectPreset"
      @open-presets="openPresets"
      @open-trash="openTrash"
      @open-settings="openSettings"
    />

    <ChatConversationPanel
      ref="conversationPanelRef"
      class="chat-conversation"
      :sessionTitle="activeSessionDateKey || todayKey || DEFAULT_SESSION_TITLE"
      :messages="activeMessages"
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
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
      @open-sidebar="openMobileSidebar"
      @go-today="handleGoToToday"
      @send-message="sendMessage"
      @stop-output="stopStreaming"
      @request-edit-message="requestEditMessage"
      @update-edit-draft="updateEditDraft"
      @commit-edit-message="commitEditMessage"
      @cancel-edit-message="cancelEditMessage"
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
      :refreshPresets="() => refreshPromptPresets({ silent: false, forceSystemPrompt: true })"
      :createPreset="createPromptPreset"
      :updatePreset="updatePromptPreset"
      :deletePreset="deletePromptPreset"
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
  /* Light / ChatGPT-like theme */
  --chat-sidebar-bg: #f9fafb;
  --chat-sidebar-border: rgba(15, 23, 42, 0.12);
  --chat-sidebar-text: rgba(15, 23, 42, 0.92);
  --chat-sidebar-muted: rgba(15, 23, 42, 0.58);
  --chat-sidebar-hover: rgba(15, 23, 42, 0.05);
  --chat-sidebar-active: rgba(15, 23, 42, 0.06);
  --chat-sidebar-actions-bg: rgba(255, 255, 255, 0.82);

  --chat-surface: #ffffff;
  --chat-surface-2: #ffffff;
  --chat-border: rgba(15, 23, 42, 0.12);
  --chat-text: #0f172a;
  --chat-muted: rgba(15, 23, 42, 0.58);

  --chat-accent: #10a37f;
  --chat-accent-strong: #0f8a6c;

  --chat-topbar-bg: rgba(255, 255, 255, 0.92);
  --chat-topbar-hover: rgba(15, 23, 42, 0.05);
  --chat-composer-bg: rgba(255, 255, 255, 0.92);

  --chat-bubble-bg: rgba(255, 255, 255, 0.98);
  --chat-bubble-user-bg: rgba(15, 23, 42, 0.04);
  --chat-bubble-border: rgba(15, 23, 42, 0.1);
  --chat-bubble-user-border: rgba(132, 188, 240, 0.22);

  --chat-avatar-bg: rgba(15, 23, 42, 0.12);
  --chat-avatar-text: rgba(15, 23, 42, 0.92);
  --chat-avatar-user-bg: var(--chat-accent);
  --chat-avatar-user-text: #ffffff;

  --chat-card-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

  --chat-radius-lg: 14px;
  --chat-radius-md: 10px;
  --chat-radius-sm: 8px;

  --chat-nav-height: 60px;

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
