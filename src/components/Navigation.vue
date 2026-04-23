<script setup>
import myLogo from "@/assets/images/icons/logo.jpg";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router"; // 引入 useRoute

// 定义导航栏是否透明
const props = defineProps({
  layoutClass: {
    type: String,
    default: null,
  },
});

// 博客名称
const blogName = "SPICE-NEST";
const blogNameChars = blogName.split("");
const navLinks = [
  { label: "文章", link: "/articles" },
  { label: "Chat", link: "/chat" },
];
const NAV_LINK_WIDTH = 76;
const NAV_LINK_GAP = 4;

// 是否是在ios环境
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// 菜单按钮
const isMenuOpen = ref(false);
const navEl = ref(null);
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

// 路由跳转
const router = useRouter();
const route = useRoute();
function linkToggled(link) {
  closeMenu();
  if (route.path === link) return;
  if (!document.startViewTransition) {
    router.push(link);
    return;
  }
  document.startViewTransition(() => {
    router.push(link);
  });
}

function isNavLinkActive(link) {
  if (link === "/articles" && route.path.startsWith("/article/")) return true;
  return route.path === link || route.path.startsWith(`${link}/`);
}

const activeNavIndex = computed(() => navLinks.findIndex((item) => isNavLinkActive(item.link)));
const hasActiveNavLink = computed(() => activeNavIndex.value >= 0);
const activeNavOffset = computed(() => `${Math.max(activeNavIndex.value, 0) * (NAV_LINK_WIDTH + NAV_LINK_GAP)}px`);
const showNavLogo = computed(() => {
  return props.layoutClass !== "layout--home" && props.layoutClass !== "layout--referenceArticleList";
});
const navIndicatorStyle = computed(() => ({
  "--active-offset": activeNavOffset.value,
  "--nav-link-width": `${NAV_LINK_WIDTH}px`,
  "--nav-link-gap": `${NAV_LINK_GAP}px`,
}));

// 监听鼠标、键盘操作，用于关闭菜单
function onDocumentPointerDown(event) {
  if (!isMenuOpen.value) return;
  const target = event.target;
  if (!navEl.value || !(target instanceof Node)) return;
  if (!navEl.value.contains(target)) closeMenu();
}

function onDocumentKeyDown(event) {
  if (!isMenuOpen.value) return;
  if (event.key === "Escape") closeMenu();
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
  document.addEventListener("keydown", onDocumentKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
  document.removeEventListener("keydown", onDocumentKeyDown);
});
</script>

<template>
  <nav ref="navEl" class="navigation" :class="[layoutClass, isIOS ? 'isIOS' : '']">
    <a @click.prevent="linkToggled('/')" href="/" class="logo-container">
      <img
        v-if="showNavLogo"
        :src="myLogo"
        alt="SpiceNest Logo"
        :style="{ viewTransitionName: 'user-avatar' }"
      />
      <div class="blog-name-container">
        <span v-for="(char, index) in blogNameChars" :key="index" class="char">
          {{ char }}
        </span>
      </div>
    </a>

    <ul
      id="mobile-nav-links"
      class="navigation-links"
      :class="{
        'is-open': isMenuOpen,
        'has-active': hasActiveNavLink,
      }"
      :style="navIndicatorStyle"
    >
      <li v-for="item in navLinks" :key="item.link">
        <a
          @click.prevent="linkToggled(item.link)"
          :href="item.link"
          :class="{ 'is-active': isNavLinkActive(item.link) }"
        >
          {{ item.label }}
        </a>
      </li>
    </ul>

    <button
      class="menu-toggle"
      @click="toggleMenu"
      aria-label="Toggle navigation"
      aria-controls="mobile-nav-links"
      :aria-expanded="isMenuOpen"
    >
      <span class="hamburger"></span>
    </button>
  </nav>
</template>

<style scoped>
@font-face {
  font-family: "Aurora";
  src: url("@/assets/fonts/Aurora.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

.navigation {
  box-sizing: border-box;
  height: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 5px 20px;
  transition: background-color 0.3s ease;

  /* 应对ArticleListSection中使用backdrop-filter导致的层叠上下文被覆盖 */
  position: relative;
  z-index: 1001;
}

.navigation.layout--home.isIOS {
  background: linear-gradient(
    to bottom,
    rgb(238, 238, 238) 0%,
    rgb(238, 238, 238) 5%,
    rgba(238, 238, 238, 0) 70%,
    rgba(238, 238, 238, 0) 100%
  );
}
.navigation.layout--articleList.isIOS {
  background: linear-gradient(
    to bottom,
    rgb(238, 238, 238) 0%,
    rgb(238, 238, 238) 5%,
    rgba(238, 238, 238, 0) 70%,
    rgba(238, 238, 238, 0) 100%
  );
}
.navigation.layout--article {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1001;
}

.logo-container {
  height: 85%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-container img {
  height: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 50%;
  transition: box-shadow 0.4s;
}

.logo-container:hover img {
  box-shadow: 0 0 10px 1px #e294aad3;
}

.blog-name-container {
  display: flex;
  margin-top: 5px;
}

.logo-container .char {
  display: inline-block;
  color: #252525;
  font-size: 1.2rem;
  font-weight: bold;
  font-family: "Aurora", serif;
  transition: color 1s;
}

/* ios特化 */
.navigation.layout--home.isIOS .logo-container .char {
  color: #ffffff;
}
.navigation.layout--articleList.isIOS .logo-container .char {
  color: #ffffff;
}

.logo-container:hover .char {
  color: #c44569;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 30px;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  z-index: 1001;

  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 5px;
  border-radius: 15px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  transition: background-color 0.3s ease, transform 0.18s ease, border-color 0.18s ease;
}

/* admin页的特化 */
.navigation.layout--admin .menu-toggle {
  border-color: rgb(176, 176, 176);
}

.navigation.layout--admin .menu-toggle:hover {
  background-color: rgb(223, 223, 223);
}

.navigation.layout--admin .menu-toggle:active {
  background-color: rgb(172, 172, 172);
}

.navigation.layout--admin .hamburger,
.navigation.layout--admin .hamburger::before,
.navigation.layout--admin .hamburger::after {
  background-color: rgba(137, 137, 137, 0.87);
  height: 3px;
}

/* chat页特化 */
.navigation.layout--chat {
  background-color: rgb(249, 250, 251);
}
.navigation.layout--chat .navigation-links {
  background: rgba(255, 255, 255, 0.78);
}

.navigation.layout--referenceArticleList {
  background: transparent;
}

.navigation.layout--referenceArticleList .navigation-links,
.navigation.layout--referenceArticleList .menu-toggle {
  background: rgba(255, 255, 255, 0.64);
  border-color: rgba(15, 23, 42, 0.07);
}

.navigation.layout--referenceArticleList .navigation-links::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(238, 245, 240, 0.88));
  border-color: rgba(110, 163, 126, 0.16);
}

.navigation.layout--referenceArticleList .navigation-links a.is-active,
.navigation.layout--referenceArticleList .navigation-links a:hover {
  color: #5c7e69;
}

.menu-toggle:hover {
  border-color: rgba(15, 23, 42, 0.18);
  background-color: rgba(255, 255, 255, 0.92);
}

.menu-toggle:active {
  transform: translateY(1px);
}

.hamburger,
.hamburger::before,
.hamburger::after {
  content: "";
  display: block;
  background-color: #475569;
  height: 3px;
  width: 15px;
  border-radius: 3px;
  transition: all 0.3s ease-in-out;
}

.hamburger::before {
  transform: translateY(-6px);
}

.hamburger::after {
  transform: translateY(3px); /* (6px - 3px) */
}

.is-open + .menu-toggle .hamburger {
  background-color: transparent;
}

.is-open + .menu-toggle .hamburger::before {
  transform: rotate(45deg);
}

.is-open + .menu-toggle .hamburger::after {
  transform: translateY(-3px) rotate(-45deg);
}

.navigation-links {
  --nav-link-width: 76px;
  --nav-link-height: 36px;
  --nav-link-gap: 4px;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: var(--nav-link-gap);
  list-style: none;
  padding: 4px;
  margin: 0 18px 0 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.navigation-links::before {
  content: "";
  position: absolute;
  top: 4px;
  left: 4px;
  width: var(--nav-link-width);
  height: var(--nav-link-height);
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.72));
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
  opacity: 0;
  transform: translateX(var(--active-offset, 0px));
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.18s ease;
  pointer-events: none;
}

.navigation-links.has-active::before {
  opacity: 1;
}

.navigation-links a {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 var(--nav-link-width);
  height: var(--nav-link-height);
  padding: 0;
  line-height: 1;
  text-align: center;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  text-decoration: none;
  color: #64748b;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0;
  white-space: nowrap;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease,
    transform 0.16s ease;
}

.navigation-links a:hover {
  color: #1f2937;
  transform: translateY(-1px);
}

.navigation-links a.is-active {
  border-color: transparent;
  background: transparent;
  color: #1f2937;
  box-shadow: none;
}

.navigation-links a:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.38);
  outline-offset: 3px;
}

.navigation-links li {
  display: flex;
}

@media (max-width: 768px) {
  .navigation {
    padding: 5px 15px; /* 调整边距 */
  }

  /* 显示汉堡按钮 */
  .menu-toggle {
    display: flex;
    flex-direction: column;

    justify-content: center;
    align-items: center;
  }

  /* 隐藏桌面端的链接排布方式 */
  .navigation-links {
    /* 变为一个右上角的下拉菜单 */
    position: absolute;
    top: calc(100% + 10px);
    right: 10px;
    margin: 0;

    width: auto;
    min-width: 112px;
    max-width: calc(100vw - 30px);
    padding: 8px;
    border-radius: 16px;

    background-color: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(17, 24, 39, 0.08);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);

    transform-origin: top right;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-6px) scale(0.98);
    transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;

    /* 内部链接垂直排列 */
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 6px;

    z-index: 1002;
  }

  .navigation-links::before {
    display: none;
  }

  /* 当菜单打开时，滑入视口 */
  .navigation-links.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  .navigation-links li {
    width: 100%;
  }

  /* 移动端菜单里的链接样式 */
  .navigation-links a {
    width: 96px;
    min-width: 0;
    flex: 0 0 auto;
    height: 42px;
    line-height: 1;
    justify-content: flex-start;
    padding: 0 14px;

    border-radius: 12px;
    color: #334155;
    font-size: 15px;
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .navigation-links a:hover {
    background: rgba(15, 23, 42, 0.06);
    color: #111827;
    transform: none;
  }

  .navigation-links a.is-active {
    border-color: rgba(15, 23, 42, 0.06);
    background: rgba(255, 255, 255, 0.86);
    color: #111827;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }

  .navigation-links a:active {
    background-color: rgba(17, 24, 39, 0.1);
  }
}
</style>
