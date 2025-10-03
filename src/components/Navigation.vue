<script setup>
import myLogo from "@/assets/logo.jpg";
import { ref, onMounted } from "vue";

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

// 菜单按钮
const isMenuOpen = ref(false);
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}
</script>

<template>
  <nav class="navigation" :class="layoutClass">
    <router-link to="/" class="logo-container">
      <img :src="myLogo" alt="SpiceNest Logo" />
      <div class="blog-name-container">
        <span v-for="(char, index) in blogNameChars" :key="index" class="char">
          {{ char }}
        </span>
      </div>
    </router-link>

    <ul class="navigation-links" :class="{ 'is-open': isMenuOpen }">
      <li>
        <router-link to="/articles" @click="isMenuOpen = false">文章</router-link>
      </li>
    </ul>

    <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle navigation">
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

.navigation.layout--article {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1001;
}

.navigation.layout--articleList {
  background-color: rgb(238, 238, 238, 0);
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
  gap: 30px;
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
    /* 变为一个从顶部滑下的全屏菜单 */
    position: fixed;
    margin: 0;
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    background-color: transparent;

    /* 默认隐藏在视口之外 */
    clip-path: inset(0 0 100% 0);
    transition: clip-path 0.4s ease-in-out, background-color 0.4s ease-in-out;

    /* 内部链接垂直排列并居中 */
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding-top: 50px; /* 留出导航栏高度 */

    z-index: 1000;
  }

  /* 当菜单打开时，滑入视口 */
  .navigation-links.is-open {
    clip-path: inset(0 0 0% 0);
    background-color: rgba(20, 20, 20, 0.95);
  }

  .navigation-links li {
    width: 100%;
  }

  /* 移动端菜单里的链接样式 */
  .navigation-links a {
    width: 100%;
    height: 60px;
    line-height: 60px;

    border-radius: 0;
    color: #eeeded;
    font-size: 2rem;
    background-color: transparent;
    border-color: transparent;
  }
}
</style>
