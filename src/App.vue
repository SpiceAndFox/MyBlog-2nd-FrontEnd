<script setup>
import { useRoute } from "vue-router";
import { computed } from "vue";
import Navigation from "@/components/Navigation.vue";

// 获取路由信息
const route = useRoute();

// 页面显示样式判断
const layoutClass = computed(() => {
  if (route.meta.layoutClass === "article") {
    return "layout--article";
  }
  return null;
});
</script>

<template>
  <div class="app-layout" :class="layoutClass">
    <Navigation :layoutClass="layoutClass"></Navigation>
    <router-view></router-view>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  background-image: url("@/assets/images/background-10.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.app-layout.layout--article {
  position: relative;
  background-image: none;
  background-color: #ffffff;
}
</style>
