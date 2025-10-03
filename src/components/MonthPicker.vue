<script setup>
import { ref, watch, computed } from "vue";
import CustomSelect from "./CustomSelect.vue";

defineProps({
  selectedTopTag: {
    type: String,
  },
  selectedSubTag: {
    type: String,
  },
});

const years = ref([2025, 2024, 2023, 2022]); // 模拟数据
const selectedYearModel = defineModel("selectedYear", { type: Number });
const selectedMonthModel = defineModel("selectedMonth", { type: Number });

// 月份设置
function monthLinkToggled(month) {
  selectedMonthModel.value = month;
}

// 监听年份变化
watch(selectedYearModel, () => {
  selectedMonthModel.value = -1;
});

// 设置每个月份对应的链接
const generateMonthLink = (month) => {
  return computed(() => {
    const params = new URLSearchParams();
    if (props.selectedTopTag) {
      params.append("topTag", props.selectedTopTag);
    }
    if (props.selectedSubTag) {
      params.append("subTag", props.selectedSubTag);
    }
    if (selectedYearModel.value) {
      params.append("year", selectedYearModel.value);
    }
    if (month !== -1) {
      params.append("month", month);
    }
    const queryString = params.toString();
    return queryString ? `/articles?${queryString}` : "/articles";
  }).value;
};
</script>

<template>
  <section class="month-picker">
    <div class="month-picker-header">
      <h3>日期范围</h3>
      <div class="year-picker">
        <button aria-label="上一年" class="year-picker__btn" @click="selectedYearModel = selectedYearModel - 1">
          &lt;
        </button>
        <CustomSelect v-model="selectedYearModel" :options="years" placeholder="20xx"></CustomSelect>
        <button aria-label="下一年" class="year-picker__btn" @click="selectedYearModel = selectedYearModel + 1">
          &gt;
        </button>
      </div>
    </div>
    <div class="month-picker-content">
      <a
        class="month-picker__all"
        href="generateMonthLink(-1)"
        @click.prevent="monthLinkToggled(-1)"
        :class="{ 'is-active': selectedMonthModel === -1 }"
        >All</a
      >
      <a
        v-for="month in 12"
        :key="month"
        href="generateMonthLink(month)"
        @click.prevent="monthLinkToggled(month)"
        :class="{ 'is-active': selectedMonthModel === month }"
        >{{ month }}</a
      >
    </div>
  </section>
</template>

<style scoped>
/* 头部样式 */
.month-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.month-picker-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-text-color);
}

/* 月份样式 */
.month-picker-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.month-picker-content a {
  text-decoration: none;
  background-color: var(--tag-bg);
  color: var(--secondary-text-color);
  padding: 5px 5px;
  height: 20px;
  width: 20px;
  border-radius: 20px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 0.85rem;
  text-align: center;
}

.month-picker-content a:hover {
  background-color: var(--tag-hover-bg);
  color: var(--primary-text-color);
}

.month-picker-content a.is-active {
  background-color: var(--accent-color);
  color: var(--accent-text-color);
  text-shadow: 0 0 1px currentColor;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* --- 年份选择器 --- */
.year-picker {
  display: flex;
  align-items: center;
  gap: 6px;
}

.year-picker__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background-color: var(--tag-bg);
  color: var(--secondary-text-color);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.year-picker__btn:hover {
  background-color: var(--tag-hover-bg);
  color: var(--primary-text-color);
}
</style>
