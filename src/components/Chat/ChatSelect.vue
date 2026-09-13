<script setup>
import { ref, useId } from "vue";
import VueSelect from "vue-select";
import "vue-select/dist/vue-select.css";
import ChatIcon from "./ChatIcon.vue";

defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  label: { type: String, required: true },
  descriptionId: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);
const inputId = useId();
const root = ref(null);
const opened = ref(false);
const opensUpward = ref(false);
const menuMaxHeight = ref("240px");

function onOpen() {
  opened.value = true;
  const element = root.value;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const boundary = element.closest(".modal-body")?.getBoundingClientRect();
  const above = rect.top - Math.max(0, boundary?.top ?? 0) - 8;
  const below = Math.min(window.innerHeight, boundary?.bottom ?? window.innerHeight) - rect.bottom - 8;
  opensUpward.value = below < 240 && above > below;
  menuMaxHeight.value = `${Math.max(40, Math.min(240, opensUpward.value ? above : below))}px`;
}

function mapKeydown(handlers) {
  return {
    ...handlers,
    27: (event) => {
      // Stop Escape before the select blurs and updates its open state.
      if (opened.value) event.stopPropagation();
      handlers[27](event);
    },
  };
}
</script>

<template>
  <div
    ref="root"
    class="chat-select"
    :class="{ 'opens-upward': opensUpward, opened }"
    :style="{ '--select-menu-max-height': menuMaxHeight }"
  >
    <VueSelect
      :model-value="modelValue"
      :options="options"
      :reduce="option => option.value"
      :input-id="inputId"
      :clearable="false"
      :searchable="searchable"
      :disabled="disabled || options.length === 0"
      :map-keydown="mapKeydown"
      placeholder="请选择"
      @update:model-value="emit('update:modelValue', $event)"
      @open="onOpen"
      @close="opened = false"
    >
      <template #search="{ attributes, events }">
        <input
          v-bind="attributes"
          :aria-label="label"
          :aria-describedby="descriptionId"
          :aria-labelledby="undefined"
          class="vs__search"
          v-on="events"
        />
      </template>
      <template #open-indicator="{ attributes }">
        <ChatIcon v-bind="attributes" class="select-chevron" name="chevron" :size="16" />
      </template>
      <template #selected-option="option">
        <span class="selected-label" :title="option.label">{{ option.label }}</span>
      </template>
      <template #option="option">
        <span class="option-label">{{ option.label }}</span>
        <ChatIcon v-if="option.value === modelValue" name="check" :size="16" />
      </template>
      <template #no-options>没有匹配的选项</template>
    </VueSelect>
  </div>
</template>

<style scoped>
.chat-select {
  --vs-font-size: 14px;
  --vs-border-color: var(--chat-border);
  --vs-border-radius: var(--chat-radius-md);
  --vs-selected-color: var(--chat-text);
  --vs-controls-color: var(--chat-muted);
  --vs-dropdown-bg: var(--chat-surface);
  --vs-dropdown-color: var(--chat-text);
  --vs-dropdown-option--active-bg: var(--chat-accent-soft);
  --vs-dropdown-option--active-color: var(--chat-accent-strong);
  --vs-disabled-bg: var(--chat-surface-2);
  min-width: 0;
  position: relative;
}
.opened {
  z-index: 2;
}
.chat-select :deep(.vs__dropdown-toggle) {
  min-height: var(--chat-select-height, 46px);
  padding: 4px 12px;
  background: var(--chat-select-background, var(--chat-surface-2));
  border: 1px solid var(--chat-border);
  border-radius: var(--chat-select-radius, var(--chat-radius-md));
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.chat-select :deep(.vs__dropdown-toggle:hover) {
  border-color: var(--chat-scrollbar);
}
.chat-select :deep(.vs--open .vs__dropdown-toggle),
.chat-select :deep(.vs__dropdown-toggle:focus-within) {
  border-color: var(--chat-accent);
  box-shadow: 0 0 0 3px var(--chat-focus-ring);
  background: var(--chat-surface);
}
.chat-select :deep(.vs__selected-options) {
  min-width: 0;
  padding: 0;
  flex-wrap: nowrap;
  align-items: center;
}
.chat-select :deep(.vs__selected) {
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 14px;
}
.selected-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chat-select :deep(.vs__search) {
  min-height: calc(var(--chat-select-height, 46px) - 14px);
  min-width: 0;
  margin: 0;
  padding: 0;
  font-family: inherit;
}
.chat-select :deep(.vs__actions) {
  padding: 0 0 0 10px;
}
.select-chevron {
  color: var(--chat-muted);
  fill: none;
}
.chat-select :deep(.vs__dropdown-menu) {
  top: calc(100% + 6px);
  min-width: 0;
  max-height: var(--select-menu-max-height);
  padding: 5px;
  border: 1px solid var(--chat-border);
  border-radius: 12px;
  box-shadow: var(--chat-card-shadow);
  scrollbar-width: thin;
  scrollbar-color: var(--chat-scrollbar) transparent;
  overscroll-behavior: contain;
}
.opens-upward :deep(.vs__dropdown-menu) {
  top: auto;
  bottom: calc(100% + 6px);
}
.chat-select :deep(.vs__dropdown-option) {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 10px;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1.5;
  white-space: normal;
}
.chat-select :deep(.vs__dropdown-option--selected) {
  color: var(--chat-accent-strong);
  background: var(--chat-accent-soft);
}
.option-label {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.chat-select :deep(.vs__no-options) {
  padding: 14px 10px;
  font-size: 13px;
  color: var(--chat-muted);
}
.chat-select :deep(.vs--disabled) {
  opacity: 0.5;
}
@media (max-width: 600px) {
  .chat-select {
    --vs-font-size: 16px;
  }
  .chat-select :deep(.vs__dropdown-option) {
    min-height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .chat-select {
    --vs-transition-duration: 0s;
  }
  .chat-select :deep(.vs__dropdown-toggle) {
    transition: none;
  }
}
</style>
