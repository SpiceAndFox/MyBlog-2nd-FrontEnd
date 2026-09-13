<script setup>
import { computed, ref, watch } from "vue";
const props = defineProps({
  src: { type: String, default: "" },
  name: { type: String, default: "" },
});
const failed = ref(false);
watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);
const initial = computed(
  () => props.name.trim().slice(0, 1).toUpperCase() || "伴",
);
</script>

<template>
  <span class="chat-avatar" aria-hidden="true">
    <img v-if="src && !failed" :src="src" alt="" @error="failed = true" />
    <span v-else>{{ initial }}</span>
  </span>
</template>

<style scoped>
.chat-avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  overflow: hidden;
  background: var(--chat-avatar-bg);
  color: var(--chat-avatar-text);
  font-size: 13px;
  font-weight: 500;
}
img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
</style>
