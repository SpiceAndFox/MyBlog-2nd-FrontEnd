<script setup>
import { computed } from "vue";
import DateArchivePicker from "@/components/DateArchivePicker.vue";
import ProfileStatsCard from "@/components/ProfileStatsCard.vue";
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

const profileStats = computed(() => [
  { label: "文章", value: props.totalArticles },
  { label: "分类", value: props.tags.topTags?.length || 0 },
  { label: "标签", value: totalTagCount.value },
]);

function update(type, value) {
  emit("update", { type, value });
}

function resetFilters() {
  emit("update", { type: "reset" });
}

function handleDateUpdate(payload) {
  emit("update", payload);
}
</script>

<template>
  <aside class="sidebar">
    <ProfileStatsCard
      class="panel profile-card"
      :avatar-url="avatarUrl"
      avatar-alt="香辛料的小屋"
      :avatar-size="150"
      name="Spice"
      description="花店不开了，花还在开......"
      :stats="profileStats"
    />

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
      <DateArchivePicker :selected-year="selectedYear" :selected-month="selectedMonth" @update="handleDateUpdate" />
    </section>
  </aside>
</template>

<style scoped>
.sidebar {
  min-width: 0;
  --archive-picker-text: var(--article-list-text);
  --profile-text-soft: var(--article-list-text-soft);
  --profile-text-faint: var(--article-list-text-faint);
  --profile-name-size: 1.45rem;
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

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 8px 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 8px 13px;
  border: 1px solid rgba(17, 24, 39, 0.04);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(245, 247, 249, 0.95);
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s ease;
}

.tag:hover {
  color: var(--article-list-text);
  background: #e9efec;
}

.tag.active {
  color: #ffffff;
  background: #6ea37e;
}

.side-empty {
  margin: 0 8px;
  color: var(--article-list-text-faint);
  font-size: 13px;
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
</style>
