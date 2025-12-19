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
  color: #ffffff;
  background: rgba(17, 24, 39, 0.78);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  flex: 0 0 auto;
}

.avatar.user {
  background: rgba(59, 130, 246, 0.95);
}

.bubble {
  max-width: min(820px, 100%);
  border-radius: 16px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: rgba(255, 255, 255, 0.85);
  padding: 10px 12px 11px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
}

.bubble.user {
  background: rgba(219, 234, 254, 0.92);
  border-color: rgba(59, 130, 246, 0.22);
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
  color: rgba(17, 24, 39, 0.75);
}

.time {
  font-size: 0.75rem;
  color: rgba(17, 24, 39, 0.45);
  white-space: nowrap;
}

.content {
  white-space: pre-wrap;
  line-height: 1.55;
  color: rgba(17, 24, 39, 0.9);
  font-size: 0.98rem;
}
</style>

