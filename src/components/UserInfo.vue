<script setup>
import UserInfoDescription from "./UserInfoDescription.vue";
import UserInfoContactLinks from "./UserInfoContactLinks.vue";
import UserInfoBase from "./UserInfoBase.vue";
</script>

<template>
  <section class="user-info">
    <UserInfoBase></UserInfoBase>
    <UserInfoDescription></UserInfoDescription>
    <UserInfoContactLinks></UserInfoContactLinks>
  </section>
</template>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;

  margin-right: 50px;
  margin-bottom: 50px;
}

@media (max-width: 1200px) {
  .user-info {
    margin-right: 0;
    margin-bottom: 30px;
    align-items: center;
  }
}
</style>
