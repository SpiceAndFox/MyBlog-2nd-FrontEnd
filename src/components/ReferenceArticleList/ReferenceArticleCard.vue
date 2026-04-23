<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  article: {
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

const tagList = computed(() => {
  if (Array.isArray(props.article.tags) && props.article.tags.length) return props.article.tags;
  return [props.article.topTag, props.article.subTag].filter(Boolean);
});

function navigate() {
  router.push({ name: "Article", params: { id: props.article.id } });
}
</script>

<template>
  <article class="article-card" :class="{ 'article-card--reverse': isReversed }" @click="navigate">
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
  grid-template-columns: 328px minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  padding: 0;
  min-height: 208px;
  overflow: hidden;
  border: 1px solid rgba(92, 126, 105, 0.1);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 251, 250, 0.78));
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
  min-height: 100%;
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
  transition: transform 0.3s ease, filter 0.3s ease;
}

.article-card:hover .thumb-img {
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

.article-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 22px 24px 22px 46px;
}

.article-card--reverse {
  grid-template-columns: minmax(0, 1fr) 328px;
}

.article-card--reverse .thumb {
  grid-column: 2;
  grid-row: 1;
  margin-right: 0;
  margin-left: -26px;
  clip-path: polygon(26px 0, 100% 0, 100% 100%, 0 100%);
}

.article-card--reverse .article-body {
  grid-column: 1;
  grid-row: 1;
  padding: 22px 46px 22px 24px;
}

.article-title {
  display: block;
  margin: 0;
  color: #1f2937;
  font-size: 1.48rem;
  line-height: 1.35;
  font-weight: 800;
  text-decoration: none;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.article-title:hover {
  color: #5c7e69;
}

.article-desc {
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

.article-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
}

.meta-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.chip {
  padding: 6px 10px;
  border: 1px solid rgba(92, 126, 105, 0.08);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(244, 248, 245, 0.95);
  font-size: 12px;
}

.article-date {
  justify-self: end;
  color: #8b94a1;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .article-card {
    grid-template-columns: 286px minmax(0, 1fr);
    min-height: 196px;
  }

  .article-card--reverse {
    grid-template-columns: minmax(0, 1fr) 286px;
  }

  .article-desc {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .article-card {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .article-card--reverse {
    grid-template-columns: 1fr;
  }

  .article-title {
    font-size: 1.35rem;
  }

  .thumb {
    grid-column: auto;
    grid-row: auto;
    min-height: auto;
    margin-right: 0;
    margin-left: 0;
    aspect-ratio: 16 / 9;
    clip-path: none;
  }

  .article-body {
    grid-column: auto;
    grid-row: auto;
    padding: 16px;
  }

  .article-meta {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .article-date {
    justify-self: start;
  }
}
</style>
