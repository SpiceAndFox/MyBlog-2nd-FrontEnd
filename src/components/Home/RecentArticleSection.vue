<script setup>
import ArticleCardRecent from "@/components/Home/ArticleCardRecent.vue";
import { vAutoAnimate } from "@formkit/auto-animate";

defineProps({
  title: {
    type: String,
  },
  articles: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <section class="recent-article-section">
    <h2 class="recent-article-section__title">{{ title }}</h2>
    <ul class="article-list" v-auto-animate>
      <li class="article-list__item" v-for="article in articles" :key="article.id">
        <ArticleCardRecent :article="article" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recent-article-section {
  max-width: 600px;
  min-width: 300px;
  min-height: 200px;
  width: 100%;
  background-color: #9e9e9e8c;
  padding: 10px;
  backdrop-filter: blur(2px);

  box-sizing: border-box;
  border-radius: 15px;

  container-type: inline-size;
  container-name: recent-article-section;
  z-index: 1;
}

.recent-article-section__title {
  padding-left: 12px;
  margin: 0;
  margin-bottom: 10px;
  margin-top: 5px;

  font-size: 1.5rem;
  color: #535353;
  cursor: default;
  transition: color 0.4s ease;
}

.recent-article-section__title:hover {
  color: #ffffff;
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

/* 移动端适配 */
@media (max-width: 500px) {
  .recent-article-section {
    max-width: 90%;
    padding: 15px;
    margin-bottom: 20px;
  }
}

@container recent-article-section (max-width: 400px) {
  .article-list {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
