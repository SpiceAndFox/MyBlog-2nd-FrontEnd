<script setup>
import { onMounted, ref, onBeforeUnmount } from "vue";

// 雪花数量，移动端建议不要太多，30-50片足矣
const FLAKE_COUNT = 40;
const flakes = ref([]);

// 生成随机区间数值
const randomRange = (min, max) => Math.random() * (max - min) + min;

// 确定容器高度
const containerHeight = ref("100vh");
const updateHeight = () => {
  containerHeight.value = document.body.scrollHeight + "px";
};

onMounted(() => {
  // 初始化生成雪花数据
  flakes.value = Array.from({ length: FLAKE_COUNT }).map(() => ({
    // 水平位置 0% - 100%
    left: randomRange(0, 100) + "%",
    // 动画时长 5s - 12s (制造远近层次感，慢的在远，快的在近)
    duration: randomRange(5, 12) + "s",
    // 动画延迟，避免同时落下
    delay: randomRange(0, 5) + "s",
    size: randomRange(4, 8) + "px",
    opacity: randomRange(0.4, 0.9),
  }));

  updateHeight();
  window.addEventListener("resize", updateHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateHeight);
});
</script>

<template>
  <div class="snow-container" aria-hidden="true" :style="{ height: containerHeight }">
    <span
      v-for="(flake, index) in flakes"
      :key="index"
      class="snowflake"
      :style="{
        left: flake.left,
        width: flake.size,
        height: flake.size,
        opacity: flake.opacity,
        animationDuration: flake.duration,
        animationDelay: flake.delay,
      }"
    ></span>
  </div>
</template>

<style scoped>
.snow-container {
  position: absolute; /* 使用 fixed 覆盖整个视口，模拟雪花在屏幕前飘落 */
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none; /* 关键：透传点击事件，不阻挡下方交互 */
  z-index: 999; /* 位于背景之上，但在导航栏之下（或者之上，看你想不想遮住字） */
  overflow: hidden;
}

.snowflake {
  position: absolute;
  top: -10px; /* 起始位置在屏幕外 */
  background-color: #fff;
  border-radius: 50%;
  filter: blur(1px); /* 轻微模糊增加柔和感 */
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform; /* 性能优化 */
}

@keyframes fall {
  0% {
    transform: translateY(-10vh) translateX(0);
  }
  25% {
    transform: translateY(25vh) translateX(15px); /* 模拟飘动 */
  }
  50% {
    transform: translateY(50vh) translateX(-15px);
  }
  75% {
    transform: translateY(75vh) translateX(15px);
  }
  100% {
    transform: translateY(110vh) translateX(0); /* 落下直到超出屏幕下方 */
  }
}
</style>
