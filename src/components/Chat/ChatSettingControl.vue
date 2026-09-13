<script setup>
import { computed, useId } from "vue";
import ChatSelect from "./ChatSelect.vue";

const props = defineProps({
  control: { type: Object, required: true },
  presentation: { type: Object, required: true },
  modelValue: { type: [String, Number, Boolean], default: undefined },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);
const id = useId();
const descriptionId = `${id}-description`;
const formattedValue = computed(() => {
  const number = Number(props.modelValue);
  if (!Number.isFinite(number)) return "";
  const decimals = Number(props.control.decimals);
  return Number.isFinite(decimals) ? number.toFixed(decimals) : String(number);
});
const rangeProgress = computed(() => {
  const min = Number(props.control.min ?? 0);
  const max = Number(props.control.max ?? 100);
  const value = Number(props.modelValue ?? min);
  return `${max > min && Number.isFinite(value) ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0}%`;
});

function updateNumber(event) {
  const raw = event.target.value;
  if (raw === "" || !Number.isFinite(Number(raw))) return;
  emit("update:modelValue", Number(raw));
}
</script>

<template>
  <div class="setting-row" :class="{ 'is-disabled': disabled, 'is-toggle': control.type === 'toggle' }">
    <div class="setting-copy">
      <label :for="control.type === 'select' ? undefined : id" class="setting-label">{{ presentation.label }}</label>
      <p v-if="presentation.description" :id="descriptionId" class="setting-description">{{ presentation.description }}</p>
    </div>

    <div class="setting-input" :class="{ 'toggle-input': control.type === 'toggle' }">
      <input
        v-if="control.type === 'toggle'"
        :id="id"
        class="switch"
        type="checkbox"
        role="switch"
        :checked="Boolean(modelValue)"
        :disabled="disabled"
        :aria-describedby="presentation.description ? descriptionId : undefined"
        @change="emit('update:modelValue', $event.target.checked)"
      />
      <ChatSelect
        v-else-if="control.type === 'select'"
        :label="presentation.label"
        :description-id="presentation.description ? descriptionId : undefined"
        :model-value="String(modelValue ?? '')"
        :options="options"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <div v-else-if="control.type === 'number'" class="number-input">
        <input
          :id="id"
          class="control"
          type="number"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          :value="Number(modelValue ?? 0)"
          :disabled="disabled"
          :aria-describedby="presentation.description ? descriptionId : undefined"
          @input="updateNumber"
        />
      </div>
      <div v-else-if="control.type === 'range'" class="range-input">
        <input
          :id="id"
          class="range"
          type="range"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          :value="Number(modelValue ?? 0)"
          :disabled="disabled"
          :aria-describedby="presentation.description ? descriptionId : undefined"
          :style="{ '--range-progress': rangeProgress }"
          @input="updateNumber"
        />
        <output :for="id" class="range-value">{{ formattedValue }}</output>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setting-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 220px);
  align-items: center;
  gap: 24px;
  min-height: 60px;
  padding: 8px 0;
}
.setting-copy,
.setting-input { min-width: 0; }
.setting-row.is-toggle { grid-template-columns: minmax(0, 1fr) auto; }
.setting-label { color: var(--chat-text); font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.setting-description { margin: 3px 0 0; color: var(--chat-muted); font-size: 12px; line-height: 1.6; }
.toggle-input { display: flex; justify-content: flex-end; }
.control {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--chat-border);
  border-radius: 7px;
  background: transparent;
  color: var(--chat-text);
  font: inherit;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.control:hover:not(:disabled) { border-color: var(--chat-scrollbar); }
.control:focus { outline: 2px solid var(--chat-focus-ring); outline-offset: 1px; border-color: var(--chat-accent); }
.range-input { display: flex; align-items: center; gap: 16px; }
.range-value { min-width: 3ch; text-align: right; color: var(--chat-muted); font-size: 13px; font-variant-numeric: tabular-nums; }
.range { appearance: none; width: 100%; min-width: 0; height: 32px; margin: 0; background: transparent; cursor: pointer; }
.range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(to right, var(--chat-accent) var(--range-progress), var(--chat-border) var(--range-progress));
}
.range::-moz-range-track { height: 3px; border-radius: 3px; background: var(--chat-border); }
.range::-moz-range-progress { height: 3px; background: var(--chat-accent); }
.range::-webkit-slider-thumb {
  appearance: none;
  width: 13px;
  height: 13px;
  margin-top: -5px;
  border-radius: 50%;
  border: 2px solid var(--chat-surface);
  background: var(--chat-accent);
  box-shadow: 0 0 0 1px var(--chat-accent);
}
.range::-moz-range-thumb {
  box-sizing: border-box;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid var(--chat-surface);
  background: var(--chat-accent);
  box-shadow: 0 0 0 1px var(--chat-accent);
}
.switch {
  appearance: none;
  box-sizing: border-box;
  position: relative;
  width: 34px;
  height: 20px;
  margin: 0;
  border: 0;
  border-radius: 20px;
  background: var(--chat-scrollbar);
  cursor: pointer;
  transition: background-color 0.18s ease;
}
.switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
  transition: transform 0.18s ease;
}
.switch:checked { background: var(--chat-accent); }
.switch:checked::after { transform: translateX(14px); }
.switch:focus-visible,
.range:focus-visible { outline: 2px solid var(--chat-accent); outline-offset: 4px; }
.is-disabled { opacity: 0.5; }
:disabled { cursor: not-allowed; }
@media (max-width: 600px) {
  .setting-row { grid-template-columns: minmax(0, 1fr) minmax(0, 140px); gap: 16px; }
  .control { font-size: 16px; }
  .switch { width: 38px; height: 24px; }
  .switch::after { width: 18px; height: 18px; }
}
@media (max-width: 359px) {
  .setting-row { grid-template-columns: minmax(0, 1fr) minmax(0, 124px); gap: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .switch, .switch::after { transition: none; }
}
</style>
