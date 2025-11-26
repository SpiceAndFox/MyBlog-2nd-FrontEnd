<script setup>
import { useRoute } from "vue-router";
import { computed } from "vue";
import Navigation from "@/components/Navigation.vue";

// 获取路由信息
const route = useRoute();

// 页面显示样式判断
const layoutMap = {
  home: "layout--home",
  article: "layout--article",
  articleList: "layout--articleList",
  admin: "layout--admin",
};
const layoutClass = computed(() => layoutMap[route.meta.layoutClass] || null);
const isVideoBackground = computed(() => {
  if (layoutClass.value === "layout--home" || layoutClass.value === "layout--articleList") return true;
});
</script>

<template>
  <div class="app-layout" :class="layoutClass">
    <video v-if="isVideoBackground" class="background-video" autoplay muted loop playsinline>
      <source src="@/assets/videos/background-2.mp4" type="video/mp4" />
    </video>

    <Navigation :layoutClass="layoutClass"></Navigation>
    <router-view></router-view>
  </div>
</template>

<style>
.app-layout {
  --panel-bg: rgba(255, 255, 255, 0.75);
  --panel-border-color: rgba(229, 231, 235, 1);
  --primary-text-color: #1f2937;
  --secondary-text-color: #6b7280;
  --accent-color: #3b82f6;
  --accent-color-dark: #2563eb;
  --accent-text-color: #ffffff;
  --base-radius: 8px;
  --tag-bg: #f3f4f6;
  --tag-hover-bg: #e5e7eb;
}
</style>

<style scoped>
.app-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden; /* 避免视频溢出 */

  /* ios适配 */
  min-height: -webkit-fill-available; /* iOS Safari 动态视口 */
  padding-bottom: env(safe-area-inset-bottom);
  background: #000;
}

/* 背景视频层 */
.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;

  /* ios适配 */
  height: -webkit-fill-available; /* iOS Safari */
  display: block; /* 避免内联元素留缝 */

  object-fit: cover;
  z-index: -1;
}

.app-layout.layout--articleList::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgb(238, 238, 238) 0%, rgb(238, 238, 238) 70%, transparent 100%);
  opacity: 1;
  z-index: 0;
}

.app-layout.layout--admin {
  background-color: rgb(238, 238, 238);
  display: flex;
}

/* 新版 iOS 17+ */
@supports (height: 100dvh) {
  .app-layout {
    min-height: 100dvh;
  }
  .background-video {
    height: 100dvh;
  }
}
</style>
