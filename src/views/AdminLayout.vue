<script setup>
import { useRoute } from "vue-router";
import AdminSidebar from "@/components/AdminSidebar.vue";
</script>

<template>
  <AdminSidebar></AdminSidebar>
  <router-view></router-view>
</template>
