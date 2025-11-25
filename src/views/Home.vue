<script setup>
import { ref, onMounted } from "vue";
import UserInfo from "@/components/UserInfo.vue";
import ArticleListSection from "@/components/ArticleListSection.vue";
import RippleBackground from "@/components/RippleBackground.vue";
import { getPublishedArticles } from "@/api/articles";

const articleListSectionTitle = ref("近期文章");
const articlesData = ref([]);
const loading = ref(false);
const errorMessage = ref("");

// 后端返回的字段转成卡片需要的结构
const mapArticle = (article) => {
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const topTag = tags.find((t) => t && t.parent_id === null)?.name || tags[0]?.name || "未分类";
  const subTag = tags.find((t) => t && t.parent_id !== null)?.name || "";
  return {
    id: article.id,
    link: `/article/${article.id}`,
    headImgUrl: article.header_image_url || "",
    thumbnail: article.thumbnail_url || "",
    title: article.title,
    topTag,
    subTag,
    datetime: article.published_at ? article.published_at.slice(0, 10) : "",
    summary: article.summary || "",
  };
};

const fetchArticles = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { articles = [] } = await getPublishedArticles({ page: 1, limit: 2 });
    articlesData.value = articles.map(mapArticle);
  } catch (err) {
    errorMessage.value = err.message || "文章加载失败";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchArticles);
</script>

<template>
  <main class="main-content">
    <RippleBackground></RippleBackground>
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

  position: relative;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 40px;
    margin-bottom: 20px;
  }
}
</style>
