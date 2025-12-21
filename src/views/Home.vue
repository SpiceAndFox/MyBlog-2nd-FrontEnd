<script setup>
import { ref, onMounted } from "vue";
import UserInfo from "@/components/Home/UserInfo.vue";
import RecentArticleSection from "@/components/Home/RecentArticleSection.vue";
import RippleBackground from "@/components/Home/RippleBackground.vue";
import { getPublishedArticles } from "@/api/articles";

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
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
    <RecentArticleSection :title="articleListSectionTitle" :articles="articlesData"></RecentArticleSection>
  </main>
  <div v-if="isIOS" class="bottom-ios-notice">
    <span>出生Safari</span>
    <span>因为弹簧机制</span>
    <span>我得给它写个渐变</span>
  </div>
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

/* 脑残ios */
.bottom-ios-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
  padding-bottom: 20px;
  color: rgb(219, 202, 202);

  background: linear-gradient(
    to top,
    rgb(238, 238, 238) 0%,
    rgba(238, 238, 238, 0.9) 20%,
    rgba(238, 238, 238, 0) 70%,
    rgba(238, 238, 238, 0) 100%
  );
}
.bottom-ios-notice span:nth-of-type(2) {
  color: rgb(202, 192, 192);
}
.bottom-ios-notice span:nth-of-type(3) {
  color: rgb(105, 100, 100);
}
</style>
