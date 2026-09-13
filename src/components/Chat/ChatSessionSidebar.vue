<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import ChatSessionListItem from "./ChatSessionListItem.vue";
import ChatDropdown from "./ChatDropdown.vue";
import ChatIcon from "./ChatIcon.vue";
import navAvatar from "@/assets/images/icons/avatar.webp";

const props = defineProps({
  sessions: { type: Array, required: true },
  activeSessionId: { type: String, default: "" },
  todayKey: { type: String, default: "" },
  collapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
  inert: { type: Boolean, default: false },
});
const emit = defineEmits([
  "select-session",
  "toggle-collapse",
  "request-close",
  "request-delete-session",
  "open-presets",
  "open-trash",
  "open-settings",
]);
const compact = computed(() => !props.isMobile && props.collapsed);
const visible = computed(() => !props.isMobile || props.mobileOpen);
const toggleLabel = computed(() => (props.isMobile ? "关闭会话侧栏" : compact.value ? "展开会话侧栏" : "收起会话侧栏"));
const sidebarRef = ref(null);
const toggleButtonRef = ref(null);
const siteMenuRef = ref(null);
const settingsMenuRef = ref(null);
const siteLinks = [
  { label: "Chat", to: "/chat", icon: "chat" },
  { label: "首页", to: "/", icon: "home" },
  { label: "文章", to: "/articles", icon: "book" },
  { label: "日记", to: "/diaries", icon: "diary" },
  { label: "管理后台", to: "/admin", icon: "settings" },
];
const settingsActions = [
  { label: "聊天设置", icon: "settings", event: "open-settings" },
  { label: "管理预设", icon: "edit", event: "open-presets" },
  { label: "回收站", icon: "trash", event: "open-trash", divider: true },
];

watch([() => props.mobileOpen, () => props.collapsed, () => props.isMobile], () => {
  siteMenuRef.value?.close();
  settingsMenuRef.value?.close();
});
watch(
  () => props.isMobile && props.mobileOpen,
  async (open, _, onCleanup) => {
    if (!open) return;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    await nextTick();
    if (!cancelled) toggleButtonRef.value?.focus();
  },
);

function toggleSidebar() {
  emit(props.isMobile ? "request-close" : "toggle-collapse");
}

function selectSite() {
  siteMenuRef.value?.close(true);
  if (props.isMobile) emit("request-close");
}

function selectSettingsAction(action) {
  settingsMenuRef.value?.close(true);
  emit(action.event);
}

function onKeydown(event) {
  if (!props.isMobile || !props.mobileOpen) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    emit("request-close");
    return;
  }
  if (event.key !== "Tab") return;
  const controls = Array.from(
    sidebarRef.value?.querySelectorAll("button:not(:disabled), a[href], summary") || [],
  ).filter((element) => element.getClientRects().length > 0);
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

defineExpose({ focusToggle: () => toggleButtonRef.value?.focus() });
</script>

<template>
  <!-- Only the mobile drawer enters/leaves. Desktop stays in the flex layout. -->
  <Transition name="sidebar-drawer" :css="isMobile">
    <div
      v-show="visible"
      class="sidebar-wrapper"
      :class="{ 'mobile-overlay': isMobile, compact }"
      :inert="inert || (isMobile && !mobileOpen) ? true : undefined"
    >
      <button
        v-if="isMobile"
        class="sidebar-scrim"
        type="button"
        tabindex="-1"
        aria-label="关闭会话侧栏"
        @click="emit('request-close')"
      ></button>
      <aside
        id="chat-session-sidebar"
        ref="sidebarRef"
        class="sidebar"
        :role="isMobile ? 'dialog' : undefined"
        :aria-modal="isMobile ? true : undefined"
        aria-label="会话导航"
        @keydown="onKeydown"
      >
        <header class="sidebar-header">
          <ChatDropdown
            ref="siteMenuRef"
            class="brand-dropdown"
            label="SPICE-NEST 站点导航"
            :inert="compact ? true : undefined"
            :aria-hidden="compact ? true : undefined"
          >
            <template #trigger>
              <img class="brand-avatar" :src="navAvatar" alt="" />
              <span class="brand-description expanded-label" aria-hidden="true">
                <span class="brand-name">SPICE-NEST</span>
                <ChatIcon class="muted" name="chevron" :size="14" />
              </span>
            </template>
            <nav aria-label="站点导航">
              <RouterLink
                v-for="link in siteLinks"
                :key="link.to"
                :to="link.to"
                class="menu-item"
                :class="{ active: link.to === '/chat' }"
                :aria-current="link.to === '/chat' ? 'page' : undefined"
                @click="selectSite"
              >
                <ChatIcon :name="link.icon" />
                <span class="menu-label">{{ link.label }}</span>
                <ChatIcon v-if="link.to === '/chat'" name="check" :size="16" />
              </RouterLink>
            </nav>
          </ChatDropdown>
          <button
            ref="toggleButtonRef"
            class="sidebar-toggle"
            type="button"
            :title="toggleLabel"
            :aria-label="toggleLabel"
            aria-controls="chat-session-sidebar"
            :aria-expanded="!compact"
            @click="toggleSidebar"
          >
            <ChatIcon :name="compact ? 'expand' : 'close'" />
          </button>
        </header>

        <nav class="session-list" aria-label="历史对话">
          <div v-if="sessions.length" class="section-label expanded-label" aria-hidden="true">最近</div>
          <ChatSessionListItem
            v-for="session in sessions"
            :key="session.id"
            :session="session"
            :todayKey="todayKey"
            :active="session.id === activeSessionId"
            :compact="compact"
            @select="emit('select-session', session.id)"
            @delete="emit('request-delete-session', session.id)"
          />
        </nav>

        <footer class="sidebar-footer">
          <ChatDropdown ref="settingsMenuRef" class="settings-dropdown" label="设置" placement="top">
            <template #trigger>
              <span class="rail-icon"><ChatIcon name="settings" /></span>
              <span class="expanded-label" aria-hidden="true">设置</span>
            </template>
            <template v-for="action in settingsActions" :key="action.event">
              <div v-if="action.divider" class="menu-divider"></div>
              <button class="menu-item" type="button" @click="selectSettingsAction(action)">
                <ChatIcon :name="action.icon" />
                <span>{{ action.label }}</span>
              </button>
            </template>
          </ChatDropdown>
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.sidebar-wrapper {
  --sidebar-expanded-width: 244px;
  --sidebar-rail-width: 80px;
  --sidebar-toggle-width: 28px;
  --sidebar-padding: 8px;
  --sidebar-icon-width: calc(var(--sidebar-rail-width) - var(--sidebar-padding) * 2 - 1px);
  --sidebar-duration: 240ms;
  --sidebar-easing: cubic-bezier(0.2, 0.8, 0.2, 1);
  flex: 0 0 var(--sidebar-expanded-width);
  min-width: 0;
  min-height: 0;
  position: relative;
  z-index: 20;
  transition: flex-basis var(--sidebar-duration) var(--sidebar-easing);
}
.sidebar-wrapper.compact {
  flex-basis: var(--sidebar-rail-width);
}
.sidebar {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 13px var(--sidebar-padding) 12px;
  padding-top: max(13px, env(safe-area-inset-top));
  border-right: 1px solid var(--chat-sidebar-border);
  background: var(--chat-sidebar-bg);
  color: var(--chat-sidebar-text);
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  margin-bottom: 14px;
  flex: 0 0 auto;
}
.brand-dropdown {
  flex: 1;
  min-width: 0;
  transition:
    opacity var(--sidebar-duration) var(--sidebar-easing),
    visibility var(--sidebar-duration);
}
.compact .brand-dropdown {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
.brand-dropdown :deep(summary) {
  justify-content: flex-start;
  gap: 8px;
  height: 44px;
  padding: 0;
  overflow: hidden;
}
.brand-avatar {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  object-fit: cover;
  border-radius: 8px;
  margin-left: 8px;
}
.brand-description {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-name {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.025em;
}
.expanded-label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity var(--sidebar-duration) var(--sidebar-easing);
}
.compact .expanded-label {
  opacity: 0;
  pointer-events: none;
}
.muted {
  color: var(--chat-muted);
}
.sidebar-toggle {
  display: grid;
  place-items: center;
  width: var(--sidebar-toggle-width);
  height: 44px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--chat-muted);
  cursor: pointer;
  transition: transform var(--sidebar-duration) var(--sidebar-easing);
}
.compact .sidebar-toggle {
  transform: translateX(calc((var(--sidebar-toggle-width) - var(--sidebar-icon-width)) / 2));
}
.sidebar-toggle:hover {
  background: var(--chat-sidebar-hover);
}
.sidebar-toggle:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: -2px;
}
.rail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sidebar-icon-width);
  flex: 0 0 var(--sidebar-icon-width);
  color: var(--chat-muted);
}
.session-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-scrollbar) transparent;
}
/* Keep wheel and keyboard scrolling available in the desktop rail. */
.compact .session-list {
  scrollbar-width: none;
}
.compact .session-list::-webkit-scrollbar {
  display: none;
}
.section-label {
  height: 16px;
  padding: 0 12px;
  margin-bottom: 9px;
  color: var(--chat-muted);
  font-size: 11px;
}
.sidebar-footer {
  flex: 0 0 auto;
  padding-top: 12px;
  padding-bottom: env(safe-area-inset-bottom);
  color: var(--chat-muted);
  font-size: 12px;
}
.settings-dropdown :deep(summary) {
  justify-content: flex-start;
  gap: 0;
  height: 44px;
  padding: 0;
}
.mobile-overlay {
  position: absolute;
  inset: 0;
  z-index: 25;
  transition: none;
}
.sidebar-scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(37, 40, 33, 0.24);
  cursor: pointer;
}
.mobile-overlay .sidebar {
  --sidebar-padding: 15px;
  --sidebar-icon-width: 36px;
  position: relative;
  width: min(280px, 85vw);
  padding-top: max(14px, env(safe-area-inset-top));
}
.mobile-overlay .sidebar-toggle {
  width: 44px;
}
.sidebar-drawer-enter-active,
.sidebar-drawer-leave-active {
  transition: opacity var(--sidebar-duration) var(--sidebar-easing);
}
.sidebar-drawer-enter-active .sidebar,
.sidebar-drawer-leave-active .sidebar {
  transition: transform var(--sidebar-duration) var(--sidebar-easing);
}
.sidebar-drawer-enter-from,
.sidebar-drawer-leave-to {
  opacity: 0;
}
.sidebar-drawer-enter-from .sidebar,
.sidebar-drawer-leave-to .sidebar {
  transform: translateX(-100%);
}
@media (pointer: coarse) {
  .sidebar-wrapper {
    --sidebar-rail-width: 96px;
    --sidebar-toggle-width: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sidebar-wrapper {
    --sidebar-duration: 0ms;
  }
}
</style>
