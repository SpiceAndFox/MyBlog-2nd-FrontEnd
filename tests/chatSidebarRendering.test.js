import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import { createServer } from "vite";

let server;
let Sidebar;
let Header;

before(async () => {
  server = await createServer({
    mode: "test",
    logLevel: "error",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
  Sidebar = (
    await server.ssrLoadModule("/src/components/Chat/ChatSessionSidebar.vue")
  ).default;
  Header = (await server.ssrLoadModule("/src/components/Chat/ChatHeader.vue"))
    .default;
});

after(async () => {
  await server?.close();
});

async function renderSidebar(props = {}) {
  const app = createSSRApp(Sidebar, {
    sessions: [{ id: "yesterday", title: "2026-08-31" }],
    todayKey: "2026-09-01",
    activeSessionId: "yesterday",
    ...props,
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }],
  });
  app.use(router);
  await router.push("/chat");
  return renderToString(app);
}

function wrapperTag(html) {
  const tag = html.match(/<div[^>]*class="sidebar-wrapper[^>]*>/)?.[0];
  assert.ok(tag, "the sidebar wrapper must be rendered");
  return tag;
}

test("collapsed desktop renders a visible rail with accessible session and navigation controls", async () => {
  const html = await renderSidebar({ collapsed: true });
  const wrapper = wrapperTag(html);
  assert.match(wrapper, /compact/);
  assert.doesNotMatch(wrapper, /display:\s*none|\binert\b/);
  assert.match(html, /aria-label="展开会话侧栏"/);
  assert.match(html, /aria-label="昨天（2026-08-31）"/);
  assert.doesNotMatch(html, /回到今天/);
  assert.match(html, /<details[^>]*brand-dropdown[^>]*aria-hidden="true"/);
  assert.match(html, /<details[^>]*brand-dropdown[^>]*\binert\b/);
  assert.match(html, /aria-label="设置"/);
  assert.match(html, /class="session-thumbnail"[^>]*>\s*昨天\s*</);
});

test("closed mobile drawer is hidden and excluded from keyboard interaction", async () => {
  const wrapper = wrapperTag(await renderSidebar({ isMobile: true }));
  assert.match(wrapper, /display:\s*none/);
  assert.match(wrapper, /\binert\b/);
});

test("mobile drawer expands independently of the stored desktop preference", async () => {
  const html = await renderSidebar({
    isMobile: true,
    mobileOpen: true,
    collapsed: true,
  });
  assert.doesNotMatch(wrapperTag(html), /compact|display:\s*none|\binert\b/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="关闭会话侧栏"/);
  assert.match(html, /aria-label="SPICE-NEST 站点导航"/);
  assert.doesNotMatch(
    html,
    /<details[^>]*brand-dropdown[^>]*(?:\binert\b|aria-hidden="true")/,
  );
});

test("a modal can disable the sidebar in both desktop and mobile layouts", async () => {
  for (const props of [
    { collapsed: true },
    { isMobile: true, mobileOpen: true },
  ]) {
    assert.match(
      wrapperTag(await renderSidebar({ ...props, inert: true })),
      /\binert\b/,
    );
  }
});

test("only the mobile header renders a sidebar opener", async () => {
  const desktop = await renderToString(createSSRApp(Header));
  const mobile = await renderToString(createSSRApp(Header, { isMobile: true }));
  assert.doesNotMatch(desktop, /aria-label="展开会话侧栏"/);
  assert.match(mobile, /aria-label="展开会话侧栏"/);
});
