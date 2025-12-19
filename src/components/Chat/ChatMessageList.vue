<script setup>
import { nextTick, ref, watch } from "vue";
import ChatMessageBubble from "@/components/Chat/ChatMessageBubble.vue";

const props = defineProps({
  messages: { type: Array, default: () => [] },
});

const listRef = ref(null);

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    const element = listRef.value;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  },
  { immediate: true }
);
</script>

<template>
  <div ref="listRef" class="list">
    <div v-if="messages.length === 0" class="empty">
      <h3 class="empty-title">开始一轮新对话</h3>
    </div>

    <div v-else class="messages">
      <ChatMessageBubble v-for="message in messages" :key="message.id" :message="message" />
    </div>
  </div>
</template>

<style scoped>
.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px 22px;
  box-sizing: border-box;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.22) transparent;
}

.list::-webkit-scrollbar {
  width: 10px;
}

.list::-webkit-scrollbar-track {
  background: transparent;
}

.list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.22);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.32);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
}

.empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 8px;
}

.empty-title {
  margin: 0;
  font-size: 2rem;
  color: #414040;
}

@media (max-width: 900px) {
  .list {
    padding: 14px 14px 18px;
  }

  .empty-title {
    text-align: center;
  }
}
</style>
