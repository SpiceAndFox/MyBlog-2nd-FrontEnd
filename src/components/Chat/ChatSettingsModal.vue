<script setup>
import { computed, reactive, watch } from "vue";

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

function coerceControlValue(control, rawValue) {
  if (!control) return undefined;
  const type = String(control.type || "").trim();

  if (type === "toggle") {
    if (typeof rawValue === "boolean") return rawValue;
    return undefined;
  }

  if (type === "range" || type === "number") {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : undefined;
  }

  if (type === "select") {
    const options = Array.isArray(control.options) ? control.options : [];
    const allowed = new Set(options.map((option) => String(option?.value ?? "")));
    const normalized = rawValue === undefined || rawValue === null ? "" : String(rawValue);
    if (normalized && allowed.has(normalized)) return normalized;

    const fallbackDefault = control.default === undefined || control.default === null ? "" : String(control.default);
    if (fallbackDefault && allowed.has(fallbackDefault)) return fallbackDefault;

    const first = options[0]?.value;
    return first === undefined || first === null ? "" : String(first);
  }

  return undefined;
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

function formatControlValue(control, rawValue) {
  const decimals = Number(control?.decimals);
  const number = Number(rawValue);
  if (!Number.isFinite(number)) return "";
  if (Number.isFinite(decimals)) return number.toFixed(decimals);
  return String(number);
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

function onSelectChange(control, event) {
  setDraftValue(control.key, String(event?.target?.value ?? ""));
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

  const controls = getProviderSettingsSchema(provider).filter((control) =>
    isControlVisible(control, provider, modelId)
  );
  for (const control of controls) {
    if (!control?.key) continue;

    let nextValue = coerceControlValue(control, getValueByPath(source, control.key));
    if (nextValue === undefined) nextValue = coerceControlValue(control, getValueByPath(providerDefaults, control.key));
    if (nextValue === undefined) nextValue = coerceControlValue(control, getValueByPath(defaults, control.key));
    if (nextValue === undefined && control.default !== undefined)
      nextValue = coerceControlValue(control, control.default);

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
  }
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
    const controls = getProviderSettingsSchema(provider).filter((control) =>
      isControlVisible(control, provider, modelId)
    );
    for (const control of controls) {
      if (!control?.key) continue;
      if (control.type === "toggle" && control.key === "enableWebSearch") continue;

      const previousDefaultValue = coerceControlValue(control, getValueByPath(previousDefaults, control.key));
      const currentValue = coerceControlValue(control, getDraftValue(control.key));

      if (currentValue === undefined) {
        let nextDefaultValue = coerceControlValue(control, getValueByPath(providerDefaults, control.key));
        if (nextDefaultValue === undefined)
          nextDefaultValue = coerceControlValue(control, getValueByPath(defaults, control.key));
        if (nextDefaultValue === undefined && control.default !== undefined)
          nextDefaultValue = coerceControlValue(control, control.default);
        if (nextDefaultValue !== undefined) setDraftValue(control.key, nextDefaultValue);
        continue;
      }

      if (previousDefaultValue !== undefined && currentValue === previousDefaultValue) {
        let nextDefaultValue = coerceControlValue(control, getValueByPath(providerDefaults, control.key));
        if (nextDefaultValue === undefined)
          nextDefaultValue = coerceControlValue(control, getValueByPath(defaults, control.key));
        if (nextDefaultValue === undefined && control.default !== undefined)
          nextDefaultValue = coerceControlValue(control, control.default);
        if (nextDefaultValue !== undefined) setDraftValue(control.key, nextDefaultValue);
        continue;
      }

      if (control.type === "select") {
        const normalized = String(getDraftValue(control.key) ?? "");
        const options = Array.isArray(control.options) ? control.options : [];
        const allowed = new Set(options.map((option) => String(option?.value ?? "")));
        if (normalized && !allowed.has(normalized)) {
          setDraftValue(control.key, coerceControlValue(control, normalized));
        }
      }
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
    <div v-if="open" class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal">
        <header class="modal-header">
          <div class="header-left">
            <h3 class="modal-title">设置</h3>
          </div>

          <button class="icon-button" type="button" @click="close" aria-label="关闭">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <section class="section">
            <h4 class="section-title">提供方与模型</h4>
            <div class="grid">
              <label class="field">
                <span class="label">Provider</span>
                <select v-model="draft.providerId" class="control">
                  <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </label>

              <label class="field">
                <span class="label">Model</span>
                <select v-model="draft.modelId" class="control">
                  <option v-for="m in modelsForSelectedProvider" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
              </label>
            </div>
          </section>

          <section class="section">
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
                    @input="onNumberInput(control, $event)"
                  />
                </label>

                <label v-else-if="control.type === 'select'" class="field">
                  <span class="label">{{ control.label }}</span>
                  <select
                    class="control"
                    :value="String(getDraftValue(control.key) ?? '')"
                    @change="onSelectChange(control, $event)"
                  >
                    <option v-for="option in control.options" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>
              </template>

              <div v-if="toggleControls.length" class="field toggles">
                <label v-for="control in toggleControls" :key="control.key" class="toggle">
                  <input
                    type="checkbox"
                    :checked="Boolean(getDraftValue(control.key))"
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
          <button class="button button-primary" type="button" @click="save">保存</button>
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
  padding: 22px;
  background: rgba(17, 24, 39, 0.42);
  backdrop-filter: blur(8px);
  z-index: 40;
}

.modal {
  width: min(860px, 100%);
  height: min(550px, 70vh);
  border-radius: var(--chat-radius-lg, 14px);
  background: var(--chat-surface-2, #fff);
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--chat-text, #111827);
}

.icon-button {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  display: grid;
  place-items: center;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.icon-button:hover {
  background: rgba(17, 24, 39, 0.05);
  color: var(--chat-text, #111827);
}

.modal-body {
  padding: 14px 16px 16px;
  overflow: auto;
  overflow-x: hidden;
}

.section + .section {
  margin-top: 18px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: var(--chat-text, #111827);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field.full {
  grid-column: 1 / -1;
}

.label {
  font-size: 0.82rem;
  color: rgba(17, 24, 39, 0.72);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.value {
  color: rgba(17, 24, 39, 0.5);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.control {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  padding: 10px 12px;
  font-size: 0.95rem;
  outline: none;
  background: rgba(249, 250, 251, 0.9);
  color: rgba(17, 24, 39, 0.92);
}

.control:focus {
  border-color: rgba(16, 163, 127, 0.65);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.18);
}

.textarea {
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, "Segoe UI", system-ui, sans-serif;
  resize: vertical;
  max-width: 100%;
  min-height: 140px;
  line-height: 1.55;
}

.range {
  width: 100%;
  accent-color: var(--chat-accent, #3b82f6);
  margin: 0;
}

.toggles {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed rgba(17, 24, 39, 0.18);
  background: rgba(249, 250, 251, 0.75);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(17, 24, 39, 0.82);
  font-size: 0.92rem;
  user-select: none;
  min-width: 220px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
}

.button {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.06s ease;
}

.button:active {
  transform: translateY(1px);
}

.button-secondary {
  background: transparent;
  color: var(--chat-text, #111827);
  border-color: rgba(17, 24, 39, 0.14);
}

.button-secondary:hover {
  background: rgba(17, 24, 39, 0.04);
}

.button-primary {
  background: var(--chat-accent, #3b82f6);
  color: #fff;
}

.button-primary:hover {
  background: var(--chat-accent-strong, #2563eb);
}

.chat-dialog-fade-enter-active,
.chat-dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-dialog-fade-enter-from,
.chat-dialog-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .modal-overlay {
    padding: 0;
    align-items: stretch;
  }

  .modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .toggles {
    flex-direction: column;
    align-items: flex-start;
  }

  .toggle {
    min-width: 0;
  }
}
</style>
