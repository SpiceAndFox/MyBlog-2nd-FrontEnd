<script setup>
import { computed } from "vue";
import ChatSessionListItem from "@/components/Chat/ChatSessionListItem.vue";

const props = defineProps({
  sessions: { type: Array, required: true },
  activeSessionId: { type: String, default: "" },
  collapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
  promptPresets: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "select-session",
  "create-session",
  "toggle-collapse",
  "request-close",
  "request-rename-session",
  "request-delete-session",
  "open-trash",
  "open-settings",
]);

const effectiveCollapsed = computed(() => !props.isMobile && props.collapsed);
const shouldShow = computed(() => !props.isMobile || props.mobileOpen);

function onOverlayClick() {
  if (!props.isMobile) return;
  emit("request-close");
}
</script>

<template>
  <transition name="chat-overlay-fade">
    <div
      v-show="shouldShow"
      :class="isMobile ? 'mobile-overlay' : 'desktop-wrapper'"
      @click.self="onOverlayClick"
    >
      <aside class="sidebar" :class="{ collapsed: effectiveCollapsed, mobile: isMobile }" aria-label="历史会话">
        <header class="sidebar-header">
          <template v-if="isMobile">
            <button class="primary-button" type="button" @click="emit('create-session')" aria-label="新建会话">
              <span class="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M11 5a1 1 0 0 1 2 0v6h6a1 1 0 0 1 0 2h-6v6a1 1 0 0 1-2 0v-6H5a1 1 0 0 1 0-2h6V5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>

            <button class="icon-button" type="button" @click="emit('request-close')" aria-label="关闭会话列表">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </template>

          <template v-else>
            <button
              class="icon-button"
              type="button"
              @click="emit('toggle-collapse')"
              :aria-label="effectiveCollapsed ? '展开会话列表' : '折叠会话列表'"
            >
              <svg v-if="!effectiveCollapsed" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M15.4 7.4a1 1 0 0 1 0 1.4L12.2 12l3.2 3.2a1 1 0 1 1-1.4 1.4l-3.9-3.9a1 1 0 0 1 0-1.4l3.9-3.9a1 1 0 0 1 1.4 0Z"
                  fill="currentColor"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M8.6 16.6a1 1 0 0 1 0-1.4L11.8 12 8.6 8.8a1 1 0 1 1 1.4-1.4l3.9 3.9a1 1 0 0 1 0 1.4l-3.9 3.9a1 1 0 0 1-1.4 0Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <button class="primary-button" type="button" @click="emit('create-session')" aria-label="新建会话">
              <span class="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M11 5a1 1 0 0 1 2 0v6h6a1 1 0 0 1 0 2h-6v6a1 1 0 0 1-2 0v-6H5a1 1 0 0 1 0-2h6V5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
          </template>
        </header>

        <nav class="session-list">
          <ChatSessionListItem
            v-for="session in sessions"
            :key="session.id"
            :session="session"
            :active="session.id === activeSessionId"
            :collapsed="effectiveCollapsed"
            :promptPresets="promptPresets"
            @select="emit('select-session', session.id)"
            @rename="emit('request-rename-session', $event)"
            @delete="emit('request-delete-session', session.id)"
          />
        </nav>

        <footer class="sidebar-footer">
          <button
            class="footer-button"
            :class="{ iconOnly: effectiveCollapsed }"
            type="button"
            @click="emit('open-trash')"
          >
            <span class="button-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm2 4a1 1 0 0 1 2 0v11a1 1 0 1 1-2 0V7Zm-3 0a1 1 0 0 1 2 0v11a1 1 0 1 1-2 0V7Zm8 0a1 1 0 1 0-2 0v11a1 1 0 1 0 2 0V7Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span v-if="!effectiveCollapsed" class="button-text">回收站</span>
          </button>

          <button
            class="footer-button"
            :class="{ iconOnly: effectiveCollapsed }"
            type="button"
            @click="emit('open-settings')"
          >
            <span class="button-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.24-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.39 1.05.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.24 1.12-.55 1.63-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span v-if="!effectiveCollapsed" class="button-text">设置</span>
          </button>
        </footer>
      </aside>
    </div>
  </transition>
</template>

<style scoped>
.desktop-wrapper {
  height: 100%;
}

.sidebar {
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--chat-sidebar-bg, #202123);
  border-right: 1px solid var(--chat-sidebar-border, rgba(255, 255, 255, 0.08));
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.92));
  box-shadow: 1px 0 0 var(--chat-sidebar-border, rgba(255, 255, 255, 0.08));
  box-sizing: border-box;
}

.sidebar.collapsed {
  width: 74px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 8px;
}

.sidebar.collapsed .sidebar-header {
  flex-direction: column;
  align-items: stretch;
  padding: 10px 10px 8px;
  gap: 8px;
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.72));
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.sidebar.collapsed .primary-button {
  flex: 0 0 auto;
  width: 100%;
}

.primary-button:hover {
  background: var(--chat-sidebar-hover, rgba(255, 255, 255, 0.08));
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--chat-sidebar-muted, rgba(236, 236, 241, 0.72));
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.sidebar.collapsed .icon-button {
  width: 100%;
}

.icon-button:hover {
  background: var(--chat-sidebar-hover, rgba(255, 255, 255, 0.08));
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.95));
}

.session-list {
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 4px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.22) transparent;
}

.sidebar.collapsed .session-list {
  scrollbar-gutter: auto;
  scrollbar-width: none;
}

.sidebar.collapsed .session-list::-webkit-scrollbar {
  width: 0;
}

.session-list::-webkit-scrollbar {
  width: 10px;
}

.session-list::-webkit-scrollbar-track {
  background: transparent;
}

.session-list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.22);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.session-list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.32);
}

.sidebar-footer {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--chat-sidebar-border, rgba(255, 255, 255, 0.08));
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--chat-sidebar-muted, rgba(236, 236, 241, 0.82));
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.footer-button:hover {
  background: var(--chat-sidebar-hover, rgba(255, 255, 255, 0.08));
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.95));
}

.footer-button.iconOnly {
  justify-content: center;
}

.mobile-overlay {
  position: absolute;
  inset: 0;
  z-index: 25;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
}

.sidebar.mobile {
  width: min(340px, 92%);
  height: 100%;
  box-shadow: 20px 0 60px rgba(0, 0, 0, 0.35);
}

.chat-overlay-fade-enter-active,
.chat-overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.chat-overlay-fade-enter-from,
.chat-overlay-fade-leave-to {
  opacity: 0;
}
</style>
