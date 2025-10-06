<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArticleListSection from "@/components/ArticleListSection.vue";
import ArticleFilterPanel from "@/components/ArticleFilterPanel.vue";

// 模拟数据
const tags = {
  topTags: ["科技", "生活"],
  subTags: { 科技: ["Vue", "Cpp", "ML"], 生活: ["旅行", "杂项"] },
};

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

// 定义路由
const route = useRoute();
const router = useRouter();

// 存储当前筛选条件的状态
const currentFilter = ref({
  topTag: "",
  subTag: "",
  year: null,
  month: -1,
});

// 从路由中读取数据以更新变量
function updateFilterFromRoute(currentRoute) {
  currentFilter.value.topTag = currentRoute.query.topTag || "";
  currentFilter.value.subTag = currentRoute.query.subTag || "";
  currentFilter.value.year = parseInt(currentRoute.query.year) || null;
  currentFilter.value.month = parseInt(currentRoute.query.month) || -1;
}

// 挂载时初始化参数
onMounted(() => {
  updateFilterFromRoute(route);
});

// 监听路由变化，以便在浏览器前进/后退时更新筛选
watch(
  () => route.query,
  () => {
    updateFilterFromRoute(route);
  }
);

// 响应筛选条件变化
function handleFilterChange({ type, value }) {
  const filter = currentFilter.value;
  switch (type) {
    case "topTag":
      if (filter.topTag === value) {
        filter.topTag = "";
        filter.subTag = "";
      } else {
        filter.topTag = value;
        filter.subTag = "";
      }
      break;
    case "subTag":
      if (filter.subTag === value) {
        filter.subTag = "";
      } else {
        filter.subTag = value;
      }
      break;
    case "year":
      filter.year = value;
      filter.month = -1; // 切换年份时重置月份
      break;
    case "month":
      filter.month = value;
      break;
  }

  // 更新URL
  const params = new URLSearchParams();
  if (filter.topTag) params.append("topTag", filter.topTag);
  if (filter.subTag) params.append("subTag", filter.subTag);
  if (filter.year) params.append("year", filter.year);
  if (filter.month && filter.month !== -1) params.append("month", filter.month);

  router.push({ path: "/articles", query: Object.fromEntries(params) });
}

// 定义文章列表数据（随筛选条件更新）
const filteredArticles = computed(() => {
  const { topTag, subTag, year, month } = currentFilter.value;
  return allArticles.value.filter((article) => {
    // 标签筛选
    const topMatch = topTag ? article.topTag === topTag : true;
    const subMatch = subTag ? article.subTag === subTag : true;

    // 日期筛选
    const articleDate = new Date(article.datetime);
    const yearMatch = year ? articleDate.getFullYear() === year : true;

    // month 为-1代表不筛选月份
    const monthMatch = month !== -1 ? articleDate.getMonth() + 1 === month : true;
    return topMatch && subMatch && yearMatch && monthMatch;
  });
});

// 定义文章列表标题（随筛选条件更新）
const articleListSectionTitle = computed(() => {
  const { topTag, subTag, year, month } = currentFilter.value;
  let title = "";

  if (subTag) {
    title = `${topTag} / ${subTag}`;
  } else if (topTag) {
    title = topTag;
  } else {
    title = "全部文章";
  }

  if (year && month !== -1) {
    title += ` (${year}-${String(month).padStart(2, "0")})`;
  } else if (year) {
    title += ` (${year})`;
  }

  return title;
});
</script>

<template>
  <div class="article-list-container">
    <ArticleFilterPanel
      :selectedTopTag="currentFilter.topTag"
      :selectedSubTag="currentFilter.subTag"
      :selectedYear="currentFilter.year"
      :selectedMonth="currentFilter.month"
      :tags="tags"
      @update="handleFilterChange($event)"
    ></ArticleFilterPanel>

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
  gap: 20px;
  margin-top: 40px;
  margin-bottom: 20px;
}

@media (max-width: 1200px) {
  .article-list-container {
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>
