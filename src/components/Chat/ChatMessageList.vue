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
      <div class="empty-card">
        <h3 class="empty-title">开始一个新对话</h3>
        <p class="empty-subtitle">这里是纯 UI 演示：左侧管理会话，右侧查看对话与发送消息。</p>
        <div class="suggestions" aria-label="示例提示词">
          <div class="suggestion">帮我总结一篇文章的核心观点</div>
          <div class="suggestion">写一个 Vue 3 组件的最佳实践清单</div>
          <div class="suggestion">把这段中文翻译成自然的英文</div>
        </div>
      </div>
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
  scrollbar-color: rgba(17, 24, 39, 0.22) transparent;
}

.list::-webkit-scrollbar {
  width: 10px;
}

.list::-webkit-scrollbar-track {
  background: transparent;
}

.list::-webkit-scrollbar-thumb {
  background: rgba(17, 24, 39, 0.22);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.list::-webkit-scrollbar-thumb:hover {
  background: rgba(17, 24, 39, 0.32);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 8px;
}

.empty-card {
  width: min(720px, 100%);
  border-radius: var(--chat-radius-lg, 14px);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  padding: 18px 18px 16px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.empty-title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--chat-text, #111827);
}

.empty-subtitle {
  margin: 10px 0 14px;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  line-height: 1.55;
}

.suggestions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.suggestion {
  border-radius: 14px;
  padding: 12px 12px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: rgba(255, 255, 255, 0.86);
  color: rgba(17, 24, 39, 0.78);
  font-size: 0.9rem;
  line-height: 1.4;
}

@media (max-width: 900px) {
  .list {
    padding: 14px 14px 18px;
  }

  .suggestions {
    grid-template-columns: 1fr;
  }
}
</style>
