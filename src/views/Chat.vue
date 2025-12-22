<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ChatSessionSidebar from "@/components/Chat/ChatSessionSidebar.vue";
import ChatConversationPanel from "@/components/Chat/ChatConversationPanel.vue";
import ChatSettingsModal from "@/components/Chat/ChatSettingsModal.vue";
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
  navHeight,
  isSending,
  isStreaming,
  stopStreaming,
  providers,
  promptPresets,
  chatDefaults,
  settings,
  sessions,
  activeSessionId,
  activeSession,
  activeMessages,
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
  selectSession,
  createNewSession,
  renameSession,
  deleteDialog,
  requestDeleteSession,
  cancelDeleteSession,
  confirmDeleteSession,
  sendMessage,
  requestEditMessage,
  updateEditDraft,
  commitEditMessage,
  cancelEditMessage,
  openSettings,
  closeSettings,
  saveSettings,
} = useChatPage({ router });

const conversationPanelRef = ref(null);

useChatComposerSlashFocus({
  isSettingsOpen,
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
      :promptPresets="promptPresets"
      @select-session="selectSession"
      @create-session="createNewSession"
      @toggle-collapse="toggleSidebarCollapsed"
      @request-close="closeMobileSidebar"
      @request-rename-session="renameSession"
      @request-delete-session="requestDeleteSession"
      @open-settings="openSettings"
    />

    <ChatConversationPanel
      ref="conversationPanelRef"
      class="chat-conversation"
      :sessionTitle="activeSession?.title || DEFAULT_SESSION_TITLE"
      :messages="activeMessages"
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
      :isMobile="isMobile"
      :isSending="isSending"
      :isStreaming="isStreaming"
      :isEditingActive="isEditingActive"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="isEditingMessage"
      @open-sidebar="openMobileSidebar"
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
      :promptPresets="promptPresets"
      :currentSettings="settings"
      :defaultSettings="chatDefaults"
      :refreshPresets="() => refreshPromptPresets({ silent: false, forceSystemPrompt: true })"
      :createPreset="createPromptPreset"
      :updatePreset="updatePromptPreset"
      :deletePreset="deletePromptPreset"
      :uploadPresetAvatar="uploadPromptPresetAvatar"
      @close="closeSettings"
      @save="saveSettings"
    />

    <ChatConfirmDialog
      :open="deleteDialog.open"
      title="删除会话"
      :message="`确定要删除“${deleteDialog.sessionTitle}”吗？此操作会删除该会话的所有聊天记录，且不可恢复。`"
      confirmText="删除"
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
