<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ChatSessionListItem from "@/components/Chat/ChatSessionListItem.vue";
import { DEFAULT_ASSISTANT_AVATAR_URL } from "@/config/chat";

const props = defineProps({
  sessions: { type: Array, required: true },
  activeSessionId: { type: String, default: "" },
  collapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
  assistantProfile: { type: Object, default: () => ({}) },
  promptPresets: { type: Array, default: () => [] },
  activePresetId: { type: String, default: "" },
  presetLocked: { type: Boolean, default: false },
});

const emit = defineEmits([
  "select-session",
  "go-today",
  "toggle-collapse",
  "request-close",
  "request-delete-session",
  "select-preset",
  "open-presets",
  "open-trash",
  "open-settings",
]);

const effectiveCollapsed = computed(() => !props.isMobile && props.collapsed);
const shouldShow = computed(() => !props.isMobile || props.mobileOpen);

const presetName = computed(() => String(props.assistantProfile?.name || "默认预设"));
const presetAvatarUrl = computed(() => String(props.assistantProfile?.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL || ""));
const presetAvatarLabel = computed(() => {
  const normalized = presetName.value.trim();
  if (!normalized) return "AI";
  return normalized.slice(0, 1).toUpperCase();
});

const presetAvatarFailed = ref(false);
watch(presetAvatarUrl, () => {
  presetAvatarFailed.value = false;
});

function markPresetAvatarFailed() {
  presetAvatarFailed.value = true;
}

function onOverlayClick() {
  if (!props.isMobile) return;
  emit("request-close");
}

const presetMenuOpen = ref(false);
const presetControlsRef = ref(null);

const presetList = computed(() => (Array.isArray(props.promptPresets) ? props.promptPresets : []));
const normalizedActivePresetId = computed(() => String(props.activePresetId || "").trim());

function closePresetMenu() {
  presetMenuOpen.value = false;
}

function togglePresetMenu() {
  if (props.presetLocked) return;
  presetMenuOpen.value = !presetMenuOpen.value;
}

function openPresetManager() {
  closePresetMenu();
  emit("open-presets");
}

function selectPreset(presetId) {
  if (props.presetLocked) return;
  const normalized = String(presetId || "").trim();
  if (!normalized) return;
  closePresetMenu();
  emit("select-preset", normalized);
}

function onGlobalPointerDown(event) {
  if (!presetMenuOpen.value) return;
  const target = event?.target;
  if (!(target instanceof Node)) return;
  if (presetControlsRef.value?.contains(target)) return;
  closePresetMenu();
}

function onGlobalKeyDown(event) {
  if (!presetMenuOpen.value) return;
  if (event?.key === "Escape") closePresetMenu();
}

watch(
  () => props.mobileOpen,
  (open) => {
    if (!open) closePresetMenu();
  }
);
watch(
  () => props.collapsed,
  () => closePresetMenu()
);
watch(
  () => props.isMobile,
  () => closePresetMenu()
);

onMounted(() => {
  window.addEventListener("pointerdown", onGlobalPointerDown);
  window.addEventListener("keydown", onGlobalKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onGlobalPointerDown);
  window.removeEventListener("keydown", onGlobalKeyDown);
});
</script>

<template>
  <transition name="chat-overlay-fade">
    <div v-show="shouldShow" :class="isMobile ? 'mobile-overlay' : 'desktop-wrapper'" @click.self="onOverlayClick">
      <aside class="sidebar" :class="{ collapsed: effectiveCollapsed, mobile: isMobile }" aria-label="历史会话">
        <header class="sidebar-header">
          <template v-if="isMobile">
            <button class="primary-button" type="button" @click="emit('go-today')" aria-label="回到今天">
              <span class="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10Z"
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

            <button class="primary-button" type="button" @click="emit('go-today')" aria-label="回到今天">
              <span class="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10Z"
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
            @select="emit('select-session', session.id)"
            @delete="emit('request-delete-session', session.id)"
          />
        </nav>

        <footer class="sidebar-footer">
          <div ref="presetControlsRef" class="preset-controls" :class="{ collapsed: effectiveCollapsed }">
            <button
              class="footer-button preset-selector"
              :class="{ iconOnly: effectiveCollapsed }"
              type="button"
              :aria-label="`选择预设：${presetName}`"
              aria-haspopup="menu"
              :aria-expanded="presetMenuOpen ? 'true' : 'false'"
              :disabled="presetLocked"
              @click="togglePresetMenu"
            >
              <span class="preset-avatar" aria-hidden="true">
                <img
                  v-if="presetAvatarUrl && !presetAvatarFailed"
                  class="preset-avatar-image"
                  :src="presetAvatarUrl"
                  alt=""
                  @error="markPresetAvatarFailed"
                />
                <span v-else class="preset-avatar-fallback">{{ presetAvatarLabel }}</span>
              </span>
              <span v-if="!effectiveCollapsed" class="button-text">{{ presetName }}</span>
              <span v-if="!effectiveCollapsed" class="preset-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M7.41 9.59a1 1 0 0 1 1.41 0L12 12.76l3.18-3.17a1 1 0 1 1 1.41 1.41l-3.89 3.89a1 1 0 0 1-1.41 0L7.41 11a1 1 0 0 1 0-1.41Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>

            <button
              class="footer-button preset-manage"
              :class="{ iconOnly: effectiveCollapsed }"
              type="button"
              aria-label="管理预设"
              title="管理预设"
              @click="openPresetManager"
            >
              <span class="button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M16.9 3a1 1 0 0 1 .7.29l3.11 3.11a1 1 0 0 1 0 1.41l-9.9 9.9a1 1 0 0 1-.45.26l-4.2 1.05a1 1 0 0 1-1.21-1.21l1.05-4.2a1 1 0 0 1 .26-.45l9.9-9.9A1 1 0 0 1 16.9 3Zm-.7 2.41-9.36 9.36-.6 2.39 2.39-.6 9.36-9.36-1.79-1.79Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>

            <transition name="chat-preset-menu-fade">
              <div v-show="presetMenuOpen" class="preset-menu" role="menu" aria-label="预设列表">
                <div v-if="!presetList.length" class="preset-menu-empty">暂无预设</div>

                <button
                  v-for="preset in presetList"
                  :key="preset.id"
                  type="button"
                  class="preset-menu-item"
                  :class="{ active: preset.id === normalizedActivePresetId }"
                  role="menuitemradio"
                  :aria-checked="preset.id === normalizedActivePresetId ? 'true' : 'false'"
                  :disabled="presetLocked"
                  @click="selectPreset(preset.id)"
                >
                  <span class="preset-avatar" aria-hidden="true">
                    <img v-if="preset.avatarUrl" class="preset-avatar-image" :src="preset.avatarUrl" alt="" />
                    <img v-else class="preset-avatar-image" :src="DEFAULT_ASSISTANT_AVATAR_URL" alt="" />
                  </span>
                  <span class="preset-menu-name">{{ preset.name || preset.id }}</span>
                  <span v-if="preset.id === normalizedActivePresetId" class="preset-menu-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        d="M9.55 16.2 5.8 12.45a1 1 0 1 1 1.41-1.41l2.34 2.34 7.24-7.24a1 1 0 0 1 1.41 1.41l-7.95 7.95a1 1 0 0 1-1.41 0Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </transition>
          </div>

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

.footer-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.footer-button.iconOnly {
  justify-content: center;
}

.preset-controls {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
}

.preset-controls .footer-button {
  width: auto;
}

.preset-controls.collapsed {
  flex-direction: column;
}

.preset-controls.collapsed .footer-button:not(.preset-manage) {
  width: 100%;
}

.preset-selector {
  flex: 1 1 auto;
  min-width: 0;
}

.preset-chevron {
  margin-left: auto;
  color: var(--chat-sidebar-muted, rgba(236, 236, 241, 0.62));
  transition: transform 0.18s ease;
}

.preset-selector[aria-expanded="true"] .preset-chevron {
  transform: rotate(180deg);
}

.preset-controls .footer-button.preset-manage {
  flex: 0 0 auto;
  width: 44px;
  min-width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 999px;
  justify-content: center;
}

.preset-manage .button-text {
  display: none;
}

.preset-menu {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  width: 100%;
  min-width: 240px;
  max-height: min(360px, 55vh);
  overflow: auto;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid var(--chat-sidebar-border, rgba(255, 255, 255, 0.08));
  background: var(--chat-sidebar-actions-bg, rgba(32, 33, 35, 0.96));
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(10px);
  z-index: 30;
}

.preset-menu-empty {
  padding: 10px 10px;
  color: var(--chat-sidebar-muted, rgba(236, 236, 241, 0.7));
  font-size: 0.9rem;
}

.preset-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.92));
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.preset-menu-item:hover:not(:disabled) {
  background: var(--chat-sidebar-hover, rgba(255, 255, 255, 0.08));
}

.preset-menu-item.active {
  background: var(--chat-sidebar-active, rgba(255, 255, 255, 0.12));
}

.preset-menu-name {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-menu-check {
  flex: 0 0 auto;
  color: var(--chat-accent, #10a37f);
}

.chat-preset-menu-fade-enter-active,
.chat-preset-menu-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.chat-preset-menu-fade-enter-from,
.chat-preset-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.preset-controls.collapsed .preset-manage {
  align-self: center;
}

.preset-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  overflow: hidden;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  background: var(--chat-sidebar-active, rgba(255, 255, 255, 0.12));
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.92));
}

.preset-avatar-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.preset-avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
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
