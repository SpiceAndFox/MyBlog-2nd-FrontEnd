<script setup>
import { useRouter } from "vue-router";
const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
  layout: {
    type: String,
    required: true,
  },
});

// ArticleCard和Aricle联动逻辑——头图放大载入页面
const router = useRouter();
const transitionName = `article-image-${props.article.id}`;
function navigate() {
  if (!document.startViewTransition) {
    router.push(`/article/${props.article.id}`);
    return;
  }

  document.startViewTransition(() => {
    router.push(`/article/${props.article.id}`);
  });
}
</script>

<template>
  <article class="article-card" @click="navigate" :class="`layout--${layout}`">
    <img
      class="article-card__image"
      :src="article.imgUrl"
      alt="文章头图"
      :style="{ viewTransitionName: transitionName }"
    />
    <div class="article-card__content">
      <a class="article-card__title" @click.prevent :href="`/article/${article.id}`">{{ article.title }}</a>
      <p class="article-card__summary">{{ article.summary }}</p>
      <div class="article-card__meta">
        <span class="tag">{{ article.topTag }}</span>
        <time :datetime="article.datetime">{{ article.datetime }}</time>
      </div>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  display: flex;
  flex-direction: row;
  gap: 20px;
  position: relative;
  padding: 15px;
  padding-left: 10px;
  border-radius: 15px;
  transition: box-shadow 0.3s, transform 0.3s ease;
  cursor: pointer;

  container-type: inline-size;
  container-name: article-card;
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.article-card__image {
  width: 110px;
  height: 110px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 10px;
}

.article-card__content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.article-card__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-decoration: none;
  color: rgb(247, 247, 247);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.article-card__summary {
  margin: 8px 0;
  font-size: 0.9rem;
  color: rgb(231, 231, 231);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  max-height: 3em;
}

.article-card__meta {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #d4d4d4;
  margin-top: auto;
}

/* 针对aricleList页的个性化 */
.article-card.layout--grid {
  flex-direction: column;
  gap: 10px;
}
.article-card.layout--grid .article-card__title {
  color: rgb(90, 90, 90);
}
.article-card.layout--grid .article-card__image {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}
.article-card.layout--grid .article-card__content {
  width: 100%;
  max-width: 100%;
}
.article-card.layout--grid .article-card__summary {
  color: rgb(100, 100, 100);
}
.article-card.layout--grid .article-card__meta {
  color: rgb(124, 124, 124);
}

/* --- 移动端适配 */
@container article-list-section (max-width: 500px) {
  .article-card {
    flex-direction: column;
  }

  .article-card__image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .article-card__content {
    width: 100%;
    max-width: 100%;
  }
}
</style>
