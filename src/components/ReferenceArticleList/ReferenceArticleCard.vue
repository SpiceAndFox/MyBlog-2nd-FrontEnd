<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const tagList = computed(() => {
  if (Array.isArray(props.article.tags) && props.article.tags.length) return props.article.tags;
  return [props.article.topTag, props.article.subTag].filter(Boolean);
});

function navigate() {
  router.push({ name: "Article", params: { id: props.article.id } });
}
</script>

<template>
  <article class="article-card" @click="navigate">
    <div class="thumb" :class="{ 'thumb--empty': !article.thumbnail }">
      <img v-if="article.thumbnail" class="thumb-img" :src="article.thumbnail" alt="文章头图" />
      <span v-else class="thumb-label">暂无头图</span>
    </div>

    <div class="article-body">
      <a class="article-title" :href="article.link" @click.prevent>{{ article.title }}</a>
      <p class="article-desc">{{ article.summary }}</p>

      <div v-if="tagList.length || article.datetime" class="article-meta">
        <div class="meta-tags">
          <span v-for="tag in tagList" :key="tag" class="chip">{{ tag }}</span>
        </div>
        <time v-if="article.datetime" class="article-date" :datetime="article.datetime">{{ article.datetime }}</time>
      </div>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 18px;
  border: 1px solid rgba(17, 24, 39, 0.05);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  border-color: rgba(92, 126, 105, 0.28);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.thumb {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  background: linear-gradient(135deg, #9bc4cb, #5aa48f 44%, #2e615d 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.thumb-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-card:hover .thumb-img {
  transform: scale(1.035);
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

.article-body {
  min-width: 0;
}

.article-title {
  display: block;
  margin: 0 0 12px;
  color: #1f2937;
  font-size: 1.55rem;
  line-height: 1.35;
  font-weight: 800;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.article-title:hover {
  color: #5c7e69;
}

.article-desc {
  max-width: 72ch;
  margin: 0 0 18px;
  color: #7b8490;
  font-size: 15px;
  line-height: 1.75;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.article-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.chip {
  padding: 7px 11px;
  border: 1px solid rgba(17, 24, 39, 0.04);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(245, 247, 249, 0.95);
  font-size: 12px;
}

.article-date {
  justify-self: end;
  color: #8b94a1;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .article-desc {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .article-card {
    grid-template-columns: 1fr;
    padding: 14px;
    gap: 18px;
  }

  .article-title {
    font-size: 1.35rem;
  }
}
</style>
