<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArticleListSection from "@/components/ArticleListSection.vue";
import ArticleFilterPanel from "@/components/ArticleFilterPanel.vue";
import UserInfoBase from "@/components/UserInfoBase.vue";

// 模拟数据
import img1 from "@/assets/images/articleThumb/1.png";
import img2 from "@/assets/images/articleThumb/2.jfif";
import img3 from "@/assets/images/articleThumb/3.jpg";
import img4 from "@/assets/images/articleThumb/4.jfif";
import img5 from "@/assets/images/articleThumb/5.jfif";

const allArticles = ref([
  {
    id: 1,
    link: "/article1",
    imgUrl: img1,
    title: "文章1：好好学习天天向上",
    topTag: "生活",
    subTag: "杂项",
    datetime: "2025-09-29",
    summary: "文章1的简要概述...,大家好啊，我是说的道理，说的道理也是道理",
  },
  {
    id: 2,
    link: "/article2",
    imgUrl: img2,
    title: "文章2",
    topTag: "科技",
    subTag: "Cpp",
    datetime: "2025-09-28",
    summary: "文章2的简要概述",
  },
  {
    id: 3,
    link: "/article3",
    imgUrl: img3,
    title: "Vue进阶技巧",
    topTag: "科技",
    subTag: "Vue",
    datetime: "2025-09-27",
    summary: "探讨Vue的深入用法",
  },
  {
    id: 4,
    link: "/article4",
    imgUrl: img4,
    title: "一次有趣的旅行",
    topTag: "生活",
    subTag: "旅行",
    datetime: "2025-09-26",
    summary: "记录旅途中的点滴",
  },
  {
    id: 5,
    link: "/article5",
    imgUrl: img5,
    title: "爬山是个好方法",
    topTag: "生活",
    subTag: "旅行",
    datetime: "2025-09-25",
    summary: "有时候就得爬山",
  },
]);

// 存储当前筛选条件的状态
const currentFilter = ref({
  topTag: "",
  subTag: "",
});

// 响应tag变化
function handleFilterChange(filter) {
  currentFilter.value = filter;
}

// 定义文章列表数据（随Tag更新）
const filteredArticles = computed(() => {
  const { topTag, subTag } = currentFilter.value;
  if (!topTag && !subTag) {
    return allArticles.value;
  }

  // 临时的前端逻辑，后续调整为后端筛选
  return allArticles.value.filter((article) => {
    const topMatch = topTag ? article.topTag === topTag : true;
    const subMatch = subTag ? article.subTag === subTag : true;
    return topMatch && subMatch;
  });
});

// 定义文章列表标题（随Tag更新）
const articleListSectionTitle = computed(() => {
  const { topTag, subTag } = currentFilter.value;
  if (subTag) return `${topTag} / ${subTag}`;
  if (topTag) return topTag;
  return "全部文章";
});
</script>

<template>
  <div class="article-list-container">
    <ArticleFilterPanel @filter-change="handleFilterChange"></ArticleFilterPanel>

    <ArticleListSection
      :title="articleListSectionTitle"
      :articles="filteredArticles"
      layout="grid"
    ></ArticleListSection>
  </div>
</template>

<style scoped>
.article-list-container {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 150px;
  gap: 20px;
  margin-top: 30px;
  margin-bottom: 20px;
}

@media (max-width: 1200px) {
  .article-list-container {
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 150px;
  }
}

@media (max-width: 900px) {
  .article-list-container {
    padding: 0 100px;
  }
}

@media (max-width: 768px) {
  .article-list-container {
    padding: 0 20px;
  }
}
</style>
