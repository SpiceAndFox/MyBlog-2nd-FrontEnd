<script setup>
import { computed } from "vue";

const props = defineProps({
  warnings: { type: Array, default: () => [] },
  retryableComponents: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  retrying: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["refresh", "retry"]);

const canRetryMemory = computed(() => props.retryableComponents.includes("memory"));
const hasHealthReadError = computed(() => props.warnings.some((warning) => warning?.component === "health"));

function componentLabel(component) {
  if (component === "health") return "状态检查";
  return "长期记忆";
}

function statusText(warning) {
  if (warning?.retryMode === "manual" || warning?.status === "needs_attention") return "已暂停自动重试";
  if (warning?.nextRetryAt) {
    const next = new Date(warning.nextRetryAt);
    if (!Number.isNaN(next.getTime())) {
      return `预计 ${next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} 自动重试`;
    }
  }
  if (warning?.status === "rebuilding") return "恢复中";
  return "";
}
</script>

<template>
  <section v-if="warnings.length" class="health-banner" role="alert" aria-live="polite">
    <div class="health-icon" aria-hidden="true">!</div>
    <div class="health-content">
      <div class="health-title">部分记忆能力当前不可用</div>
      <ul class="health-list">
        <li v-for="(warning, index) in warnings" :key="`${warning.component}:${warning.message}:${index}`">
          <span class="health-component">{{ componentLabel(warning.component) }}</span>
          <span class="health-message">{{ warning.message }}</span>
          <span v-if="statusText(warning)" class="health-meta">{{ statusText(warning) }}</span>
        </li>
      </ul>
    </div>
    <div class="health-actions">
      <button
        v-if="canRetryMemory"
        class="health-action"
        type="button"
        :disabled="retrying.memory"
        @click="emit('retry', 'memory')"
      >
        {{ retrying.memory ? "重试中…" : "重试长期记忆" }}
      </button>
      <button
        v-if="hasHealthReadError"
        class="health-action secondary"
        type="button"
        :disabled="loading"
        @click="emit('refresh')"
      >
        {{ loading ? "检查中…" : "重新检查" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.health-banner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 11px;
  padding: 11px 14px;
  border-bottom: 1px solid rgba(217, 119, 6, 0.24);
  background: rgba(255, 251, 235, 0.96);
  color: rgba(120, 53, 15, 0.96);
  z-index: 3;
}

.health-icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(217, 119, 6, 0.14);
  color: #b45309;
  font-weight: 850;
  line-height: 1;
}

.health-content {
  min-width: 0;
}

.health-title {
  font-size: 0.9rem;
  font-weight: 780;
}

.health-list {
  display: grid;
  gap: 3px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;
  line-height: 1.45;
}

.health-component {
  margin-right: 6px;
  font-weight: 720;
}

.health-message {
  color: rgba(120, 53, 15, 0.86);
}

.health-meta {
  margin-left: 7px;
  color: rgba(146, 64, 14, 0.68);
  white-space: nowrap;
}

.health-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.health-action {
  border: 1px solid rgba(180, 83, 9, 0.24);
  border-radius: 999px;
  padding: 6px 10px;
  background: #fff;
  color: #92400e;
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 720;
}

.health-action:hover:not(:disabled) {
  background: rgba(254, 243, 199, 0.72);
}

.health-action:disabled {
  cursor: wait;
  opacity: 0.58;
}

.health-action.secondary {
  color: rgba(120, 53, 15, 0.78);
}

@media (max-width: 700px) {
  .health-banner {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .health-actions {
    grid-column: 2;
    justify-content: flex-start;
  }

  .health-meta {
    display: block;
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .health-banner {
    animation: health-banner-in 0.2s ease both;
  }
}

@keyframes health-banner-in {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
}
</style>
