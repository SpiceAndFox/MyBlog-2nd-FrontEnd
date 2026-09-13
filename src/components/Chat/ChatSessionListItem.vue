<script setup>
import { computed } from "vue";
import ChatIcon from "./ChatIcon.vue";
import {
  formatSessionDateLabel,
  getSessionDateKey,
  isDateKey,
} from "./utils/sessionDate";
const props = defineProps({
  session: { type: Object, required: true },
  active: { type: Boolean, default: false },
  todayKey: { type: String, default: "" },
  compact: { type: Boolean, default: false },
});
const emit = defineEmits(["select", "delete"]);
const dateKey = computed(() => getSessionDateKey(props.session));
const label = computed(() =>
  formatSessionDateLabel(dateKey.value, props.todayKey),
);
const compactLabel = computed(() => {
  if (!isDateKey(dateKey.value)) return label.value.slice(0, 2);
  const [, month, day] = dateKey.value.split("-");
  return `${Number(month)}/${Number(day)}`;
});
</script>

<template>
  <div class="session-item" :class="{ active, compact }">
    <button
      class="session-main"
      type="button"
      :title="dateKey"
      :aria-label="`${label}（${dateKey}）`"
      :aria-current="active ? 'true' : undefined"
      @click="emit('select')"
    >
      <span class="session-label" aria-hidden="true">{{ label }}</span>
      <span class="session-thumbnail" aria-hidden="true">
        {{ compactLabel }}
      </span>
    </button>
    <span v-if="active" class="active-dot" aria-hidden="true"></span>
    <button
      v-show="!compact"
      class="delete-button"
      type="button"
      :aria-label="`删除 ${dateKey} 的对话`"
      @click="emit('delete')"
    >
      <ChatIcon name="trash" :size="15" />
    </button>
  </div>
</template>

<style scoped>
.session-item {
  position: relative;
  display: flex;
  align-items: center;
  margin: 3px 0;
  border-radius: 8px;
  color: var(--chat-sidebar-muted);
}
.session-item:hover {
  background: var(--chat-sidebar-hover);
}
.session-item.active {
  background: var(--chat-sidebar-active);
  color: var(--chat-accent);
}
.session-main {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.session-label {
  position: absolute;
  left: 12px;
  right: 38px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity var(--sidebar-duration) var(--sidebar-easing);
}
.session-thumbnail {
  width: var(--sidebar-icon-width);
  flex: 0 0 var(--sidebar-icon-width);
  text-align: center;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transition: opacity var(--sidebar-duration) var(--sidebar-easing);
}
.compact .session-label {
  opacity: 0;
}
.compact .session-thumbnail {
  opacity: 1;
}
.session-main:focus-visible,
.delete-button:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: -2px;
}
.active-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  right: 15px;
  pointer-events: none;
}
.compact .active-dot {
  display: none;
}
.delete-button {
  position: absolute;
  right: 3px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--chat-muted);
  opacity: 0;
  cursor: pointer;
}
.session-item:hover .delete-button,
.session-item:focus-within .delete-button {
  opacity: 1;
}
.session-item:hover .active-dot,
.session-item:focus-within .active-dot {
  opacity: 0;
}
.delete-button:hover {
  color: #ae4949;
  background: rgba(174, 73, 73, 0.08);
}
@media (max-width: 900px), (pointer: coarse) {
  .session-label {
    right: 48px;
  }
  .delete-button {
    width: 44px;
    height: 44px;
    right: 0;
    opacity: 1;
  }
  .active-dot {
    display: none;
  }
}
</style>
