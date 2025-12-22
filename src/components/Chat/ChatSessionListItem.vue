<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { DEFAULT_ASSISTANT_AVATAR_URL } from "@/config/chat";

const props = defineProps({
  session: { type: Object, required: true },
  active: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
  promptPresets: { type: Array, default: () => [] },
});

const emit = defineEmits(["select", "rename", "delete"]);

const isEditingTitle = ref(false);
const draftTitle = ref("");
const titleInputRef = ref(null);

const updatedAtLabel = computed(() => {
  const value = props.session?.updatedAt;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" });
});

const avatarLabel = computed(() => {
  const title = String(props.session?.title || "").trim();
  if (!title) return "·";
  return title.slice(0, 1).toUpperCase();
});

const sessionPresetId = computed(() => {
  const fromSession = props.session?.presetId || props.session?.preset_id;
  return String(fromSession || props.session?.settings?.systemPromptPresetId || "default");
});

const sessionPreset = computed(() => {
  const list = Array.isArray(props.promptPresets) ? props.promptPresets : [];
  return list.find((preset) => preset?.id === sessionPresetId.value) || list.find((preset) => preset?.id === "default") || null;
});

const sessionAvatarUrl = computed(() => String(sessionPreset.value?.avatarUrl || DEFAULT_ASSISTANT_AVATAR_URL || ""));
const sessionAvatarFailed = ref(false);

watch(sessionAvatarUrl, () => {
  sessionAvatarFailed.value = false;
});

function markSessionAvatarFailed() {
  sessionAvatarFailed.value = true;
}

async function startEditingTitle() {
  if (props.collapsed) return;
  isEditingTitle.value = true;
  draftTitle.value = String(props.session?.title || "");
  await nextTick();
  titleInputRef.value?.focus?.();
  titleInputRef.value?.select?.();
}

function finishEditingTitle({ commit } = {}) {
  const normalizedNextTitle = String(draftTitle.value || "").trim();
  const originalTitle = String(props.session?.title || "").trim();

  isEditingTitle.value = false;
  draftTitle.value = "";

  if (!commit) return;
  if (!normalizedNextTitle) return;
  if (normalizedNextTitle === originalTitle) return;
  emit("rename", { sessionId: props.session.id, title: normalizedNextTitle });
}

function confirmEditingTitle() {
  finishEditingTitle({ commit: true });
}

function cancelEditingTitle() {
  finishEditingTitle({ commit: false });
}

function onTitleKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    confirmEditingTitle();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    cancelEditingTitle();
  }
}

function selectThisSession() {
  if (isEditingTitle.value) return;
  emit("select");
}

function onMainKeydown(event) {
  if (isEditingTitle.value) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    emit("select");
  }
}
</script>

<template>
  <div class="session-item" :class="{ active, collapsed }">
    <div
      class="session-main"
      role="button"
      :tabindex="isEditingTitle ? -1 : 0"
      :title="session.title"
      @click="selectThisSession"
      @keydown="onMainKeydown"
    >
      <span v-if="collapsed" class="collapsed-badge" aria-hidden="true">
        <img
          v-if="sessionAvatarUrl && !sessionAvatarFailed"
          class="collapsed-badge-image"
          :src="sessionAvatarUrl"
          alt=""
          @error="markSessionAvatarFailed"
        />
        <span v-else class="collapsed-badge-fallback">{{ avatarLabel }}</span>
      </span>

      <template v-else>
        <span v-if="!isEditingTitle" class="session-title">{{ session.title }}</span>
        <input
          v-else
          ref="titleInputRef"
          v-model="draftTitle"
          class="title-input"
          type="text"
          maxlength="60"
          @keydown="onTitleKeydown"
          @blur="confirmEditingTitle"
        />
        <span v-if="!isEditingTitle" class="session-meta">{{ updatedAtLabel }}</span>
      </template>
    </div>

    <div v-if="!collapsed && !isEditingTitle" class="actions" aria-label="会话操作">
      <button class="icon-button" type="button" @click="startEditingTitle" aria-label="重命名">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18-11.5a1 1 0 0 0 0-1.41l-1.34-1.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75L21 5.75Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button class="icon-button danger" type="button" @click="emit('delete')" aria-label="删除">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.session-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 2px;
}

.session-item:hover {
  background: var(--chat-sidebar-hover, rgba(255, 255, 255, 0.08));
}

.session-item.active {
  background: var(--chat-sidebar-active, rgba(255, 255, 255, 0.1));
}

.session-main {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;

  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.92));
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease;
  min-width: 0;
  outline: none;
}

.session-main:focus-visible {
  border-color: rgba(16, 163, 127, 0.65);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.18);
}

.collapsed-badge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--chat-sidebar-active, rgba(255, 255, 255, 0.12));
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.92));
  font-weight: 800;
  font-size: 0.85rem;
  flex: 0 0 auto;
  overflow: hidden;
}

.collapsed-badge-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.collapsed-badge-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.session-title {
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.session-meta {
  font-size: 0.75rem;
  color: var(--chat-sidebar-muted, rgba(236, 236, 241, 0.62));
  white-space: nowrap;
  flex: 0 0 auto;
}

.title-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--chat-sidebar-border, rgba(255, 255, 255, 0.14));
  background: rgba(255, 255, 255, 0.9);
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.92));
  padding: 6px 10px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.title-input:focus {
  border-color: rgba(16, 163, 127, 0.75);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.22);
}

.actions {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);

  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px;
  border-radius: 999px;
  background: var(--chat-sidebar-actions-bg, rgba(32, 33, 35, 0.35));
  border: 1px solid var(--chat-sidebar-border, rgba(255, 255, 255, 0.08));
  backdrop-filter: blur(6px);

  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.session-item:hover .actions {
  opacity: 1;
  pointer-events: auto;
}

.icon-button {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--chat-sidebar-muted, rgba(236, 236, 241, 0.62));
  display: grid;
  place-items: center;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.icon-button:hover {
  background: var(--chat-sidebar-hover, rgba(255, 255, 255, 0.08));
  color: var(--chat-sidebar-text, rgba(236, 236, 241, 0.95));
}

.icon-button.danger:hover {
  background: rgba(239, 68, 68, 0.16);
  color: rgba(185, 28, 28, 0.95);
}

.collapsed .session-main {
  justify-content: center;
  padding: 10px 8px;
}
</style>
