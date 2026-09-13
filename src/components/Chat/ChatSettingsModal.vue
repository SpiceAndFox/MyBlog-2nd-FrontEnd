<script setup>
import { computed, reactive, watch } from "vue";
import ChatIcon from "./ChatIcon.vue";
import ChatSelect from "./ChatSelect.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  providers: { type: Array, default: () => [] },
  currentSettings: { type: Object, required: true },
  defaultSettings: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["close", "save"]);

const draft = reactive({});

function readDefaults() {
  const value = props.defaultSettings;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function splitPath(path) {
  return String(path || "")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getValueByPath(target, path) {
  const parts = splitPath(path);
  if (!parts.length) return undefined;
  let current = target;
  for (const part of parts) {
    if (!isPlainObject(current) && typeof current !== "object") return undefined;
    current = current?.[part];
    if (current === undefined) return undefined;
  }
  return current;
}

function setValueByPath(target, path, value) {
  const parts = splitPath(path);
  if (!parts.length) return;
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!isPlainObject(current[part])) current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function getProviderDefaults(provider, defaults) {
  const base = isPlainObject(defaults) ? defaults : {};
  if (isPlainObject(provider?.defaults)) return provider.defaults;
  return base;
}

function getProviderSettingsSchema(provider) {
  return Array.isArray(provider?.settingsSchema) ? provider.settingsSchema : [];
}

// 按当前模型过滤控件的 options。
// 控件可通过 optionsFrom 声明"可选项由 model 的该字段决定"，
// 例如 reasoningEffort 控件声明 optionsFrom: "reasoningEfforts"，
// 则只保留 model.reasoningEfforts 中列出的 option。
// 未声明 optionsFrom 或 model 缺少该字段时，返回全集（向后兼容）。
function resolveControlOptions(control, model) {
  const options = Array.isArray(control?.options) ? control.options : [];
  const sourceField = String(control?.optionsFrom || "").trim();
  if (!sourceField) return options;
  const allowed = Array.isArray(model?.[sourceField]) ? model[sourceField] : null;
  if (!allowed) return options;
  const allowedSet = new Set(allowed.map((v) => String(v ?? "").trim()).filter(Boolean));
  return options.filter((option) => allowedSet.has(String(option?.value ?? "").trim()));
}

// 若 select 控件当前值在指定模型的可用 options 中不合法，则重置为合法回退值。
// 重置时优先取 model.defaults，其次 control.default/options[0]。
// 用于 modelId 变化（含同 provider 内换模型）后校正残留的非法值。
function resetSelectIfInvalid(control, model) {
  if (!control || control.type !== "select") return;
  const normalized = String(getDraftValue(control.key) ?? "");
  if (!normalized) return;
  const options = resolveControlOptions(control, model);
  const allowed = new Set(options.map((option) => String(option?.value ?? "")));
  if (!allowed.has(normalized)) {
    const modelDefaults = isPlainObject(model?.defaults) ? model.defaults : {};
    setDraftValue(control.key, resolveDefaultValue(control, [modelDefaults], model));
  }
}

// 纯验证：值合法则返回规范化后的值，非法/空返回 undefined。
// 返回 undefined 是让优先级链继续向下一层 source 查找的关键。
function validateControlValue(control, rawValue, model) {
  if (!control) return undefined;
  const type = String(control.type || "").trim();

  if (type === "toggle") {
    return typeof rawValue === "boolean" ? rawValue : undefined;
  }

  if (type === "range" || type === "number") {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : undefined;
  }

  if (type === "select") {
    const options = resolveControlOptions(control, model);
    const allowed = new Set(options.map((option) => String(option?.value ?? "")));
    const normalized = rawValue === undefined || rawValue === null ? "" : String(rawValue);
    return normalized && allowed.has(normalized) ? normalized : undefined;
  }

  return undefined;
}

// 回退值：控件在该模型下的兜底默认值。
// select: control.default 若在可用 options 中则用它，否则取 options[0]。
// range/number/toggle: control.default（若类型匹配）。
function resolveControlFallback(control, model) {
  if (!control) return undefined;
  const type = String(control.type || "").trim();

  if (type === "toggle") {
    return typeof control.default === "boolean" ? control.default : undefined;
  }

  if (type === "range" || type === "number") {
    const number = Number(control.default);
    return Number.isFinite(number) ? number : undefined;
  }

  if (type === "select") {
    const options = resolveControlOptions(control, model);
    const allowed = new Set(options.map((option) => String(option?.value ?? "")));
    const fallbackDefault = control.default === undefined || control.default === null ? "" : String(control.default);
    if (fallbackDefault && allowed.has(fallbackDefault)) return fallbackDefault;
    const first = options[0]?.value;
    return first === undefined || first === null ? "" : String(first);
  }

  return undefined;
}

// 按优先级链解析默认值：依次从 sourceList 中验证控件的值，
// 首个合法值胜出；全部失败则回退到 resolveControlFallback。
function resolveDefaultValue(control, sourceList, model) {
  const sources = Array.isArray(sourceList) ? sourceList : [];
  for (const source of sources) {
    const value = validateControlValue(control, getValueByPath(source, control.key), model);
    if (value !== undefined) return value;
  }
  return resolveControlFallback(control, model);
}

function isControlVisible(control, provider, modelId) {
  if (!control) return false;
  const capability = String(control.capability || "").trim();
  if (capability && provider?.capabilities?.[capability] === false) return false;

  const blocklist = Array.isArray(control.modelBlocklist) ? control.modelBlocklist : [];
  if (blocklist.length && blocklist.includes(String(modelId || ""))) return false;

  return true;
}

function getDraftValue(path) {
  return getValueByPath(draft, path);
}

function setDraftValue(path, value) {
  setValueByPath(draft, path, value);
}

function matchesControlCondition(condition) {
  if (!isPlainObject(condition)) return false;
  const key = String(condition.key || "").trim();
  if (!key) return false;
  return Object.is(getDraftValue(key), condition.value);
}

function isControlDisabled(control) {
  const condition = control?.disabledWhen;
  if (!isPlainObject(condition)) return false;
  // 若当前模型在条件的 modelBlocklist 中，则不应用此禁用条件
  // （例如 grok-4.5 隐藏了 reasoningEnabled 开关，effort 不应再受其联动禁用）
  const modelId = String(draft.modelId || "").trim();
  const blocklist = Array.isArray(condition.modelBlocklist) ? condition.modelBlocklist : [];
  if (modelId && blocklist.includes(modelId)) return false;
  return matchesControlCondition(condition);
}

function formatControlValue(control, rawValue) {
  const decimals = Number(control?.decimals);
  const number = Number(rawValue);
  if (!Number.isFinite(number)) return "";
  if (Number.isFinite(decimals)) return number.toFixed(decimals);
  return String(number);
}

function rangeProgress(control) {
  const min = Number(control.min ?? 0);
  const max = Number(control.max ?? 100);
  const value = Number(getDraftValue(control.key) ?? min);
  if (!Number.isFinite(value) || max <= min) return "0%";
  return `${Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))}%`;
}

function onRangeInput(control, event) {
  const raw = event?.target?.value;
  const number = Number(raw);
  if (!Number.isFinite(number)) return;
  setDraftValue(control.key, number);
}

function onNumberInput(control, event) {
  const raw = event?.target?.value;
  if (raw === "" || raw === undefined || raw === null) return;
  const number = Number(raw);
  if (!Number.isFinite(number)) return;
  setDraftValue(control.key, number);
}

function onToggleChange(control, event) {
  setDraftValue(control.key, Boolean(event?.target?.checked));
}

function applyFromCurrentSettings() {
  const source = props.currentSettings || {};
  const defaults = readDefaults();
  const fallbackDefaultProviderId = String(defaults.providerId || "").trim();
  const defaultProvider = props.providers.find((p) => p.id === fallbackDefaultProviderId) || props.providers[0] || null;
  const desiredProviderId = String(source.providerId || "").trim();
  const provider = props.providers.find((p) => p.id === desiredProviderId) || defaultProvider;
  const providerId = provider?.id || "";
  const providerDefaults =
    provider && provider.defaults && typeof provider.defaults === "object" && !Array.isArray(provider.defaults)
      ? provider.defaults
      : defaults;

  const defaultModelId = provider?.models?.[0]?.id || "";
  const fallbackDefaultModelId = String(providerDefaults.modelId || defaults.modelId || "").trim();
  const desiredModelId = source.modelId || "";
  const modelId = provider?.models?.some((m) => m.id === desiredModelId)
    ? desiredModelId
    : provider?.models?.some((m) => m.id === fallbackDefaultModelId)
    ? fallbackDefaultModelId
    : defaultModelId;

  draft.providerId = providerId;
  draft.modelId = modelId;

  const providerSupportsWebSearch = provider?.capabilities?.webSearch !== false;

  const activeModel = provider?.models?.find((m) => m.id === modelId) || null;
  const modelDefaults = activeModel && isPlainObject(activeModel.defaults) ? activeModel.defaults : {};

  const controls = getProviderSettingsSchema(provider).filter((control) =>
    isControlVisible(control, provider, modelId)
  );
  for (const control of controls) {
    if (!control?.key) continue;

    let nextValue = resolveDefaultValue(
      control,
      [source, modelDefaults, providerDefaults, defaults],
      activeModel
    );

    if (control.key === "enableWebSearch" && !providerSupportsWebSearch) {
      nextValue = false;
    }

    if (nextValue !== undefined) setDraftValue(control.key, nextValue);
  }

  if (!providerSupportsWebSearch) {
    draft.enableWebSearch = false;
  } else if (typeof source.enableWebSearch === "boolean") {
    draft.enableWebSearch = source.enableWebSearch;
  } else if (typeof providerDefaults.enableWebSearch === "boolean") {
    draft.enableWebSearch = providerDefaults.enableWebSearch;
  } else if (typeof defaults.enableWebSearch === "boolean") {
    draft.enableWebSearch = defaults.enableWebSearch;
  }
}

const selectedProvider = computed(() => props.providers.find((p) => p.id === draft.providerId) || null);
const modelsForSelectedProvider = computed(() => selectedProvider.value?.models || []);
const providerOptions = computed(() => props.providers.map(p => ({ value: p.id, label: p.name })));
const modelOptions = computed(() => modelsForSelectedProvider.value.map(m => ({ value: m.id, label: m.name })));
const selectedModel = computed(
  () => modelsForSelectedProvider.value.find((m) => m.id === draft.modelId) || null
);

const visibleSettingsSchema = computed(() => {
  const provider = selectedProvider.value;
  const schema = getProviderSettingsSchema(provider);
  const modelId = draft.modelId;
  return schema.filter((control) => isControlVisible(control, provider, modelId));
});

const fieldControls = computed(() => visibleSettingsSchema.value.filter((control) => control.type !== "toggle"));
const toggleControls = computed(() => visibleSettingsSchema.value.filter((control) => control.type === "toggle"));

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    applyFromCurrentSettings();
  },
  { immediate: true },
);

watch(
  () => draft.providerId,
  (providerId, previousProviderId) => {
    const models = modelsForSelectedProvider.value;
    if (!providerId || !models.length) return;

    const defaults = readDefaults();
    const provider = props.providers.find((p) => p.id === providerId) || null;
    const providerDefaults =
      provider && provider.defaults && typeof provider.defaults === "object" && !Array.isArray(provider.defaults)
        ? provider.defaults
        : defaults;
    const providerSupportsWebSearch = provider?.capabilities?.webSearch !== false;

    if (!previousProviderId) {
      if (!models.some((m) => m.id === draft.modelId)) {
        const desiredModelId = String(providerDefaults.modelId || "").trim();
        draft.modelId = models.some((m) => m.id === desiredModelId) ? desiredModelId : models[0]?.id || "";
      }
      return;
    }

    if (!models.some((m) => m.id === draft.modelId)) {
      const desiredModelId = String(providerDefaults.modelId || "").trim();
      draft.modelId = models.some((m) => m.id === desiredModelId) ? desiredModelId : models[0]?.id || "";
    }

    const previousProvider = props.providers.find((p) => p.id === previousProviderId) || null;
    const previousDefaults =
      previousProvider &&
      previousProvider.defaults &&
      typeof previousProvider.defaults === "object" &&
      !Array.isArray(previousProvider.defaults)
        ? previousProvider.defaults
        : defaults;

    if (!providerSupportsWebSearch) {
      draft.enableWebSearch = false;
    } else if (
      typeof previousDefaults.enableWebSearch === "boolean" &&
      draft.enableWebSearch === previousDefaults.enableWebSearch
    ) {
      draft.enableWebSearch = providerDefaults.enableWebSearch;
    }

    const modelId = draft.modelId;
    const activeModel = provider?.models?.find((m) => m.id === modelId) || null;
    const modelDefaults = activeModel && isPlainObject(activeModel.defaults) ? activeModel.defaults : {};
    const controls = getProviderSettingsSchema(provider).filter((control) =>
      isControlVisible(control, provider, modelId)
    );
    for (const control of controls) {
      if (!control?.key) continue;
      if (control.type === "toggle" && control.key === "enableWebSearch") continue;

      const previousDefaultValue = validateControlValue(
        control,
        getValueByPath(previousDefaults, control.key),
        activeModel
      );
      const currentValue = validateControlValue(control, getDraftValue(control.key), activeModel);

      if (currentValue === undefined) {
        const nextDefaultValue = resolveDefaultValue(
          control,
          [modelDefaults, providerDefaults, defaults],
          activeModel
        );
        if (nextDefaultValue !== undefined) setDraftValue(control.key, nextDefaultValue);
        continue;
      }

      if (previousDefaultValue !== undefined && currentValue === previousDefaultValue) {
        const nextDefaultValue = resolveDefaultValue(
          control,
          [modelDefaults, providerDefaults, defaults],
          activeModel
        );
        if (nextDefaultValue !== undefined) setDraftValue(control.key, nextDefaultValue);
        continue;
      }

      if (control.type === "select") {
        resetSelectIfInvalid(control, activeModel);
      }
    }
  }
);

// 同 provider 内切换模型时，校正 select 控件残留的非法值。
// provider 切换由上面的 providerId watcher 处理；此处仅覆盖 modelId 变化。
watch(
  () => draft.modelId,
  (modelId, previousModelId) => {
    if (!modelId || modelId === previousModelId) return;
    const provider = selectedProvider.value;
    if (!provider) return;
    const model = provider.models?.find((m) => m.id === modelId) || null;
    const controls = getProviderSettingsSchema(provider).filter((control) =>
      isControlVisible(control, provider, modelId)
    );
    for (const control of controls) {
      if (!control?.key) continue;
      resetSelectIfInvalid(control, model);
    }
  }
);

watch(
  () => props.open,
  (open, _previous, onCleanup) => {
    if (!open) return;
    const onKeydown = (event) => {
      if (event.key !== "Escape") return;
      emit("close");
    };
    window.addEventListener("keydown", onKeydown);
    onCleanup(() => window.removeEventListener("keydown", onKeydown));
  }
);

function close() {
  emit("close");
}

function save() {
  emit("save", { ...draft });
}
</script>

<template>
  <transition name="chat-dialog-fade">
    <div
      v-if="open"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-settings-title"
      aria-describedby="chat-settings-description"
    >
      <div class="modal">
        <header class="modal-header">
          <div class="header-left">
            <span class="header-icon"><ChatIcon name="settings" :size="22" /></span>
            <div>
              <h3 id="chat-settings-title" class="modal-title">聊天设置</h3>
              <p id="chat-settings-description" class="description">选择模型，调整适合你的对话节奏。</p>
            </div>
          </div>

          <button class="icon-button" type="button" @click="close" aria-label="关闭">
            <ChatIcon name="x" :size="20" />
          </button>
        </header>

        <div class="modal-body">
          <section class="section">
            <h4 class="section-title">提供方与模型</h4>
            <div class="grid">
              <div class="field">
                <span class="label">提供方</span>
                <ChatSelect v-model="draft.providerId" :options="providerOptions" label="提供方" searchable />
              </div>

              <div class="field">
                <span class="label">模型</span>
                <ChatSelect v-model="draft.modelId" :options="modelOptions" label="模型" searchable />
              </div>
            </div>
          </section>

          <section v-if="visibleSettingsSchema.length" class="section">
            <h4 class="section-title">生成参数</h4>
            <div class="grid">
              <template v-for="control in fieldControls" :key="control.key">
                <label v-if="control.type === 'range'" class="field">
                  <span class="label"
                    >{{ control.label }}
                    <span class="value">{{ formatControlValue(control, getDraftValue(control.key)) }}</span></span
                  >
                  <input
                    class="range"
                    type="range"
                    :min="control.min"
                    :max="control.max"
                    :step="control.step"
                    :value="Number(getDraftValue(control.key) ?? 0)"
                    :disabled="isControlDisabled(control)"
                    :style="{ '--range-progress': rangeProgress(control) }"
                    @input="onRangeInput(control, $event)"
                  />
                </label>

                <label v-else-if="control.type === 'number'" class="field">
                  <span class="label">{{ control.label }}</span>
                  <input
                    class="control"
                    type="number"
                    :min="control.min"
                    :max="control.max"
                    :step="control.step"
                    :value="Number(getDraftValue(control.key) ?? 0)"
                    :disabled="isControlDisabled(control)"
                    @input="onNumberInput(control, $event)"
                  />
                </label>

                <div v-else-if="control.type === 'select'" class="field">
                  <span class="label">{{ control.label }}</span>
                  <ChatSelect
                    :label="control.label"
                    :model-value="String(getDraftValue(control.key) ?? '')"
                    :options="resolveControlOptions(control, selectedModel)"
                    :disabled="isControlDisabled(control)"
                    @update:model-value="setDraftValue(control.key, $event)"
                  />
                </div>
              </template>

              <div v-if="toggleControls.length" class="field toggles">
                <label v-for="control in toggleControls" :key="control.key" class="toggle">
                  <input
                    type="checkbox"
                    :checked="Boolean(getDraftValue(control.key))"
                    :disabled="isControlDisabled(control)"
                    @change="onToggleChange(control, $event)"
                  />
                  <span>{{ control.label }}</span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="button button-secondary" type="button" @click="close">取消</button>
          <button class="button button-primary" type="button" @click="save">保存设置</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  padding: 24px;
  background: var(--chat-overlay);
  backdrop-filter: blur(6px);
  z-index: 40;
}

.modal {
  width: min(760px, 100%);
  max-height: 100%;
  border-radius: 20px;
  background: var(--chat-surface-2);
  color: var(--chat-text);
  color-scheme: light;
  border: 1px solid var(--chat-border);
  box-shadow: var(--chat-card-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal,
.modal * {
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex: 0 0 auto;
  padding: 22px 24px;
  border-bottom: 1px solid var(--chat-border);
  background: var(--chat-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.header-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 14px;
  background: var(--chat-accent-soft);
  color: var(--chat-accent);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.description {
  margin: 6px 0 0;
  color: var(--chat-muted);
  font-size: 12px;
  line-height: 1.6;
}

.icon-button {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: var(--chat-radius-md);
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--chat-muted);
  display: grid;
  place-items: center;
}

.icon-button:hover {
  background: var(--chat-sidebar-hover);
  color: var(--chat-text);
}

.modal-body {
  min-height: 0;
  padding: 20px 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-scrollbar) transparent;
  scrollbar-gutter: stable;
}

.section {
  padding: 20px;
  border: 1px solid var(--chat-border);
  border-radius: var(--chat-radius-lg);
  background: var(--chat-surface);
}

.section + .section {
  margin-top: 16px;
}

.section-title {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 18px;
  align-items: start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
}

.label {
  font-size: 12px;
  line-height: 1.5;
  color: var(--chat-muted);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.value {
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--chat-accent-soft);
  color: var(--chat-accent-strong);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.control {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 44px;
  border-radius: var(--chat-radius-md);
  border: 1px solid var(--chat-border);
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
  background: var(--chat-surface-2);
  color: var(--chat-text);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.control:hover:not(:disabled) {
  border-color: var(--chat-scrollbar);
}

.control:focus {
  outline: none;
  border-color: var(--chat-accent);
  box-shadow: 0 0 0 3px var(--chat-focus-ring);
}

.control:disabled,
.range:disabled,
.toggle input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.range {
  appearance: none;
  width: 100%;
  height: 28px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  accent-color: var(--chat-accent);
}

.range::-webkit-slider-runnable-track {
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--chat-accent) var(--range-progress), var(--chat-border) var(--range-progress));
}

.range::-moz-range-track {
  height: 5px;
  border-radius: 999px;
  background: var(--chat-border);
}

.range::-moz-range-progress {
  height: 5px;
  border-radius: 999px;
  background: var(--chat-accent);
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -5.5px;
  border-radius: 50%;
  border: 3px solid var(--chat-surface);
  background: var(--chat-accent);
  box-shadow: 0 0 0 1px var(--chat-accent);
}

.range::-moz-range-thumb {
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid var(--chat-surface);
  background: var(--chat-accent);
  box-shadow: 0 0 0 1px var(--chat-accent);
}

.toggles {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  padding-top: 14px;
  border-top: 1px solid var(--chat-border);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: var(--chat-text);
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
}

.toggle input {
  appearance: none;
  position: relative;
  width: 34px;
  height: 20px;
  flex: 0 0 auto;
  margin: 0;
  border: 1px solid var(--chat-scrollbar);
  border-radius: 999px;
  background: var(--chat-scrollbar);
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.toggle input::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--chat-surface);
  transition: transform 0.18s ease;
}

.toggle input:checked {
  background: var(--chat-accent);
  border-color: var(--chat-accent);
}

.toggle input:checked::after {
  transform: translateX(14px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
  padding: 16px 24px;
  border-top: 1px solid var(--chat-border);
  background: var(--chat-surface);
}

.button {
  min-height: 44px;
  min-width: 80px;
  border: 1px solid transparent;
  border-radius: var(--chat-radius-md);
  padding: 10px 18px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.button-secondary {
  background: var(--chat-surface);
  color: var(--chat-text);
  border-color: var(--chat-border);
}

.button-secondary:hover {
  background: var(--chat-sidebar-hover);
}

.button-primary {
  background: var(--chat-accent);
  color: var(--chat-avatar-user-text);
}

.button-primary:hover {
  background: var(--chat-accent-strong);
}

.icon-button:focus-visible,
.button:focus-visible,
.range:focus-visible,
.toggle input:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: 4px;
}

.chat-dialog-fade-enter-active,
.chat-dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-dialog-fade-enter-from,
.chat-dialog-fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 0;
    align-items: stretch;
  }

  .modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .modal-header {
    padding: max(16px, env(safe-area-inset-top)) 16px 16px;
  }

  .header-icon {
    display: none;
  }

  .modal-body {
    padding: 16px;
  }

  .section {
    padding: 16px;
  }

  .grid,
  .toggles {
    grid-template-columns: 1fr;
  }

  .control {
    font-size: 16px;
  }

  .modal-footer {
    padding: 14px 16px max(14px, env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal *,
  .toggle input::after,
  .chat-dialog-fade-enter-active,
  .chat-dialog-fade-leave-active {
    transition: none;
  }
}
</style>
