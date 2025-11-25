<script setup>
import ArticleCard from "./ArticleCard.vue";
import { vAutoAnimate } from "@formkit/auto-animate";

defineProps({
  title: {
    type: String,
  },
  articles: {
    type: Array,
    required: true,
  },
  layout: {
    type: String,
    default: "list",
  },
});
</script>

<template>
  <section class="article-list-section" :class="`layout--${layout}`">
    <h2 class="article-list-section__title">{{ title }}</h2>
    <ul class="article-list" v-auto-animate>
      <li class="article-list__item" v-for="article in articles" :key="article.id">
        <ArticleCard :article="article" :layout="layout" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.article-list-section {
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
  container-name: article-list-section;
  z-index: 1;
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

/* 针对ArticleList页的个性化 */
.article-list-section.layout--grid {
  width: 100%;
  max-width: 9999px;
  background-color: #ffffffb9;
  backdrop-filter: blur(8px);
  padding: 20px 20px;
}
.article-list-section.layout--grid .article-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}
.article-list-section.layout--grid .article-list-section__title {
  color: rgb(108, 108, 108);
}
.article-list-section.layout--grid .article-list-section__title:hover {
  color: #3f3f3f;
}

/* 移动端适配 */
@media (max-width: 1200px) {
  .article-list-section.layout--grid {
    width: 80%;
  }
}

@media (max-width: 900px) {
  .article-list-section.layout--grid {
    width: 85%;
  }
  .article-list-section.layout--grid .article-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container article-list-section (max-width: 500px) {
  .article-list-section {
    max-width: 100%;
    padding: 15px;
    margin-bottom: 20px;
  }

  .article-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px;
  }
}

@container article-list-section (max-width: 425px) {
  .article-list {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .article-list-section.layout--grid .article-list {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
