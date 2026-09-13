import assert from "node:assert/strict";
import { test } from "node:test";
import { effectScope, ref } from "vue";
import { useChatSidebar } from "../src/views/chat/useChatSidebar.js";

function setup(t, mobile = false) {
  const scope = effectScope();
  const isMobile = ref(mobile);
  const sidebar = scope.run(() => useChatSidebar(isMobile));
  t.after(() => scope.stop());
  return { isMobile, ...sidebar };
}

test("desktop starts expanded and toggles without opening a drawer", (t) => {
  const sidebar = setup(t);
  assert.equal(sidebar.isSidebarCollapsed.value, false);
  sidebar.toggleSidebarCollapsed();
  assert.equal(sidebar.isSidebarCollapsed.value, true);
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
  sidebar.toggleSidebarCollapsed();
  assert.equal(sidebar.isSidebarCollapsed.value, false);
});

test("mobile actions cannot change the desktop preference", (t) => {
  const sidebar = setup(t, true);
  sidebar.openMobileSidebar();
  sidebar.toggleSidebarCollapsed();
  assert.equal(sidebar.isMobileSidebarOpen.value, true);
  assert.equal(sidebar.isSidebarCollapsed.value, false);
  sidebar.closeMobileSidebar();
  sidebar.closeMobileSidebar();
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
});

test("a desktop request cannot leave a hidden mobile drawer open", (t) => {
  const sidebar = setup(t);
  sidebar.openMobileSidebar();
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
});

test("crossing breakpoints closes the drawer and preserves the desktop rail", (t) => {
  const sidebar = setup(t);
  sidebar.toggleSidebarCollapsed();
  sidebar.isMobile.value = true;
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
  sidebar.openMobileSidebar();
  sidebar.isMobile.value = false;
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
  assert.equal(sidebar.isSidebarCollapsed.value, true);
  sidebar.isMobile.value = true;
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
});

test("rapid toggles settle on the latest intent without pending state changes", (t) => {
  const sidebar = setup(t);
  for (let index = 0; index < 21; index += 1) sidebar.toggleSidebarCollapsed();
  assert.equal(sidebar.isSidebarCollapsed.value, true);
  sidebar.toggleSidebarCollapsed();
  assert.equal(sidebar.isSidebarCollapsed.value, false);
});

test("breakpoint changes are handled even within the same render cycle", (t) => {
  const sidebar = setup(t, true);
  sidebar.openMobileSidebar();
  sidebar.isMobile.value = false;
  sidebar.isMobile.value = true;
  assert.equal(sidebar.isMobileSidebarOpen.value, false);
});
