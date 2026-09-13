<script setup>
import { computed, ref, watch } from "vue";
import ChatIcon from "./ChatIcon.vue";
import ChatAvatar from "./ChatAvatar.vue";
import ChatDropdown from "./ChatDropdown.vue";
import { DEFAULT_ASSISTANT_AVATAR_URL } from "@/config/chat";

const props = defineProps({
  assistantProfile: { type: Object, default: null },
  promptPresets: { type: Array, default: () => [] },
  activePresetId: { type: String, default: "" },
  presetLocked: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
});
const emit = defineEmits([
  "open-sidebar",
  "select-preset",
  "open-presets",
  "open-settings",
  "open-trash",
]);
const sidebarButtonRef = ref(null);
const presetMenuRef = ref(null);
const moreMenuRef = ref(null);
const presetName = computed(() => props.assistantProfile?.name || "默认预设");
const presetAvatar = computed(
  () => props.assistantProfile?.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL,
);
watch(
  () => props.isMobile,
  () => {
    presetMenuRef.value?.close();
    moreMenuRef.value?.close();
  },
);
function selectPreset(id) {
  if (props.presetLocked) return;
  presetMenuRef.value?.close(true);
  emit("select-preset", id);
}
function openPresets() {
  presetMenuRef.value?.close(true);
  emit("open-presets");
}
function selectMoreAction(event) {
  moreMenuRef.value?.close(true);
  emit(event);
}
defineExpose({ focusSidebarButton: () => sidebarButtonRef.value?.focus() });
</script>

<template>
  <header class="chat-header" :class="{ mobile: isMobile }">
    <button
      v-if="isMobile"
      ref="sidebarButtonRef"
      class="sidebar-button"
      type="button"
      aria-label="展开会话侧栏"
      aria-controls="chat-session-sidebar"
      :aria-expanded="false"
      @click="emit('open-sidebar')"
    >
      <ChatIcon name="panel" />
    </button>
    <ChatDropdown
      ref="presetMenuRef"
      class="preset-dropdown"
      :label="`切换预设：${presetName}`"
      :align="isMobile ? 'center' : 'start'"
    >
      <template #trigger>
        <ChatAvatar :src="presetAvatar" :name="presetName" />
        <span class="preset-name">{{ presetName }}</span>
        <ChatIcon class="chevron" name="chevron" :size="15" />
      </template>
      <template #default>
        <div v-if="!promptPresets.length" class="menu-empty">暂无预设</div>
        <button
          v-for="preset in promptPresets"
          :key="preset.id"
          class="menu-item"
          :class="{ active: preset.id === activePresetId }"
          type="button"
          :aria-pressed="preset.id === activePresetId"
          :disabled="presetLocked"
          @click="selectPreset(preset.id)"
        >
          <ChatAvatar
            :src="preset.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL"
            :name="preset.name || preset.id"
          />
          <span class="menu-label">{{ preset.name || preset.id }}</span>
          <ChatIcon
            v-if="preset.id === activePresetId"
            name="check"
            :size="16"
          />
        </button>
        <div class="menu-divider"></div>
        <button class="menu-item" type="button" @click="openPresets">
          <ChatIcon name="edit" />
          <span>管理预设</span>
        </button>
      </template>
    </ChatDropdown>
    <ChatDropdown
      ref="moreMenuRef"
      class="more-dropdown"
      label="更多对话操作"
      align="end"
    >
      <template #trigger><ChatIcon name="more" /></template>
      <template #default>
        <button
          class="menu-item"
          type="button"
          @click="selectMoreAction('open-settings')"
        >
          <ChatIcon name="settings" />
          聊天设置
        </button>
        <button
          class="menu-item"
          type="button"
          @click="selectMoreAction('open-trash')"
        >
          <ChatIcon name="trash" />
          回收站
        </button>
      </template>
    </ChatDropdown>
  </header>
</template>

<style scoped>
.chat-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 66px;
  box-sizing: border-box;
  padding: 12px 22px;
  padding-top: max(12px, env(safe-area-inset-top));
  position: relative;
  z-index: 12;
  background: var(--chat-surface);
}
.sidebar-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--chat-muted);
  cursor: pointer;
}
.sidebar-button:hover {
  background: var(--chat-sidebar-hover);
}
.sidebar-button:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: 3px;
}
.preset-dropdown {
  max-width: min(360px, 70%);
}
.preset-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
}
.chevron {
  color: var(--chat-muted);
}
.more-dropdown {
  margin-left: auto;
}
.more-dropdown :deep(summary) {
  width: 36px;
  padding: 0;
}
.mobile {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 4px;
  padding: 8px 10px;
  padding-top: max(8px, env(safe-area-inset-top));
  min-height: 64px;
}
.mobile .preset-dropdown {
  justify-self: center;
  max-width: 100%;
}
.mobile .sidebar-button,
.mobile .more-dropdown :deep(summary) {
  width: 44px;
  height: 44px;
}
.mobile .more-dropdown {
  margin-left: 0;
  justify-self: end;
}
.mobile .preset-dropdown :deep(.chat-avatar) {
  width: 28px;
  height: 28px;
}
@media (pointer: coarse) {
  .sidebar-button,
  .more-dropdown :deep(summary) {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
