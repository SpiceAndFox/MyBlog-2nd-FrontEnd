<script setup>
defineProps({
  avatarUrl: {
    type: String,
    required: true,
  },
  avatarAlt: {
    type: String,
    default: "",
  },
  avatarSize: {
    type: Number,
    default: 144,
  },
  name: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  stats: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <section
    class="profile-stats-card"
    :style="{ '--profile-avatar-size': `${avatarSize}px`, '--profile-stats-columns': Math.max(stats.length, 1) }"
  >
    <img class="profile-stats-card__avatar" :src="avatarUrl" :alt="avatarAlt || name" :style="{ viewTransitionName: 'user-avatar' }" />
    <div class="profile-stats-card__name">{{ name }}</div>
    <p v-if="description" class="profile-stats-card__desc">{{ description }}</p>
    <div v-if="stats.length" class="profile-stats-card__stats">
      <div v-for="stat in stats" :key="stat.label" class="profile-stats-card__stat">
        <div class="profile-stats-card__stat-label">{{ stat.label }}</div>
        <div class="profile-stats-card__stat-value">{{ stat.value }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-stats-card {
  padding: 32px 24px 24px;
  text-align: center;
}

.profile-stats-card__avatar {
  width: var(--profile-avatar-size);
  height: var(--profile-avatar-size);
  margin: 0 auto 18px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
}

.profile-stats-card__name {
  margin-bottom: 10px;
  font-size: var(--profile-name-size, 1.4rem);
  font-weight: 700;
}

.profile-stats-card__desc {
  margin: 0 8px 20px;
  color: var(--profile-text-soft, #6b7280);
  font-size: 14px;
  line-height: 1.8;
}

.profile-stats-card__stats {
  display: grid;
  grid-template-columns: repeat(var(--profile-stats-columns), 1fr);
  gap: 12px;
  padding-top: 10px;
}

.profile-stats-card__stat {
  border-right: 1px solid rgba(17, 24, 39, 0.06);
}

.profile-stats-card__stat:last-child {
  border-right: 0;
}

.profile-stats-card__stat-label {
  color: var(--profile-text-faint, #9ca3af);
  font-size: 12px;
}

.profile-stats-card__stat-value {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .profile-stats-card {
    padding: 24px 18px 20px;
  }

  .profile-stats-card__stat-value {
    font-size: 1.25rem;
  }
}
</style>
