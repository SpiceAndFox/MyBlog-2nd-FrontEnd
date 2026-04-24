<script setup>
import { computed, nextTick } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  diary: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();
const isReversed = computed(() => props.index % 2 === 1);

function navigate() {
  const target = { name: "DiaryArticle", params: { id: props.diary.id } };

  if (!document.startViewTransition) {
    router.push(target);
    return;
  }

  document.startViewTransition(async () => {
    await router.push(target);
    await nextTick();
  });
}
</script>

<template>
  <article class="diary-card" :class="{ 'diary-card--reverse': isReversed }" @click="navigate">
    <div class="thumb" :class="{ 'thumb--empty': !diary.thumbnail }">
      <img v-if="diary.thumbnail" class="thumb-img" :src="diary.thumbnail" alt="日记封面" />
      <span v-else class="thumb-label">暂无封面</span>
    </div>

    <div class="diary-body">
      <a class="diary-title" :href="diary.link" @click.prevent>{{ diary.title }}</a>
      <p class="diary-desc">{{ diary.summary }}</p>

      <div v-if="diary.datetime" class="diary-meta">
        <time class="diary-date" :datetime="diary.datetime">{{ diary.datetime }}</time>
      </div>
    </div>
  </article>
</template>

<style scoped>
.diary-card {
  display: grid;
  grid-template-columns: minmax(340px, 40%) minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  padding: 0;
  height: 228px;
  overflow: hidden;
  border: 1px solid rgba(92, 126, 105, 0.1);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 251, 250, 0.78));
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.diary-card:hover {
  transform: translateY(-2px);
  border-color: rgba(92, 126, 105, 0.28);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.thumb {
  position: relative;
  overflow: hidden;
  height: 100%;
  min-height: 0;
  margin-right: -26px;
  clip-path: polygon(0 0, 100% 0, calc(100% - 26px) 100%, 0 100%);
  background: linear-gradient(135deg, #9bc4cb, #5aa48f 44%, #2e615d 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.thumb-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition:
    transform 0.3s ease,
    filter 0.3s ease;
}

.diary-card:hover .thumb-img {
  transform: scale(1.035);
  filter: saturate(1.04);
}

.thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8fb0b4, #6ea37e 48%, #536f63 100%);
}

.thumb-label {
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  backdrop-filter: blur(8px);
}

.diary-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 22px 24px 22px 46px;
}

.diary-card--reverse {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 40%);
}

.diary-card--reverse .thumb {
  grid-column: 2;
  grid-row: 1;
  margin-right: 0;
  margin-left: -26px;
  clip-path: polygon(26px 0, 100% 0, 100% 100%, 0 100%);
}

.diary-card--reverse .diary-body {
  grid-column: 1;
  grid-row: 1;
  padding: 22px 46px 22px 24px;
}

.diary-title {
  display: block;
  margin: 0;
  color: #1f2937;
  font-size: 1.48rem;
  line-height: 1.35;
  font-weight: 800;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diary-title:hover {
  color: #5c7e69;
}

.diary-desc {
  max-width: 72ch;
  margin: 12px 0 16px;
  color: #7b8490;
  font-size: 15px;
  line-height: 1.75;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.diary-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
}

.diary-date {
  justify-self: end;
  color: #8b94a1;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .diary-card {
    grid-template-columns: minmax(286px, 40%) minmax(0, 1fr);
    height: 208px;
  }

  .diary-card--reverse {
    grid-template-columns: minmax(0, 1fr) minmax(286px, 40%);
  }

  .diary-desc {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .diary-card {
    grid-template-columns: 1fr;
    height: auto;
  }

  .diary-card--reverse {
    grid-template-columns: 1fr;
  }

  .diary-title {
    font-size: 1.35rem;
  }

  .thumb {
    grid-column: auto;
    grid-row: auto;
    height: auto;
    min-height: auto;
    margin-right: 0;
    margin-left: 0;
    aspect-ratio: 16 / 9;
    clip-path: none;
  }

  .diary-card--reverse .thumb {
    grid-column: auto;
    grid-row: auto;
    margin-right: 0;
    margin-left: 0;
    clip-path: none;
  }

  .diary-body {
    grid-column: auto;
    grid-row: auto;
    padding: 16px;
  }

  .diary-card--reverse .diary-body {
    grid-column: auto;
    grid-row: auto;
    padding: 16px;
  }

  .diary-meta {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .diary-date {
    justify-self: start;
  }
}
</style>
