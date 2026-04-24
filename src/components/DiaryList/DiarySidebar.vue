<script setup>
import { computed } from "vue";
import DateArchivePicker from "@/components/DateArchivePicker.vue";
import ProfileStatsCard from "@/components/ProfileStatsCard.vue";
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

const profileName = computed(() => props.user?.username || "我的日记");
const avatarUrl = computed(() => fallbackAvatarUrl); // props.user?.avatar_url || fallbackAvatarUrl
const profileStats = computed(() => [
  { label: "日记", value: props.totalDiaries },
  { label: "筛选", value: props.selectedYear ? 1 : 0 },
]);

function resetFilters() {
  emit("update", { type: "reset" });
}

function handleDateUpdate(payload) {
  emit("update", payload);
}
</script>

<template>
  <aside class="diary-sidebar">
    <ProfileStatsCard
      class="panel profile-card"
      :avatar-url="avatarUrl"
      :avatar-alt="profileName"
      :avatar-size="136"
      :name="profileName"
      description="花店不开了，花还在开"
      :stats="profileStats"
    />

    <section class="panel date-panel">
      <div class="date-panel__header">
        <div class="side-title">日期范围</div>
        <button type="button" class="reset-btn" :disabled="!selectedYear && selectedMonth === -1" @click="resetFilters">
          重置
        </button>
      </div>

      <DateArchivePicker :selected-year="selectedYear" :selected-month="selectedMonth" @update="handleDateUpdate" />
    </section>
  </aside>
</template>

<style scoped>
.diary-sidebar {
  min-width: 0;
  --archive-picker-text: var(--diary-list-text);
  --profile-text-soft: var(--diary-list-text-soft);
  --profile-text-faint: var(--diary-list-text-faint);
  --profile-name-size: 1.35rem;
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
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
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

@media (max-width: 980px) {
  .diary-sidebar {
    display: none;
  }
}
</style>
