<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import ArticleCardAdmin from "@/components/Admin/ArticleCardAdmin.vue";
import { getAdminArticles, deleteArticleAdmin } from "@/api/articles";
import { useDebounceFn } from "@vueuse/core";

// 初始化路由
const router = useRouter();

// 列表 & 状态
const articles = ref([]);
const loading = ref(false);
const error = ref("");
const hasFetchedOnce = ref(false);

// 搜索 & 分页
const searchQuery = ref("");
const page = ref(1);
const limit = ref(3); // 每页条数
const totalPages = ref(1);
const total = ref(0);

// 判断是否请求到文章
const hasArticles = computed(() => articles.value.length > 0);

// 判断是否应该显示无任何内容被获取
const showEmpty = computed(() => hasFetchedOnce.value && !loading.value && articles.value.length === 0);

// 将后端返回的文章格式化成 ArticleCardAdmin 需要的数据结构
function formatArticle(a) {
  const rawTags = Array.isArray(a.tags) ? a.tags : [];

  const topTag = rawTags.length > 0 ? rawTags[0].name : "未分类";
  const subTags = rawTags.slice(1).map((t) => t.name);

  // 格式化发布日期
  let publishDate = "";
  if (a.published_at) {
    const d = new Date(a.published_at);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      publishDate = `${y}-${m}-${day}`;
    }
  }

  return {
    id: a.id,
    title: a.title,
    thumbnail: a.thumbnail_url || "",
    status: a.status,
    publishDate,
    topTag,
    subTags,
  };
}

// 从后端拉取文章列表（Admin）
async function loadArticles() {
  loading.value = true;
  error.value = "";

  try {
    const res = await getAdminArticles({
      search: searchQuery.value.trim(),
      page: page.value,
      limit: limit.value,
    });
    // 后端返回：{ articles, pagination: { total, page, limit, totalPages } }
    const list = Array.isArray(res.articles) ? res.articles : [];

    // 映射成前端 ArticleCardAdmin 需要的结构
    articles.value = list.map(formatArticle);

    if (res.pagination) {
      totalPages.value = res.pagination.totalPages ?? 1;
      total.value = res.pagination.total ?? articles.value.length;
    } else {
      totalPages.value = 1;
      total.value = articles.value.length;
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "加载文章列表失败";
  } finally {
    loading.value = false;
    hasFetchedOnce.value = true;
  }
}

// 点击“修改”：跳转到写作页面，携带 id
const editArticle = (id) => {
  router.push(`/admin/write/${id}`);
};

// 点击“删除”：调用后端 DELETE，再刷新列表
const deleteArticle = async (id) => {
  if (!window.confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;

  try {
    await deleteArticleAdmin(id);

    // 如果当前页只有一条被删了，并且不是第一页，就回到上一页
    if (articles.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }

    await loadArticles();
  } catch (e) {
    console.error(e);
    error.value = e.message || "删除文章失败";
  }
};

// 分页切换
const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value || newPage === page.value) return;
  page.value = newPage;
};

// 输入框内容变化时重新请求，初始挂载时也会发起一次请求
const loadDebounced = useDebounceFn(loadArticles, 250); // 防抖
watch(
  [searchQuery, page, limit],
  ([newSearch], [oldSearch]) => {
    if (newSearch !== oldSearch) page.value = 1; // 搜索词变回第一页
    loadDebounced();
  },
  { immediate: true }
);
</script>

<template>
  <div class="article-manage-container">
    <header class="manage-header">
      <h1>文章管理</h1>
      <div class="search-wrapper">
        <input type="text" v-model="searchQuery" placeholder="搜索文章标题..." class="search-input" />
      </div>
    </header>

    <!-- 错误提示、加载中 -->
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loading" class="loading">正在加载文章...</div>

    <!-- 加载完成后内容 -->
    <template v-else>
      <div v-if="hasArticles" class="article-grid">
        <ArticleCardAdmin
          v-for="article in articles"
          :key="article.id"
          :article="article"
          @edit="editArticle"
          @delete="deleteArticle"
          class="card-wrapper"
        />
      </div>

      <div v-else-if="showEmpty" class="no-data-placeholder">
        <p>没有找到匹配的文章</p>
      </div>

      <!-- 分页条 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
        <span class="page-info">
          第 {{ page }} / {{ totalPages }} 页
          <span v-if="total">（共 {{ total }} 篇）</span>
        </span>
        <button class="page-btn" :disabled="page === totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.article-manage-container {
  width: 90%;
  max-width: 1200px;
  margin: 40px auto 120px;
  padding: 0 20px;
  box-sizing: border-box;
}

.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.manage-header h1 {
  color: #1f2937;
  font-size: 2.2rem;
  font-weight: 700;
}

.search-wrapper {
  position: relative;
}

.search-input {
  padding: 10px 18px;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  width: 280px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #a78061;
  box-shadow: 0 0 0 3px rgba(167, 128, 97, 0.2);
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
}

.card-wrapper {
  cursor: pointer;
}

.no-data-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
  color: #9ca3af;
  font-size: 1.2rem;
  background-color: #f9fafb;
  border-radius: 12px;
}

/* 分页条整体容器 */
.pagination {
  margin-top: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 18px;
  border-radius: 999px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
}

/* 页码信息 */
.page-info {
  font-size: 0.95rem;
  color: #6b7280;
  white-space: nowrap;
}

/* 分页按钮 */
.page-btn {
  min-width: 86px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* hover 状态 */
.page-btn:hover:not(:disabled) {
  border-color: #a78061;
  color: #a78061;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

/* 禁用状态 */
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
  transform: none;
}

/* 悬浮式错误提示 */
.error-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 77, 79, 0.9);
  color: #fff;
  padding: 12px 22px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.95rem;
  z-index: 9999;
  backdrop-filter: blur(6px);
  animation: fade-slide-down 0.25s ease-out;
}

/* 悬浮式加载提示 */
.loading {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(55, 65, 81, 0.9); /* 类似 Tailwind 的 gray-700 */
  color: #fff;
  padding: 12px 22px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.95rem;
  z-index: 9998;
  backdrop-filter: blur(6px);
  animation: fade-slide-down 0.25s ease-out;
}

/* 小动画：淡入 + 下滑  */
@keyframes fade-slide-down {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (max-width: 768px) {
  .manage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-input {
    width: 100%;
    max-width: 100%;
  }

  /* 移动端分页条纵向堆叠，更好点按 */
  .pagination {
    flex-direction: column;
    align-items: stretch;
    border-radius: 16px;
  }

  .page-btn {
    width: 100%;
    justify-content: center;
  }

  .page-info {
    text-align: center;
    width: 100%;
  }
}
</style>
