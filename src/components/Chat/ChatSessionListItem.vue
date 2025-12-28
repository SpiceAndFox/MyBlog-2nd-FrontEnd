<script setup>
import { computed } from "vue";
import { getSessionDateKey, isDateKey } from "@/components/Chat/utils/sessionDate";

const props = defineProps({
  session: { type: Object, required: true },
  active: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
});

const emit = defineEmits(["select", "delete"]);

const sessionDateKey = computed(() => getSessionDateKey(props.session));
const collapsedLabel = computed(() => {
  const dateKey = String(sessionDateKey.value || "").trim();
  if (isDateKey(dateKey)) return dateKey.slice(8, 10);
  return dateKey.slice(0, 1).toUpperCase() || "·";
});

function onMainKeydown(event) {
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
      tabindex="0"
      :title="sessionDateKey"
      @click="emit('select')"
      @keydown="onMainKeydown"
    >
      <span v-if="collapsed" class="collapsed-badge" aria-hidden="true">
        <span class="collapsed-badge-fallback">{{ collapsedLabel }}</span>
      </span>

      <template v-else>
        <span class="session-title">{{ sessionDateKey }}</span>
      </template>
    </div>

    <div v-if="!collapsed" class="actions" aria-label="会话操作">
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
