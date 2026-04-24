<script setup>
import { computed } from "vue";
import fallbackAvatarUrl from "@/assets/images/icons/avatar.webp";

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  selectedYear: {
    type: Number,
    default: null,
  },
  selectedMonth: {
    type: Number,
    default: -1,
  },
  totalDiaries: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update"]);
const currentYear = new Date().getFullYear();

const profileName = computed(() => props.user?.username || "我的日记");
const avatarUrl = computed(() => fallbackAvatarUrl); // props.user?.avatar_url || fallbackAvatarUrl

const yearOptions = computed(() => {
  const baseYears = Array.from({ length: 5 }, (_, index) => currentYear - index);
  if (props.selectedYear && !baseYears.includes(props.selectedYear)) {
    baseYears.push(props.selectedYear);
  }
  return baseYears.sort((a, b) => b - a);
});

function update(type, value) {
  emit("update", { type, value });
}

function resetFilters() {
  emit("update", { type: "reset" });
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
  <aside class="diary-sidebar">
    <section class="panel profile-card">
      <img class="profile-avatar" :src="avatarUrl" :alt="profileName" :style="{ viewTransitionName: 'user-avatar' }" />
      <div class="profile-name">{{ profileName }}</div>
      <p class="profile-desc">花店不开了，花还在开</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">日记</div>
          <div class="stat-value">{{ totalDiaries }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">筛选</div>
          <div class="stat-value">{{ selectedYear ? 1 : 0 }}</div>
        </div>
      </div>
    </section>

    <section class="panel date-panel">
      <div class="date-panel__header">
        <div class="side-title">日期范围</div>
        <button type="button" class="reset-btn" :disabled="!selectedYear && selectedMonth === -1" @click="resetFilters">
          重置
        </button>
      </div>

      <div class="year-picker">
        <button type="button" class="year-btn" aria-label="上一年" @click="stepYear(-1)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <select class="year-select" :value="selectedYear || ''" aria-label="选择年份" @change="changeYear">
          <option value="">全部年份</option>
          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
        </select>

        <button type="button" class="year-btn" aria-label="下一年" @click="stepYear(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div class="month-list">
        <button
          type="button"
          class="month-item month-item--all"
          :class="{ active: selectedMonth === -1 }"
          @click="update('month', -1)"
        >
          All
        </button>
        <button
          v-for="month in 12"
          :key="month"
          type="button"
          class="month-item"
          :class="{ active: selectedMonth === month }"
          @click="update('month', month)"
        >
          {{ month }}
        </button>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.diary-sidebar {
  min-width: 0;
}

.panel {
  background: var(--diary-list-panel);
  border: 1px solid var(--diary-list-panel-border);
  border-radius: 8px;
  box-shadow: var(--diary-list-shadow);
  backdrop-filter: blur(12px);
}

.diary-sidebar .panel + .panel {
  margin-top: 16px;
}

.profile-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  padding: 32px 24px 24px;
  text-align: center;
}

.profile-avatar {
  width: 136px;
  height: 136px;
  margin: 0 auto 18px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}

.profile-name {
  margin-bottom: 10px;
  font-size: 1.35rem;
  font-weight: 700;
}

.profile-desc {
  margin: 0 8px 20px;
  color: var(--diary-list-text-soft);
  font-size: 14px;
  line-height: 1.8;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding-top: 10px;
}

.stat {
  border-right: 1px solid rgba(17, 24, 39, 0.06);
}

.stat:last-child {
  border-right: 0;
}

.stat-label {
  color: var(--diary-list-text-faint);
  font-size: 12px;
}

.stat-value {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

.date-panel {
  padding: 18px 16px;
}

.date-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 8px 14px;
}

.side-title {
  font-size: 1rem;
  font-weight: 700;
}

.reset-btn {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  padding: 6px 10px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.reset-btn:hover:not(:disabled) {
  background: #e9efec;
  color: var(--diary-list-text);
}

.reset-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.year-picker {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  gap: 8px;
  padding: 0 8px 14px;
}

.year-btn,
.year-select {
  height: 32px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  color: #68717c;
}

.year-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.year-btn:hover,
.year-select:hover {
  color: var(--diary-list-text);
  border-color: rgba(110, 163, 126, 0.35);
}

.year-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.year-select {
  width: 100%;
  padding: 0 10px;
  outline: none;
}

.month-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 8px 6px;
}

.month-item {
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

.month-item--all {
  min-width: 52px;
}

.month-item:hover {
  color: var(--diary-list-text);
  background: #e9efec;
}

.month-item.active {
  color: #ffffff;
  background: #6ea37e;
}

@media (max-width: 980px) {
  .diary-sidebar {
    display: none;
  }
}
</style>
