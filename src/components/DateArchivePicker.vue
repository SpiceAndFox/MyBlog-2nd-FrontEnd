<script setup>
import { computed } from "vue";

const props = defineProps({
  selectedYear: {
    type: Number,
    default: null,
  },
  selectedMonth: {
    type: Number,
    default: -1,
  },
  yearsToShow: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits(["update"]);
const currentYear = new Date().getFullYear();

const yearOptions = computed(() => {
  const baseYears = Array.from({ length: props.yearsToShow }, (_, index) => currentYear - index);
  if (props.selectedYear && !baseYears.includes(props.selectedYear)) {
    baseYears.push(props.selectedYear);
  }
  return baseYears.sort((a, b) => b - a);
});

function update(type, value) {
  emit("update", { type, value });
}

function changeYear(event) {
  const value = event.target.value ? Number(event.target.value) : null;
  update("year", value);
}

function stepYear(step) {
  update("year", (props.selectedYear || currentYear) + step);
}
</script>

<template>
  <div class="date-archive-picker">
    <div class="date-archive-picker__year">
      <button type="button" class="date-archive-picker__year-btn" aria-label="上一年" @click="stepYear(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <select
        class="date-archive-picker__year-select"
        :value="selectedYear || ''"
        aria-label="选择年份"
        @change="changeYear"
      >
        <option value="">全部年份</option>
        <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
      </select>

      <button type="button" class="date-archive-picker__year-btn" aria-label="下一年" @click="stepYear(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <div class="date-archive-picker__months">
      <button
        type="button"
        class="date-archive-picker__month date-archive-picker__month--all"
        :class="{ active: selectedMonth === -1 }"
        @click="update('month', -1)"
      >
        All
      </button>
      <button
        v-for="month in 12"
        :key="month"
        type="button"
        class="date-archive-picker__month"
        :class="{ active: selectedMonth === month }"
        @click="update('month', month)"
      >
        {{ month }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-archive-picker {
  --date-archive-picker-text: var(--archive-picker-text, #1f2937);
  --date-archive-picker-control: var(--archive-picker-control, #68717c);
  --date-archive-picker-hover-bg: var(--archive-picker-hover-bg, #e9efec);
  --date-archive-picker-active-bg: var(--archive-picker-active-bg, #6ea37e);
}

.date-archive-picker__year {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  gap: 8px;
  padding: 0 8px 14px;
}

.date-archive-picker__year-btn,
.date-archive-picker__year-select {
  height: 32px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--date-archive-picker-control);
}

.date-archive-picker__year-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.date-archive-picker__year-btn:hover,
.date-archive-picker__year-select:hover {
  color: var(--date-archive-picker-text);
  border-color: rgba(110, 163, 126, 0.35);
}

.date-archive-picker__year-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.date-archive-picker__year-select {
  width: 100%;
  padding: 0 10px;
  outline: none;
}

.date-archive-picker__months {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 8px 6px;
}

.date-archive-picker__month {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(17, 24, 39, 0.04);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(245, 247, 249, 0.95);
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s ease;
}

.date-archive-picker__month--all {
  min-width: 52px;
}

.date-archive-picker__month:hover {
  color: var(--date-archive-picker-text);
  background: var(--date-archive-picker-hover-bg);
}

.date-archive-picker__month.active {
  color: #ffffff;
  background: var(--date-archive-picker-active-bg);
}
</style>
