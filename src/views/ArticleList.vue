<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArticleListSection from "@/components/ArticleListSection.vue";
import ArticleFilterPanel from "@/components/ArticleFilterPanel.vue";
import { fetchAllTags } from "@/api/tags";
import { getPublishedArticles } from "@/api/articles";
import LoadingOverlay from "@/components/LoadingOverlay.vue";

// 基本变量
const tags = ref({ topTags: [], subTags: {} });
const articles = ref([]);
const loading = ref(false);
const errorMessage = ref("");

// 定义路由
const route = useRoute();
const router = useRouter();

const currentFilter = ref({
  topTag: "",
  subTag: "",
  year: null,
  month: -1,
  page: 1,
  limit: 6, // 一页多少篇
});

// 分页功能相关
const pagination = ref({ total: 0, page: 1, limit: 9, totalPages: 1 });
const hasPagination = computed(() => pagination.value.totalPages > 1);

// 统一把当前筛选状态写回路由（避免多处拼 query）
const syncRouteWithFilter = () => {
  const { topTag, subTag, year, month, page, limit } = currentFilter.value;
  const params = new URLSearchParams();
  if (topTag) params.set("topTag", topTag);
  if (subTag) params.set("subTag", subTag);
  if (year) params.set("year", year);
  if (month && month !== -1) params.set("month", month);
  if (page && page !== 1) params.set("page", page);
  if (limit && limit !== 9) params.set("limit", limit);
  router.push({ path: "/articles", query: Object.fromEntries(params) });
};

// 翻页处理
const handlePageChange = (newPage) => {
  const totalPages = pagination.value.totalPages || 1;
  if (newPage < 1 || newPage > totalPages || newPage === currentFilter.value.page) return;
  currentFilter.value.page = newPage;
  syncRouteWithFilter();
};

// 把后端返回的标签数组转成组件需要的结构
const mapTagsFromApi = (raw = []) => {
  const top = [];
  const subMap = {};
  raw.forEach((t) => {
    if (!t || !t.name) return;
    top.push(t.name);
    subMap[t.name] = Array.isArray(t.subTags) ? t.subTags.map((s) => s.name) : [];
  });
  return { topTags: top, subTags: subMap };
};

// 把后端文章数据转成 ArticleCard 需要的字段
const mapArticleFromApi = (article) => {
  const tagList = Array.isArray(article.tags) ? article.tags : [];
  const topTag = tagList.find((t) => t && t.parent_id === null)?.name || tagList[0]?.name || "未分类";
  const subTag = tagList.find((t) => t && t.parent_id !== null)?.name || "";
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

// 解析路由时也带上 limit，默认落回 9
const updateFilterFromRoute = (r) => {
  const q = r.query || {};
  currentFilter.value.topTag = q.topTag || "";
  currentFilter.value.subTag = q.subTag || "";
  currentFilter.value.year = q.year ? parseInt(q.year, 10) || null : null;
  currentFilter.value.month = q.month ? parseInt(q.month, 10) || -1 : -1;
  currentFilter.value.page = q.page ? parseInt(q.page, 10) || 1 : 1;
  currentFilter.value.limit = q.limit ? parseInt(q.limit, 10) || currentFilter.value.limit : currentFilter.value.limit;
};

const fetchTags = async () => {
  const data = await fetchAllTags();
  tags.value = mapTagsFromApi(data);
};

// 拉取文章时，把后端分页结果同步回状态，缺失时按 total/limit 兜底
const fetchArticles = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { topTag, subTag, year, month, page, limit } = currentFilter.value;
    const res = await getPublishedArticles({
      topTag,
      subTag,
      year,
      month: month === -1 ? undefined : month,
      page,
      limit,
    });
    articles.value = (res.articles || []).map(mapArticleFromApi);

    const serverPagination = res.pagination || {};
    const total = serverPagination.total ?? 0;
    const limitFromServer = serverPagination.limit ?? limit;
    const totalPages = serverPagination.totalPages ?? Math.max(1, Math.ceil(total / limitFromServer));
    const pageFromServer = serverPagination.page ?? page;
    pagination.value = { total, page: pageFromServer, limit: limitFromServer, totalPages };
    currentFilter.value.page = pageFromServer;
    currentFilter.value.limit = limitFromServer;
  } catch (err) {
    errorMessage.value = err.message || "文章加载失败";
  } finally {
    loading.value = false;
  }
};

// 筛选变化时只改状态并同步路由，让 watch(route.query) 触发请求，避免重复 fetch
const handleFilterChange = ({ type, value }) => {
  const filter = currentFilter.value;
  switch (type) {
    case "topTag":
      filter.topTag = filter.topTag === value ? "" : value;
      filter.subTag = "";
      break;
    case "subTag":
      filter.subTag = filter.subTag === value ? "" : value;
      break;
    case "year":
      filter.year = value;
      filter.month = -1;
      break;
    case "month":
      filter.month = value;
      break;
  }
  filter.page = 1;
  syncRouteWithFilter();
};

watch(
  () => route.query,
  () => {
    updateFilterFromRoute(route);
    fetchArticles();
  }
);

onMounted(async () => {
  updateFilterFromRoute(route);
  await Promise.all([fetchTags(), fetchArticles()]);
});

const articleListSectionTitle = computed(() => {
  const { topTag, subTag, year, month } = currentFilter.value;
  let title = subTag ? `${topTag} / ${subTag}` : topTag || "全部文章";
  if (year && month !== -1) title += ` (${year}-${String(month).padStart(2, "0")})`;
  else if (year) title += ` (${year})`;
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

    <div class="article-list-content">
      <ArticleListSection :title="articleListSectionTitle" :articles="articles" layout="grid" />

      <p v-if="errorMessage" class="article-error">{{ errorMessage }}</p>

      <!-- 页数切换功能 -->
      <div v-if="hasPagination" class="pagination">
        <button class="page-btn" :disabled="pagination.page === 1" @click="handlePageChange(pagination.page - 1)">
          上一页
        </button>
        <span class="page-info">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 页
          <span v-if="pagination.total">（共 {{ pagination.total }} 篇）</span>
        </span>
        <button
          class="page-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="handlePageChange(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <LoadingOverlay :show="loading"></LoadingOverlay>
  </div>
</template>

<style scoped>
.article-list-container {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  margin-top: 40px;
  margin-bottom: 20px;
}

.article-list-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 1;
  width: 60%;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 10px 16px;
  background-color: #ffffffc8;
  backdrop-filter: blur(6px);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.page-btn {
  min-width: 86px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) {
  border-color: var(--accent-color, #3b82f6);
  color: var(--accent-color, #3b82f6);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info {
  font-size: 0.95rem;
  color: #6b7280;
  white-space: nowrap;
}

.article-error {
  margin: 0;
  color: #ef4444;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 8px 12px;
  border-radius: 10px;
  width: 100%;
  text-align: center;
}

@media (max-width: 1200px) {
  .article-list-container {
    flex-direction: column;
    align-items: center;
  }
  .article-list-content {
    width: 100%;
  }
}

@media (max-width: 450px) {
  .pagination {
    width: 60%;
    border-radius: 30px;
    flex-direction: column;
    align-items: stretch;
  }
  .page-btn,
  .page-info {
    width: 100%;
    text-align: center;
  }
}
</style>
