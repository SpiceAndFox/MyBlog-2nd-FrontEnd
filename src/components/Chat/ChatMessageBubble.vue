<script setup>
import { computed } from "vue";

const props = defineProps({
  message: { type: Object, required: true },
});

const isUser = computed(() => props.message?.role === "user");

const avatarText = computed(() => (isUser.value ? "你" : "AI"));

const timeLabel = computed(() => {
  const value = props.message?.createdAt;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
});
</script>

<template>
  <div class="row" :class="{ user: isUser }">
    <div class="avatar" :class="{ user: isUser }" aria-hidden="true">{{ avatarText }}</div>
    <div class="bubble" :class="{ user: isUser }">
      <div class="meta">
        <span class="name">{{ isUser ? "你" : "Assistant" }}</span>
        <span v-if="timeLabel" class="time">{{ timeLabel }}</span>
      </div>
      <div class="content">{{ message.content }}</div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--chat-avatar-text, #ffffff);
  background: var(--chat-avatar-bg, rgba(17, 24, 39, 0.78));
  flex: 0 0 auto;
}

.avatar.user {
  background: var(--chat-avatar-user-bg, rgba(59, 130, 246, 0.95));
  color: var(--chat-avatar-user-text, #ffffff);
}

.bubble {
  max-width: min(820px, 100%);
  border-radius: 16px;
  border: 1px solid var(--chat-bubble-border, rgba(17, 24, 39, 0.08));
  background: var(--chat-bubble-bg, rgba(255, 255, 255, 0.85));
  padding: 10px 12px 11px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.bubble.user {
  background: var(--chat-bubble-user-bg, rgba(219, 234, 254, 0.92));
  border-color: var(--chat-bubble-user-border, rgba(59, 130, 246, 0.22));
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--chat-muted, rgba(17, 24, 39, 0.75));
}

.time {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.45);
  white-space: nowrap;
}

.content {
  white-space: pre-wrap;
  line-height: 1.55;
  color: var(--chat-text, rgba(17, 24, 39, 0.9));
  font-size: 0.98rem;
}
</style>
