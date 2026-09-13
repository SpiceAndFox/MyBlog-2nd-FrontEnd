import { readonly, ref, watch } from "vue";

// Desktop keeps its own preference; a mobile drawer always starts closed.
export function useChatSidebar(isMobile) {
  const isSidebarCollapsed = ref(false);
  const isMobileSidebarOpen = ref(false);

  function openMobileSidebar() {
    if (isMobile.value) isMobileSidebarOpen.value = true;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false;
  }

  function toggleSidebarCollapsed() {
    if (!isMobile.value) {
      isSidebarCollapsed.value = !isSidebarCollapsed.value;
    }
  }

  watch(isMobile, closeMobileSidebar, { flush: "sync" });

  return {
    isSidebarCollapsed: readonly(isSidebarCollapsed),
    isMobileSidebarOpen: readonly(isMobileSidebarOpen),
    openMobileSidebar,
    closeMobileSidebar,
    toggleSidebarCollapsed,
  };
}
