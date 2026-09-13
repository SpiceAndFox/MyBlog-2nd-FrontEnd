<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps({
  label: { type: String, required: true },
  align: { type: String, default: "start" },
  placement: { type: String, default: "bottom" },
});
const detailsRef = ref(null);
const summaryRef = ref(null);
const menuRef = ref(null);

function close(restoreFocus = false) {
  if (!detailsRef.value?.open) return;
  detailsRef.value.open = false;
  if (restoreFocus) summaryRef.value?.focus();
}

function onPointerDown(event) {
  if (!detailsRef.value?.contains(event.target)) close();
}

function onFocusIn(event) {
  if (!detailsRef.value?.contains(event.target)) close();
}

function onKeydown(event) {
  if (event.key === "Escape" && detailsRef.value?.open) {
    event.preventDefault();
    event.stopPropagation();
    close(true);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  if (!detailsRef.value?.open && !["ArrowDown", "ArrowUp"].includes(event.key))
    return;
  detailsRef.value.open = true;
  const items = Array.from(
    menuRef.value?.querySelectorAll("a[href], button:not(:disabled)") || [],
  );
  if (!items.length) return;
  event.preventDefault();
  const index = items.indexOf(document.activeElement);
  const nextIndex =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : event.key === "ArrowUp"
          ? index <= 0
            ? items.length - 1
            : index - 1
          : (index + 1) % items.length;
  items[nextIndex].focus();
}

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("focusin", onFocusIn);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("focusin", onFocusIn);
});
defineExpose({ close });
</script>

<template>
  <details
    ref="detailsRef"
    class="chat-dropdown"
    :class="[`align-${align}`, `placement-${placement}`]"
    @keydown="onKeydown"
  >
    <summary ref="summaryRef" :aria-label="label">
      <slot name="trigger" />
    </summary>
    <div ref="menuRef" class="dropdown-menu">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.chat-dropdown {
  position: relative;
  min-width: 0;
}
.chat-dropdown[open] {
  z-index: 10;
}
.chat-dropdown:not([open]) .dropdown-menu {
  display: none;
}
summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 5px 7px;
  list-style: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.16s ease;
}
summary::-webkit-details-marker {
  display: none;
}
summary:hover {
  background: var(--chat-sidebar-hover);
}
summary:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: 3px;
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10;
  width: 216px;
  max-width: calc(100vw - 28px);
  max-height: min(380px, 60dvh);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 5px;
  border: 1px solid var(--chat-border);
  border-radius: 12px;
  background: var(--chat-surface);
  box-shadow: var(--chat-card-shadow);
}
.align-end .dropdown-menu {
  left: auto;
  right: 0;
}
.align-center .dropdown-menu {
  left: 50%;
  transform: translateX(-50%);
}
.placement-top .dropdown-menu {
  top: auto;
  bottom: calc(100% + 8px);
}
.dropdown-menu :deep(.menu-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--chat-text);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}
.dropdown-menu :deep(.menu-item:hover:not(:disabled)) {
  background: var(--chat-sidebar-hover);
}
.dropdown-menu :deep(.menu-item.active) {
  color: var(--chat-accent);
  background: var(--chat-sidebar-active);
}
.dropdown-menu :deep(.menu-item:focus-visible) {
  outline: 2px solid var(--chat-accent);
  outline-offset: -2px;
}
.dropdown-menu :deep(.menu-item:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}
.dropdown-menu :deep(.menu-divider) {
  height: 1px;
  margin: 5px 7px;
  background: var(--chat-border);
}
.dropdown-menu :deep(.menu-label) {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
}
.dropdown-menu :deep(.menu-empty) {
  padding: 10px;
  font-size: 13px;
  color: var(--chat-muted);
}
@media (max-width: 900px), (pointer: coarse) {
  summary {
    min-height: 44px;
  }
  .dropdown-menu :deep(.menu-item) {
    min-height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  summary {
    transition: none;
  }
}
</style>
