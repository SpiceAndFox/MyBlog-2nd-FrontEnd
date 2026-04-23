<script setup>
defineProps({
  pagination: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["change"]);
</script>

<template>
  <nav class="pagination" aria-label="文章分页">
    <button class="page-btn" :disabled="pagination.page === 1" @click="emit('change', pagination.page - 1)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      上一页
    </button>

    <span class="page-info">
      第 {{ pagination.page }} / {{ pagination.totalPages }} 页
      <span v-if="pagination.total">（共 {{ pagination.total }} 篇）</span>
    </span>

    <button
      class="page-btn"
      :disabled="pagination.page === pagination.totalPages"
      @click="emit('change', pagination.page + 1)"
    >
      下一页
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 16px 20px;
}

.page-btn {
  min-width: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.page-btn:hover:not(:disabled) {
  border-color: #6ea37e;
  color: #5c7e69;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info {
  font-size: 0.95rem;
  color: #6b7280;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .pagination {
    align-items: stretch;
    flex-direction: column;
  }

  .page-btn,
  .page-info {
    width: 100%;
    text-align: center;
  }
}
</style>
