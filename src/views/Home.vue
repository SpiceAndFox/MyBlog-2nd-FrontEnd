<script setup>
import { ref } from "vue";
import UserInfo from "@/components/UserInfo.vue";
import ArticleListSection from "@/components/ArticleListSection.vue";

import img1 from "@/assets/images/articleThumb/1.png";
import img2 from "@/assets/images/articleThumb/2.jfif";

const articleListSectionTitle = ref("近期文章");
const articlesData = ref([
  {
    id: 1,
    link: "/article1",
    imgUrl: img1,
    title: "文章1,这是一个标题很长的文章，很长很长，有多长呢，两三层楼那么长吧",
    topTag: "生活",
    subTag: "杂谈",
    datetime: "2025-09-29",
    summary:
      "文章1的简要概述，但是也不是很简要。这个也很长很长，很长很长，超级无敌长，长啊长啊！超级无敌长！超级超级无敌长！",
  },
  {
    id: 2,
    link: "/article2",
    imgUrl: img2,
    title: "文章2",
    topTag: "技术",
    subTag: "Web开发",
    datetime: "2025-09-28",
    summary: "文章2的简要概述",
  },
]);
</script>

<template>
  <main class="main-content">
    <UserInfo></UserInfo>
    <ArticleListSection :title="articleListSectionTitle" :articles="articlesData"></ArticleListSection>
  </main>
</template>

<style scoped>
.main-content {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: center;
  justify-content: space-around;
  padding: 0 20px;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 40px;
  }
}
</style>
