<script setup>
import ArticleCard from "./ArticleCard.vue";

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
  <section class="article-list-section">
    <h2 class="article-list-section__title">{{ title }}</h2>
    <ul class="article-list">
      <li class="article-list__item" v-for="article in articles" :key="article.link">
        <ArticleCard :article="article" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.article-list-section {
  max-width: 600px;
  min-width: 300px;
  width: 100%;
  background-color: #9e9e9e8c;
  padding: 10px;
  backdrop-filter: blur(2px);

  box-sizing: border-box;
  border-radius: 15px;
}

.article-list-section__title {
  padding-left: 12px;
  margin: 0;
  margin-bottom: 10px;
  margin-top: 5px;

  font-size: 1.5rem;
  color: #535353;
  cursor: default;
  transition: color 0.4s ease;
}

.article-list-section__title:hover {
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
@media (max-width: 600px) {
  .article-list-section {
    padding: 15px;
  }
}
</style>
