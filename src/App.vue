<script setup>
import { useRoute } from "vue-router";
import { watch, computed, onBeforeUnmount } from "vue";
import Navigation from "@/components/Navigation.vue";
import iosBg from "@/assets/images/background-mobile-03.webp";
import SnowEffect from "@/components/SnowEffect.vue";

// 获取路由信息
const route = useRoute();

// 页面显示样式判断
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const layoutMap = {
  home: "layout--home",
  article: "layout--article",
  articleList: "layout--articleList",
  referenceArticleList: "layout--referenceArticleList",
  admin: "layout--admin",
  chat: "layout--chat",
};
const layoutClass = computed(() => layoutMap[route.meta.layoutClass] || null);
const isHome = computed(() => {
  return layoutClass.value === "layout--home";
});
const isArticleList = computed(() => {
  return layoutClass.value === "layout--articleList";
});
const isHomeOrArticleList = computed(() => {
  return layoutClass.value === "layout--home" || layoutClass.value === "layout--articleList";
});
const showVideo = computed(() => {
  return isHomeOrArticleList.value && !isIOS;
});
const showNavigation = computed(() => !route.meta.hideNavigation);

// 计算是否应该显示下雪效果：是IOS 且 (在首页 或 文章列表页)
const showSnow = computed(() => isIOS && isHomeOrArticleList.value);

// ios背景设置
const IOS_ARTICLELIST_BG_COLOR = "rgb(238, 238, 238)";
const applyIOSRootBg = (enable) => {
  if (!enable) return;
  const html = document.documentElement;
  const body = document.body;

  if (!html || !body) return;

  if (isHome.value) {
    html.style.backgroundColor = IOS_ARTICLELIST_BG_COLOR;
    body.style.backgroundColor = IOS_ARTICLELIST_BG_COLOR;
  } else if (isArticleList.value) {
    html.style.backgroundColor = IOS_ARTICLELIST_BG_COLOR;
    body.style.backgroundColor = IOS_ARTICLELIST_BG_COLOR;
  } else {
    html.style.backgroundColor = "";
    body.style.backgroundColor = "";
  }
};
const clearIOSRootBg = () => {
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) return;
  html.style.backgroundColor = "";
  body.style.backgroundColor = "";
};

watch(
  () => route.fullPath,
  () => {
    clearIOSRootBg();
    applyIOSRootBg(isIOS && isHomeOrArticleList.value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearIOSRootBg();
});

const showIOSArticleListBg = computed(() => isIOS && isArticleList.value);
const iosArticleListBgStyle = computed(() => {
  return showIOSArticleListBg.value
    ? {
        backgroundImage: `url(${iosBg})`,
      }
    : {};
});

const iosBackgroundStyle = computed(() => {
  if (!isIOS) return {};
  if (!isHome.value) return {};
  return {
    backgroundImage: `url(${iosBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
});
</script>

<template>
  <div class="app-layout" :class="[layoutClass, isIOS ? 'isIOS' : '']" :style="iosBackgroundStyle">
    <div v-if="showIOSArticleListBg" class="ios-articlelist-background" :style="iosArticleListBgStyle"></div>
    <video v-if="showVideo" class="background-video" autoplay muted loop playsinline>
      <source src="@/assets/videos/background-2.mp4" type="video/mp4" />
    </video>
    <div v-if="showVideo" class="video-overlay" :class="[layoutClass]"></div>

    <SnowEffect v-if="showSnow" />
    <Navigation v-if="showNavigation" :layoutClass="layoutClass"></Navigation>
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
  z-index: 0;
  overflow: hidden; /*避免视频溢出 */
}

/* 背景视频层 */
.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  object-fit: cover;
  z-index: -1;
}

.video-overlay.layout--articleList {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: -1; /* 注意：要在内容后，但在视频前 */
}

.video-overlay.layout--articleList::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgb(238, 238, 238) 0%,
    rgb(238, 238, 238, 0.9) 50%,
    rgb(238, 238, 238, 0.3) 70%,
    transparent 80%
  );
}

.app-layout.layout--articleList.isIOS {
  background-color: rgb(238, 238, 238);
}

.ios-articlelist-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 800px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: -1;
}

.ios-articlelist-background::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgb(238, 238, 238) 0%, rgb(238, 238, 238) 30%, transparent 70%);
  opacity: 1;
  z-index: 0;
}

.app-layout.layout--admin {
  background-color: rgb(238, 238, 238);
  display: flex;
}

.app-layout.layout--chat {
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

.app-layout.layout--referenceArticleList {
  background: linear-gradient(180deg, #f6f7f8 0%, #eef2f1 100%);
  overflow: auto;
}
</style>
