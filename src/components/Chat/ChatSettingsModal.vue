<script setup>
import { computed, reactive, ref, watch } from "vue";
import ChatIcon from "./ChatIcon.vue";
import ChatSelect from "./ChatSelect.vue";
import ChatSettingControl from "./ChatSettingControl.vue";
import { chatSettingsAdapter } from "./utils/settingsPresentation";

const props = defineProps({
  open: { type: Boolean, default: false },
  providers: { type: Array, default: () => [] },
  currentSettings: { type: Object, required: true },
  defaultSettings: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["close", "save"]);

const draft = reactive({});
const advancedOpen = ref(false);

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

const settingsView = computed(() => chatSettingsAdapter.adaptSchema(visibleSettingsSchema.value));
const commonControls = computed(() => settingsView.value.common);
const advancedGroups = computed(() => settingsView.value.advanced);
const advancedSummary = computed(() => advancedGroups.value.map((group) => group.title).join("与"));

function controlOptions(control) {
  return chatSettingsAdapter.adaptOptions(resolveControlOptions(control, selectedModel.value));
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    advancedOpen.value = false;
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
          <div>
            <h3 id="chat-settings-title" class="modal-title">聊天设置</h3>
            <p id="chat-settings-description" class="description">让对话，合乎你的节奏。</p>
          </div>
          <button class="icon-button" type="button" @click="close" aria-label="关闭聊天设置">
            <ChatIcon name="x" :size="19" />
          </button>
        </header>

        <div class="modal-body">
          <section class="section model-section" aria-labelledby="chat-model-heading">
            <h4 id="chat-model-heading" class="section-title">对话模型</h4>
            <div class="model-row">
              <span class="label">提供方</span>
              <ChatSelect v-model="draft.providerId" :options="providerOptions" label="提供方" searchable />
            </div>
            <div class="model-row">
              <span class="label">模型</span>
              <ChatSelect v-model="draft.modelId" :options="modelOptions" label="模型" searchable />
            </div>
            <p v-if="!providers.length" class="empty-message" role="status">暂无可用模型，请稍后重新打开设置。</p>
          </section>

          <section v-if="commonControls.length" class="section" aria-labelledby="chat-reply-heading">
            <h4 id="chat-reply-heading" class="section-title">回复偏好</h4>
            <ChatSettingControl
              v-for="{ control, presentation } in commonControls"
              :key="control.key"
              :control="control"
              :presentation="presentation"
              :model-value="getDraftValue(control.key)"
              :options="controlOptions(control)"
              :disabled="isControlDisabled(control)"
              @update:model-value="setDraftValue(control.key, $event)"
            />
          </section>

          <section v-if="advancedGroups.length" class="advanced-section">
            <button
              class="advanced-trigger"
              type="button"
              :aria-expanded="advancedOpen"
              aria-controls="chat-advanced-settings"
              @click="advancedOpen = !advancedOpen"
            >
              <span class="advanced-label">高级设置<span class="advanced-description">{{ advancedSummary }}</span></span>
              <ChatIcon class="advanced-chevron" :class="{ expanded: advancedOpen }" name="chevron" :size="16" />
            </button>
            <div v-show="advancedOpen" id="chat-advanced-settings" class="advanced-content">
              <section v-for="group in advancedGroups" :key="group.id" class="advanced-group" :aria-labelledby="`chat-${group.id}-heading`">
                <h4 :id="`chat-${group.id}-heading`" class="section-title">{{ group.title }}</h4>
                <p v-if="group.description" class="group-description">{{ group.description }}</p>
                <ChatSettingControl
                  v-for="{ control, presentation } in group.fields"
                  :key="control.key"
                  :control="control"
                  :presentation="presentation"
                  :model-value="getDraftValue(control.key)"
                  :options="controlOptions(control)"
                  :disabled="isControlDisabled(control)"
                  @update:model-value="setDraftValue(control.key, $event)"
                />
              </section>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <span class="footer-note">保存后用于后续回复</span>
          <div class="footer-actions">
            <button class="button button-secondary" type="button" @click="close">取消</button>
            <button class="button button-primary" type="button" :disabled="!selectedModel" @click="save">保存设置</button>
          </div>
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
  padding: 28px;
  background: var(--chat-overlay);
  backdrop-filter: blur(5px);
  z-index: 40;
}
.modal {
  --chat-select-height: 40px;
  --chat-select-radius: 7px;
  --chat-select-background: transparent;
  width: min(620px, 100%);
  max-height: 100%;
  border-radius: 14px;
  background: var(--chat-surface);
  color: var(--chat-text);
  color-scheme: light;
  border: 1px solid var(--chat-border);
  box-shadow: 0 20px 80px rgb(39 32 29 / 14%), 0 2px 10px rgb(39 32 29 / 4%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal, .modal * { box-sizing: border-box; }
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex: 0 0 auto;
  padding: 24px 30px 16px;
}
.modal-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 550;
  letter-spacing: 0.02em;
}
.description { margin: 7px 0 0; color: var(--chat-muted); font-size: 13px; line-height: 1.6; }
.icon-button {
  width: 36px;
  height: 36px;
  margin: -4px -8px 0 0;
  flex: 0 0 auto;
  border-radius: 7px;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--chat-muted);
  display: grid;
  place-items: center;
}
.icon-button:hover { background: var(--chat-surface-2); color: var(--chat-text); }
.modal-body {
  min-height: 0;
  padding: 0 30px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--chat-scrollbar) transparent;
}
.section { padding: 16px 0 8px; border-top: 1px solid var(--chat-border); }
.section-title { margin: 0 0 6px; color: var(--chat-muted); font-size: 12px; font-weight: 500; letter-spacing: 0.06em; line-height: 1.6; }
.model-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 270px); align-items: center; gap: 24px; min-height: 48px; padding: 4px 0; }
.label { font-size: 14px; line-height: 1.5; }
.empty-message { margin: 10px 0 0; font-size: 12px; color: var(--chat-muted); line-height: 1.6; }
.advanced-section { border-top: 1px solid var(--chat-border); }
.advanced-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 56px;
  padding: 14px 0;
  border: 0;
  color: var(--chat-text);
  background: transparent;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.advanced-trigger:hover { color: var(--chat-accent-strong); }
.advanced-label { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 16px; }
.advanced-description { color: var(--chat-muted); font-size: 12px; }
.advanced-chevron { color: var(--chat-muted); transition: transform 0.18s ease; }
.advanced-chevron.expanded { transform: rotate(180deg); }
.advanced-content { padding-bottom: 16px; }
.advanced-group + .advanced-group { margin-top: 16px; padding-top: 20px; border-top: 1px solid var(--chat-border); }
.group-description { margin: -2px 0 8px; color: var(--chat-muted); font-size: 12px; line-height: 1.6; }
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 0 0 auto;
  padding: 15px 30px;
  border-top: 1px solid var(--chat-border);
}
.footer-note { color: var(--chat-muted); font-size: 11px; }
.footer-actions { display: flex; gap: 10px; }
.button { min-height: 38px; border: 1px solid transparent; border-radius: 7px; padding: 8px 16px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.button-secondary { background: transparent; color: var(--chat-muted); }
.button-secondary:hover { background: var(--chat-surface-2); color: var(--chat-text); }
.button-primary { background: var(--chat-accent); color: #fff; }
.button-primary:hover:not(:disabled) { background: var(--chat-accent-strong); }
.button:disabled { opacity: 0.5; cursor: not-allowed; }
.icon-button:focus-visible, .button:focus-visible { outline: 2px solid var(--chat-accent); outline-offset: 3px; }
.advanced-trigger:focus-visible { outline: 2px solid var(--chat-accent); outline-offset: -2px; border-radius: 4px; }
.chat-dialog-fade-enter-active, .chat-dialog-fade-leave-active { transition: opacity 0.18s ease; }
.chat-dialog-fade-enter-active .modal, .chat-dialog-fade-leave-active .modal { transition: transform 0.18s ease; }
.chat-dialog-fade-enter-from, .chat-dialog-fade-leave-to { opacity: 0; }
.chat-dialog-fade-enter-from .modal, .chat-dialog-fade-leave-to .modal { transform: translateY(6px); }
@media (max-width: 600px) {
  .modal-overlay { padding: 12px; }
  .modal { border-radius: 12px; }
  .modal-header { padding: 24px 20px 20px; }
  .modal-title { font-size: 21px; }
  .modal-body { padding: 0 20px; }
  .model-row { grid-template-columns: minmax(0, 1fr) minmax(0, 190px); gap: 16px; }
  .icon-button { width: 44px; height: 44px; margin-top: -8px; }
  .modal-footer { padding: 14px 20px max(14px, env(safe-area-inset-bottom)); }
  .footer-note { line-height: 1.6; }
  .button { min-height: 44px; padding: 8px 14px; }
}
@media (max-width: 359px) {
  .modal-overlay { padding: 8px; }
  .modal-header { padding: 20px 16px 18px; }
  .modal-body { padding: 0 16px; }
  .model-row { grid-template-columns: minmax(0, 1fr) minmax(0, 174px); gap: 12px; }
  .modal-footer { padding-left: 16px; padding-right: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .chat-dialog-fade-enter-active, .chat-dialog-fade-leave-active,
  .chat-dialog-fade-enter-active .modal, .chat-dialog-fade-leave-active .modal,
  .advanced-chevron { transition: none; }
}
</style>
