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
</script>

<template>
  <div class="app-layout" :class="layoutClass">
    <video v-if="layoutClass === 'layout--home'" class="background-video" autoplay muted loop playsinline>
      <source src="@/assets/videos/background-1.mp4" type="video/mp4" />
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

  background-image: url("@/assets/images/background-10.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;

  overflow: hidden; /* 避免视频溢出 */
}

/* 背景视频层 */
.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.app-layout.layout--home {
  background-image: none;
}

.app-layout.layout--article {
  position: relative;
  background-image: none;
  background-color: #ffffff;
}

.app-layout.layout--articleList {
  position: relative;
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
  background-image: none;
  background-color: rgb(238, 238, 238);
  display: flex;
}
</style>
