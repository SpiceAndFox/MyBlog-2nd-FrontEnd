<script setup>
import { ref, onMounted } from "vue";

// 融球动画
const containerRef = ref(null);
const balls = ref([]);

// 定义容器的尺寸，用于计算小球的初始位置
let containerSize = 400;
let containerRadius = containerSize / 2;

// 创建小球
const createBall = () => {
  const angle = Math.random() * Math.PI * 2;
  const size = Math.random() * 20 + 10;
  const speed = Math.random() * 2 + 0.5;

  // 计算小球的初始位置 (在圆形的边缘)
  const x = containerRadius + (containerRadius - size / 2) * Math.cos(angle);
  const y = containerRadius + (containerRadius - size / 2) * Math.sin(angle);

  // 计算小球的移动速度
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  // 将新创建的小球对象添加到数组中
  balls.value.push({
    id: Date.now() + Math.random(),
    size,
    x,
    y,
    vx,
    vy,
  });
};

// 动画循环函数
const animate = () => {
  // 更新每个小球的位置
  balls.value.forEach((ball) => {
    ball.x += ball.vx;
    ball.y += ball.vy;
  });

  // 过滤掉已经跑出屏幕外的小球，防止无限增多导致性能问题
  const distance = 100;
  const wrapperBounds = {
    left: -distance,
    top: -distance,
    right: containerSize + distance,
    bottom: containerSize + distance,
  };
  balls.value = balls.value.filter(
    (ball) =>
      ball.x > wrapperBounds.left &&
      ball.x < wrapperBounds.right &&
      ball.y > wrapperBounds.top &&
      ball.y < wrapperBounds.bottom
  );

  // 请求下一帧动画
  requestAnimationFrame(animate);
};

// 当组件挂载后执行
onMounted(() => {
  // 移动端适配
  if (containerRef.value) {
    containerSize = containerRef.value.clientWidth;
    containerRadius = containerSize / 2;
  }

  setInterval(createBall, 150);
  animate();
});
</script>

<template>
  <div class="gooey-container" ref="containerRef">
    <div class="main-shape"></div>

    <div
      v-for="ball in balls"
      :key="ball.id"
      class="ball"
      :style="{
        width: `${ball.size}px`,
        height: `${ball.size}px`,
        left: `${ball.x - ball.size / 2}px`,
        top: `${ball.y - ball.size / 2}px`,
      }"
    ></div>
  </div>
</template>

<style scoped>
.gooey-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: blur(15px) contrast(30);
}

.main-shape {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgb(255, 255, 255);
}

.ball {
  position: absolute;
  border-radius: 50%;
  background-color: rgb(255, 255, 255);
}

@media (max-width: 480px) {
  .gooey-container {
    filter: blur(15px) contrast(25);
  }
}
</style>
