import { onBeforeUnmount, onMounted } from "vue";

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.closest?.('input, textarea, select, [contenteditable="true"]'));
}

export function useChatComposerSlashFocus({ isSettingsOpen, isPresetsOpen, isTrashOpen, deleteDialog, focusComposer } = {}) {
  function onGlobalKeydown(event) {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (Boolean(isSettingsOpen?.value ?? isSettingsOpen)) return;
    if (Boolean(isPresetsOpen?.value ?? isPresetsOpen)) return;
    if (Boolean(isTrashOpen?.value ?? isTrashOpen)) return;
    if (Boolean(deleteDialog?.value?.open ?? deleteDialog?.open)) return;
    if (isEditableTarget(event.target)) return;
    if (event.code !== "Slash") return;

    event.preventDefault();
    if (typeof focusComposer === "function") focusComposer();
  }

  onMounted(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", onGlobalKeydown, true);
  });

  onBeforeUnmount(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("keydown", onGlobalKeydown, true);
  });
}
