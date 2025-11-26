<script setup>
import avatar from "@/assets/images/icons/avatar.jpg";
</script>

<template>
  <div class="user-info__base">
    <img class="user-info__avatar" :src="avatar" :style="{ viewTransitionName: 'user-avatar' }" />
    <h2 class="user-info__name">香辛料</h2>
  </div>
</template>

<style scoped>
.user-info__base {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.user-info__avatar {
  width: 150px;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 50%;

  transition: box-shadow 0.4s, transform 0.3s ease-out;
}

.user-info__avatar:hover {
  box-shadow: 0 0 20px rgba(163, 163, 163, 0.7);
}

.user-info__name {
  width: 120px;
  margin: 0;
  margin-left: 30px;
  margin-right: 10px;
  text-align: center;

  font-size: 40px;
  color: rgba(56, 56, 56, 0.692);
  transition: color 0.3s ease;
}

.user-info__name:hover {
  color: rgb(255, 255, 255);
}

@media (max-width: 1200px) {
  .user-info__base {
    flex-direction: column;
    gap: 15px;
  }

  .user-info__avatar {
    width: 120px;
  }
  .user-info__name {
    margin-left: 0;
    font-size: 32px;
  }
}
</style>
