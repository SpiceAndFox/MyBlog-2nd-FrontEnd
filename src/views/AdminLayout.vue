<script setup>
import { useRoute } from "vue-router";
import AdminDockBar from "@/components/Admin/AdminDockBar.vue";
</script>

<template>
  <AdminDockBar></AdminDockBar>
  <router-view></router-view>
</template>
