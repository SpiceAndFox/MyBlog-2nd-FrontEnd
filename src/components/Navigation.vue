<script setup>
import myLogo from "@/assets/images/icons/logo.jpg";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router"; // 引入 useRoute

// 定义导航栏是否透明
defineProps({
  layoutClass: {
    type: String,
    default: null,
  },
});

// 博客名称
const blogName = "SPICE-NEST";
const blogNameChars = blogName.split("");

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
function linkToggled(link) {
  closeMenu();
  if (!document.startViewTransition) {
    router.push(link);
    return;
  }
  document.startViewTransition(() => {
    router.push(link);
  });
}

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
        :src="myLogo"
        alt="SpiceNest Logo"
        :style="{ viewTransitionName: 'user-avatar' }"
        v-show="layoutClass !== 'layout--home'"
      />
      <div class="blog-name-container">
        <span v-for="(char, index) in blogNameChars" :key="index" class="char">
          {{ char }}
        </span>
      </div>
    </a>

    <ul id="mobile-nav-links" class="navigation-links" :class="{ 'is-open': isMenuOpen }">
      <li>
        <a @click.prevent="linkToggled('/articles')" href="/articles">文章</a>
      </li>
      <li>
        <a @click.prevent="linkToggled('/chat')" href="/chat">Chat</a>
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
  height: 50px;
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
    rgba(238, 238, 238, 0.9) 20%,
    rgba(238, 238, 238, 0) 50%,
    rgba(238, 238, 238, 0) 100%
  );
}
.navigation.layout--articleList.isIOS {
  background: linear-gradient(
    to bottom,
    rgb(238, 238, 238) 0%,
    rgba(238, 238, 238, 0.9) 20%,
    rgba(238, 238, 238, 0) 50%,
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

.logo-container:hover .char {
  color: #c44569;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 30px;
  background: transparent;
  cursor: pointer;
  z-index: 1001;
  padding: 0;

  border: solid rgba(230, 230, 230, 0.87) 2px;
  padding: 5px;
  border-radius: 15px;
  transition: background-color 0.3s ease;
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
.navigation.layout--chat .navigation-links a {
  background-color: transparent;
  transition: transform 0.1s ease-in-out;
}
.navigation.layout--chat .navigation-links a:hover {
  transform: translateY(-1px);
  color: #c44569;
}

.menu-toggle:active {
  background-color: pink;
}

.hamburger,
.hamburger::before,
.hamburger::after {
  content: "";
  display: block;
  background-color: #eeeded;
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
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
  margin-right: 20px;
}

.navigation-links a {
  display: block;
  width: 60px;
  height: 30px;
  line-height: 30px;
  text-align: center;

  background-color: #ffffffb4;
  text-decoration: none;
  color: #535353;
  font-weight: 500;
  font-size: 16px;
  transition: color 0.3s, background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
  border-radius: 15px;
}

.navigation-links a:hover {
  background-color: #ffffffb4;
  color: #3b82f6;
  border-color: transparent;
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

    width: min(150px, calc(100vw - 30px));
    padding: 10px;
    border-radius: 16px;

    background-color: rgba(255, 255, 255, 0.582);
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
    width: 100%;
    height: 44px;
    line-height: 44px;

    border-radius: 12px;
    color: #111827;
    font-size: 16px;
    background-color: transparent;
    border-color: transparent;
  }

  .navigation-links a:hover {
    background-color: rgba(17, 24, 39, 0.06);
    color: #111827;
  }

  .navigation-links a:active {
    background-color: rgba(17, 24, 39, 0.1);
  }
}
</style>
