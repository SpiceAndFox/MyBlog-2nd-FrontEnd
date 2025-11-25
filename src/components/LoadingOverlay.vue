<template>
  <div v-if="show" class="loading-overlay">
    <img :src="gifSrc" alt="加载中" class="loading-gif" />
    <p>{{ text }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, required: true },
  text: { type: String, default: "正在加载..." },
  gifSrc: { type: String, default: "/loading-02.gif" },
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  padding: 12px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9998;
  backdrop-filter: blur(6px);
  animation: fade-slide-down 0.25s ease-out;
}
.loading-gif {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
@keyframes fade-slide-down {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
