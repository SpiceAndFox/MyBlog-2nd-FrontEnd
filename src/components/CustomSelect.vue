<script setup>
import { ref } from "vue";

// 定义组件的 props
defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  options: {
    type: Array,
    required: true,
  },
  placeholder: {
    type: String,
    default: "请选择",
  },
  customClass: {
    type: String,
    default: "",
  },
});

// 定义组件的 emits
const emit = defineEmits(["update:modelValue"]);

// --- 组件内部状态 ---
const isOpen = ref(false);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectOption(option) {
  emit("update:modelValue", option);
  isOpen.value = false;
}

// 处理点击外部区域关闭下拉框
const vClickOutside = {
  mounted(el, binding) {
    el.__ClickOutsideHandler__ = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.__ClickOutsideHandler__);
  },
  unmounted(el) {
    document.body.removeEventListener("click", el.__ClickOutsideHandler__);
  },
};
</script>

<template>
  <div class="custom-select" :class="customClass" v-click-outside="() => (isOpen = false)">
    <button class="custom-select__trigger" @click="toggleDropdown">
      {{ modelValue || placeholder }}
      <span class="custom-select__arrow" :class="{ 'is-open': isOpen }"></span>
    </button>

    <transition name="options-fade">
      <div v-if="isOpen" class="custom-select__options">
        <div
          v-for="option in options"
          :key="option"
          class="custom-select__option"
          :class="{ 'is-selected': option === modelValue }"
          @click="selectOption(option)"
        >
          {{ option }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* --- 自定义下拉框样式 --- */
.custom-select {
  position: relative;
  width: 80px;
}

.custom-select__trigger {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary-text-color);
  background-color: #fff;
  border: 1px solid var(--panel-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-select__trigger:hover {
  border-color: #a0aec0;
}

.custom-select__trigger:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.custom-select__arrow {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--secondary-text-color);
  transition: transform 0.2s ease;
}
.custom-select__arrow.is-open {
  transform: rotate(180deg);
}

.custom-select__options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background-color: var(--panel-bg);
  border: 1px solid var(--panel-border-color);
  border-radius: var(--base-radius);
  padding: 6px;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
}

.custom-select__option {
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--primary-text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.custom-select__option:hover {
  background-color: var(--tag-hover-bg);
}

.custom-select__option.is-selected {
  background-color: var(--accent-color);
  color: var(--accent-text-color);
  font-weight: 600;
}

.options-fade-enter-from,
.options-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}
.options-fade-enter-active,
.options-fade-leave-active {
  transition: all 0.2s ease;
}
</style>
