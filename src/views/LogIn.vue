<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import GooeyAnimation from "@/components/GooeyAnimation.vue";
import { loginApi } from "@/api/auth";

// 初始化路由
const router = useRouter();

// 初始化变量
const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

// 点击登录按钮后的动作
const handleSubmit = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = "用户名和密码不能为空";
    return;
  }

  loading.value = true;
  errorMsg.value = "";

  try {
    const data = await loginApi({
      username: username.value,
      password: password.value,
    });
    // 保存 token（localStorage）
    localStorage.setItem("token", data.token);

    // 路由跳转
    router.push({ name: "AdminLayout" });
  } catch (err) {
    errorMsg.value = err.message || "登录失败";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="log-in-wrapper">
    <div class="log-in-stack">
      <GooeyAnimation />
      <div class="log-in-content">
        <h2>登 录</h2>
        <form class="input-field" @submit.prevent="handleSubmit">
          <!-- 输入框 -->
          <md-outlined-text-field
            label="用户名"
            type="text"
            name="username"
            id="username"
            v-model="username"
          ></md-outlined-text-field>
          <md-outlined-text-field
            label="密码"
            type="password"
            name="password"
            id="password"
            v-model="password"
          ></md-outlined-text-field>

          <!-- 按钮与错误信息区域 -->
          <div class="actions-wrapper">
            <div class="actions">
              <md-filled-button type="submit" :disabled="loading">
                {{ loading ? "登录中..." : "登录" }}
              </md-filled-button>
            </div>
            <transition name="fade">
              <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
            </transition>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.log-in-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  overflow: hidden;
}

.log-in-stack {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 90%;
  max-width: 400px;
  aspect-ratio: 1 / 1;
}

.log-in-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #333;
  gap: 2rem;
  z-index: 10;
}

.log-in-content h2 {
  font-size: 28px;
  margin: 0;
  transition: text-shadow 0.5s ease-in-out;
  cursor: default;
  text-align: center;
  letter-spacing: 2px;
}

.log-in-content h2:hover {
  text-shadow: 0px 0px 20px rgba(143, 143, 143, 0.711);
}

.input-field {
  width: 65%;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.inputs-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-field md-outlined-text-field {
  width: 100%;
  --md-outlined-text-field-container-shape: 26px;
  --md-outlined-text-field-outline-color: #c5c7ca;
  --md-outlined-text-field-focus-outline-color: #2563eb;
  --md-outlined-text-field-hover-outline-color: #919191;
  --md-outlined-text-field-container-height: 48px;
}

/* --- 按钮与错误信息区域 --- */
.actions-wrapper {
  position: relative; /* 为错误信息的 absolute 定位提供参考 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.actions {
  width: 100%;
}

.actions md-filled-button {
  width: 100%;
  --md-filled-button-container-height: 48px;
  --md-filled-button-container-shape: 24px;
  --md-filled-button-label-text-size: 16px;

  /* 颜色 */
  --md-filled-button-container-color: #978879;
  --md-filled-button-label-text-color: #ffffff;
  --md-filled-button-pressed-state-layer-color: rgba(255, 255, 255, 0.3);
  --md-filled-button-hover-state-layer-color: rgba(255, 255, 255, 0.1);
  transition: opacity 0.3s ease;
}

.actions md-filled-button[disabled] {
  opacity: 0.7;
}

/* 绝对定位解决抖动问题 */
.error-msg {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;

  color: #b3261e;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* --- 响应式适配 --- */
@media (max-width: 480px) {
  .log-in-content {
    gap: 1.5rem;
  }

  .log-in-content h2 {
    font-size: 24px;
  }
}

/* 2k屏、4k屏适配 */
@media (min-width: 1920px) and (max-width: 3000px) {
  .log-in-stack {
    max-width: 600px;
  }
  .log-in-content {
    gap: 3rem;
  }
  .log-in-content h2 {
    font-size: 40px;
  }
  .input-field {
    max-width: 400px;
    gap: 2rem;
  }
  .input-field md-outlined-text-field {
    --md-outlined-text-field-container-shape: 30px;
    --md-outlined-text-field-container-height: 56px;
  }
  .actions md-filled-button {
    --md-filled-button-container-height: 56px;
    --md-filled-button-container-shape: 28px;
    --md-filled-button-label-text-size: 20px;
  }
  .error-msg {
    font-size: 16px;
    margin-top: 12px;
  }
}

@media (min-width: 3000px) {
  .log-in-stack {
    max-width: 800px;
  }
  .log-in-content {
    gap: 4rem;
  }
  .log-in-content h2 {
    font-size: 52px;
  }
  .input-field {
    max-width: 500px;
    gap: 3rem;
  }
  .actions md-filled-button {
    --md-filled-button-container-height: 70px;
    --md-filled-button-container-shape: 35px;
    --md-filled-button-label-text-size: 26px;
  }
  .error-msg {
    font-size: 20px;
    margin-top: 16px;
  }
}
</style>
