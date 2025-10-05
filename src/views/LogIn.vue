<script setup>
import GooeyAnimation from "@/components/GooeyAnimation.vue";
</script>

<template>
  <section class="log-in-wrapper">
    <div class="log-in-stack">
      <GooeyAnimation />
      <div class="log-in-content">
        <h2>登 录</h2>
        <div class="input-field">
          <md-outlined-text-field label="用户名" type="text" name="userName" id="userName"></md-outlined-text-field>
          <md-outlined-text-field label="密码" type="password" name="password" id="password"></md-outlined-text-field>
        </div>
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
}

.log-in-content h2 {
  font-size: 28px;
  max-width: 140px;
  width: 100%;
  transition: text-shadow 0.5s ease-in-out;
  cursor: default;
  text-align: center;
}

.log-in-content h2:hover {
  text-shadow: 0px 0px 20px rgba(143, 143, 143, 0.711);
}

.input-field {
  width: 65%;
  max-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.input-field md-outlined-text-field {
  --md-outlined-text-field-container-shape: 26px;
  --md-outlined-text-field-outline-color: #c5c7ca;
  --md-outlined-text-field-focus-outline-color: #2563eb;
  --md-outlined-text-field-hover-outline-color: #919191;
}

@media (max-width: 480px) {
  .log-in-content h2 {
    font-size: 24px;
  }

  .log-in-content .input-field {
    gap: 10px;
    margin-bottom: 20px;
  }
}
</style>
