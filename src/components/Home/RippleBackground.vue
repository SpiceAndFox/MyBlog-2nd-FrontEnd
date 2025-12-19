<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const props = defineProps({
  // 水波出现的间隔时间（毫秒）
  interval: {
    type: Number,
    default: 2000,
  },
  // 动画的持续时间（毫秒）
  animationDuration: {
    type: Number,
    default: 5000,
  },
  // 水波的颜色
  color: {
    type: String,
    default: "rgba(255, 255, 255, 0.7)",
  },
  // 水波的最终大小（直径，像素）
  size: {
    type: Number,
    default: 500,
  },
});

const ripples = ref([]);
let rippleCounter = 0;
let rippleInterval = null;

const createRipple = () => {
  const newRipple = {
    id: rippleCounter++,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
  };

  ripples.value.push(newRipple);

  // 使用animationDuration 来决定何时移除元素
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== newRipple.id);
  }, props.animationDuration);
};

onMounted(() => {
  rippleInterval = setInterval(createRipple, props.interval);
});

onBeforeUnmount(() => {
  clearInterval(rippleInterval);
});

// 将 Props 转换为 CSS 变量
const rippleStyle = computed(() => ({
  "--ripple-size": `${props.size}px`,
  "--ripple-color": props.color,
  "--ripple-duration": `${props.animationDuration}ms`,
}));
</script>

<template>
  <div class="ripple-background" :style="rippleStyle">
    <div
      v-for="ripple in ripples"
      :key="ripple.id"
      class="ripple-effect"
      :style="{ top: ripple.top, left: ripple.left }"
    ></div>
  </div>
</template>

<style scoped>
.ripple-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 防止遮挡内容 */
  overflow: hidden;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);

  width: var(--ripple-size);
  aspect-ratio: 1;
  border: 2px solid var(--ripple-color);
  animation: ripple-spread var(--ripple-duration) ease-out forwards;
}

@keyframes ripple-spread {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}
</style>
