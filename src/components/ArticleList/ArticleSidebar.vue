<script setup>
import { computed } from "vue";
import avatarUrl from "@/assets/images/icons/avatar.webp";

const props = defineProps({
  tags: {
    type: Object,
    required: true,
  },
  selectedTopTag: {
    type: String,
    default: "",
  },
  selectedSubTag: {
    type: String,
    default: "",
  },
  selectedYear: {
    type: Number,
    default: null,
  },
  selectedMonth: {
    type: Number,
    default: -1,
  },
  totalArticles: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update"]);

const currentYear = new Date().getFullYear();

const yearOptions = computed(() => {
  const baseYears = Array.from({ length: 5 }, (_, index) => currentYear - index);
  if (props.selectedYear && !baseYears.includes(props.selectedYear)) {
    baseYears.push(props.selectedYear);
  }
  return baseYears.sort((a, b) => b - a);
});

const subTagsForSelectedTopTag = computed(() => {
  if (!props.selectedTopTag) return [];
  return props.tags.subTags?.[props.selectedTopTag] || [];
});

const totalTagCount = computed(() => {
  const topTags = props.tags.topTags || [];
  const subTagCount = Object.values(props.tags.subTags || {}).reduce((sum, list) => {
    return sum + (Array.isArray(list) ? list.length : 0);
  }, 0);
  return topTags.length + subTagCount;
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
  <aside class="sidebar">
    <section class="panel profile-card">
      <img class="profile-avatar" :src="avatarUrl" alt="香辛料的小屋" :style="{ viewTransitionName: 'user-avatar' }" />
      <div class="profile-name">Spice</div>
      <p class="profile-desc">花店不开了，花还在开......</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">文章</div>
          <div class="stat-value">{{ totalArticles }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">分类</div>
          <div class="stat-value">{{ tags.topTags?.length || 0 }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">标签</div>
          <div class="stat-value">{{ totalTagCount }}</div>
        </div>
      </div>
    </section>

    <section class="panel menu-panel">
      <button
        type="button"
        class="menu-item"
        :class="{ active: !selectedTopTag && !selectedSubTag && !selectedYear && selectedMonth === -1 }"
        @click="resetFilters"
      >
        <span class="mini-icon">A</span>
        全部文章
      </button>

      <button
        v-for="topTag in tags.topTags"
        :key="topTag"
        type="button"
        class="menu-item"
        :class="{ active: selectedTopTag === topTag }"
        @click="update('topTag', topTag)"
      >
        <span class="mini-icon">{{ topTag.slice(0, 1).toUpperCase() }}</span>
        {{ topTag }}
      </button>
    </section>

    <section v-if="selectedTopTag" class="panel tag-panel">
      <div class="side-title">二级标签</div>
      <div class="tags" v-if="subTagsForSelectedTopTag.length">
        <button
          v-for="subTag in subTagsForSelectedTopTag"
          :key="subTag"
          type="button"
          class="tag"
          :class="{ active: selectedSubTag === subTag }"
          @click="update('subTag', subTag)"
        >
          {{ subTag }}
        </button>
      </div>
      <p v-else class="side-empty">当前主标签下暂无二级标签</p>
    </section>

    <section class="panel archive-panel">
      <div class="side-title">日期范围</div>
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
.sidebar {
  min-width: 0;
}

.panel {
  background: var(--article-list-panel);
  border: 1px solid var(--article-list-panel-border);
  border-radius: 8px;
  box-shadow: var(--article-list-shadow);
  backdrop-filter: blur(12px);
}

.sidebar .panel + .panel {
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
  width: 150px;
  height: 150px;
  margin: 0 auto 18px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}

.profile-name {
  margin-bottom: 10px;
  font-size: 1.45rem;
  font-weight: 700;
}

.profile-desc {
  margin: 0 8px 20px;
  color: var(--article-list-text-soft);
  font-size: 14px;
  line-height: 1.8;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  color: var(--article-list-text-faint);
  font-size: 12px;
}

.stat-value {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

.menu-panel,
.tag-panel,
.archive-panel {
  padding: 18px 16px;
}

.side-title {
  margin: 2px 8px 14px;
  font-size: 1rem;
  font-weight: 700;
}

.menu-panel {
  display: grid;
  gap: 8px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: 0;
  border-radius: 8px;
  color: #68717c;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.menu-item:hover {
  color: var(--article-list-text);
  background: rgba(255, 255, 255, 0.7);
}

.menu-item.active {
  color: #5c7e69;
  background: #eef5f0;
  font-weight: 600;
}

.mini-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 11px;
}

.tags,
.month-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 8px 6px;
}

.tag,
.month-item {
  border: 1px solid rgba(17, 24, 39, 0.04);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(245, 247, 249, 0.95);
  cursor: pointer;
  transition: 0.2s ease;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 8px 13px;
  font-size: 13px;
}

.tag:hover,
.month-item:hover {
  color: var(--article-list-text);
  background: #e9efec;
}

.tag.active,
.month-item.active {
  color: #ffffff;
  background: #6ea37e;
}

.side-empty {
  margin: 0 8px;
  color: var(--article-list-text-faint);
  font-size: 13px;
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
  color: var(--article-list-text);
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

.month-item {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

.month-item--all {
  min-width: 52px;
}

@media (max-width: 980px) {
  .sidebar {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .sidebar .panel + .panel {
    margin-top: 0;
  }

  .menu-panel,
  .tag-panel,
  .archive-panel {
    display: none;
  }
}

@media (max-width: 640px) {
  .profile-card {
    padding: 24px 18px 20px;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
