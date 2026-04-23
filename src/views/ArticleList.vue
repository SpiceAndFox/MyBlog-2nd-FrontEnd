<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchAllTags } from "@/api/tags";
import { getPublishedArticles } from "@/api/articles";
import archiveHeroUrl from "@/assets/images/background-10.jpg";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import ArticleCard from "@/components/ArticleList/ArticleCard.vue";
import ArticleSidebar from "@/components/ArticleList/ArticleSidebar.vue";
import ArticlePagination from "@/components/ArticleList/ArticlePagination.vue";
import { vAutoAnimate } from "@formkit/auto-animate";

const DEFAULT_PAGE_SIZE = 6;

const tags = ref({ topTags: [], subTags: {} });
const articles = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const hasFetchedOnce = ref(false);
const searchInput = ref("");

const route = useRoute();
const router = useRouter();

const currentFilter = ref({
  topTag: "",
  subTag: "",
  year: null,
  month: -1,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  search: "",
});

const pagination = ref({
  total: 0,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
});

const hasPagination = computed(() => pagination.value.totalPages > 1);
const hasArticles = computed(() => articles.value.length > 0);
const showEmpty = computed(() => hasFetchedOnce.value && !loading.value && !hasArticles.value);

const articleListSectionTitle = computed(() => {
  const { topTag, subTag, year, month } = currentFilter.value;
  let title = subTag ? `${topTag} / ${subTag}` : topTag || "全部文章";
  if (year && month !== -1) title += ` (${year}-${String(month).padStart(2, "0")})`;
  else if (year) title += ` (${year})`;
  return title;
});

const subtitle = computed(() => {
  const total = pagination.value.total;
  if (total) return `共 ${total} 篇文章`;
  if (loading.value && !hasFetchedOnce.value) return "正在加载文章";
  return "记录技术、动画与生活";
});

const heroSummary = computed(() => {
  const { topTag, subTag, year, month, search } = currentFilter.value;

  if (search) return `关于“${search}”的相关文章都整理在这里。`;
  if (subTag) return `${topTag} / ${subTag} 分类下的内容归档。`;
  if (topTag) return `${topTag} 分类下的内容归档。`;
  if (year && month !== -1) return `${year} 年 ${month} 月发布的文章。`;
  if (year) return `${year} 年发布的文章。`;
  return "花店不开了，花还在开......";
});

const heroHighlights = computed(() => {
  const items = [];
  const { search, year, month } = currentFilter.value;

  items.push(pagination.value.total ? `已发布 ${pagination.value.total} 篇` : "持续更新");
  items.push(search ? `搜索：${search}` : articleListSectionTitle.value);

  if (year) {
    items.push(month !== -1 ? `${year}.${String(month).padStart(2, "0")}` : `${year} 年`);
  }

  return [...new Set(items)];
});

const emptyText = computed(() => {
  if (currentFilter.value.search) return "没有找到匹配的文章，试试别的关键词。";
  return "当前筛选条件下没有文章。";
});

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(firstQueryValue(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function mapTagsFromApi(raw = []) {
  const top = [];
  const subMap = {};

  raw.forEach((tag) => {
    if (!tag || !tag.name) return;
    top.push(tag.name);
    subMap[tag.name] = Array.isArray(tag.subTags) ? tag.subTags.map((subTag) => subTag.name).filter(Boolean) : [];
  });

  return { topTags: top, subTags: subMap };
}

function mapArticleFromApi(article) {
  const tagList = Array.isArray(article.tags) ? article.tags : [];
  const topTag = tagList.find((tag) => tag && tag.parent_id === null)?.name || tagList[0]?.name || "未分类";
  const subTag = tagList.find((tag) => tag && tag.parent_id !== null)?.name || "";
  const tagNames = tagList.map((tag) => tag?.name).filter(Boolean);

  return {
    id: article.id,
    link: `/article/${article.id}`,
    headImgUrl: article.header_image_url || "",
    thumbnail: article.thumbnail_url || article.header_image_url || "",
    title: article.title,
    topTag,
    subTag,
    tags: tagNames.length ? tagNames : [topTag, subTag].filter(Boolean),
    datetime: article.published_at ? article.published_at.slice(0, 10) : "",
    summary: article.summary || "",
  };
}

function buildFilterQuery() {
  const { topTag, subTag, year, month, page, limit, search } = currentFilter.value;
  const params = new URLSearchParams();

  if (topTag) params.set("topTag", topTag);
  if (subTag) params.set("subTag", subTag);
  if (year) params.set("year", year);
  if (month && month !== -1) params.set("month", month);
  if (page && page !== 1) params.set("page", page);
  if (limit && limit !== DEFAULT_PAGE_SIZE) params.set("limit", limit);
  if (search) params.set("search", search);

  return Object.fromEntries(params);
}

function isSameQuery(nextQuery) {
  const currentQuery = route.query || {};
  const currentKeys = Object.keys(currentQuery);
  const nextKeys = Object.keys(nextQuery);
  if (currentKeys.length !== nextKeys.length) return false;

  return nextKeys.every((key) => String(firstQueryValue(currentQuery[key]) ?? "") === String(nextQuery[key] ?? ""));
}

function syncRouteWithFilter() {
  const query = buildFilterQuery();
  if (isSameQuery(query)) return;
  router.push({ path: "/articles", query });
}

function updateFilterFromRoute(r) {
  const query = r.query || {};

  currentFilter.value.topTag = firstQueryValue(query.topTag) || "";
  currentFilter.value.subTag = firstQueryValue(query.subTag) || "";
  currentFilter.value.year = query.year ? parsePositiveInt(query.year, null) : null;
  currentFilter.value.month = query.month ? parsePositiveInt(query.month, -1) : -1;
  currentFilter.value.page = parsePositiveInt(query.page, 1);
  currentFilter.value.limit = parsePositiveInt(query.limit, DEFAULT_PAGE_SIZE);
  currentFilter.value.search = firstQueryValue(query.search) ? String(firstQueryValue(query.search)) : "";
  searchInput.value = currentFilter.value.search;
}

async function fetchTags() {
  try {
    const data = await fetchAllTags();
    tags.value = mapTagsFromApi(data);
  } catch (err) {
    console.error(err);
  }
}

async function fetchArticles() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { topTag, subTag, year, month, page, limit, search } = currentFilter.value;
    const res = await getPublishedArticles({
      topTag,
      subTag,
      year,
      month: month === -1 ? undefined : month,
      search,
      page,
      limit,
    });

    articles.value = (res.articles || []).map(mapArticleFromApi);

    const serverPagination = res.pagination || {};
    const total = serverPagination.total ?? 0;
    const limitFromServer = serverPagination.limit ?? limit;
    const totalPages = serverPagination.totalPages ?? Math.max(1, Math.ceil(total / limitFromServer));
    const pageFromServer = serverPagination.page ?? page;

    pagination.value = {
      total,
      page: pageFromServer,
      limit: limitFromServer,
      totalPages,
    };
    currentFilter.value.page = pageFromServer;
    currentFilter.value.limit = limitFromServer;
  } catch (err) {
    errorMessage.value = err.message || "文章加载失败";
    articles.value = [];
    pagination.value = {
      total: 0,
      page: currentFilter.value.page,
      limit: currentFilter.value.limit,
      totalPages: 1,
    };
  } finally {
    loading.value = false;
    hasFetchedOnce.value = true;
  }
}

function handlePageChange(newPage) {
  const totalPages = pagination.value.totalPages || 1;
  if (newPage < 1 || newPage > totalPages || newPage === currentFilter.value.page) return;
  currentFilter.value.page = newPage;
  syncRouteWithFilter();
}

function handleFilterChange({ type, value }) {
  const filter = currentFilter.value;

  switch (type) {
    case "reset":
      filter.topTag = "";
      filter.subTag = "";
      filter.year = null;
      filter.month = -1;
      filter.search = "";
      searchInput.value = "";
      break;
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
    case "search":
      filter.search = String(value || "").trim();
      searchInput.value = filter.search;
      break;
    default:
      return;
  }

  filter.page = 1;
  syncRouteWithFilter();
}

function handleSearchSubmit() {
  handleFilterChange({ type: "search", value: searchInput.value });
}

watch(
  () => route.query,
  () => {
    updateFilterFromRoute(route);
    fetchArticles();
  },
);

onMounted(async () => {
  updateFilterFromRoute(route);
  await Promise.all([fetchTags(), fetchArticles()]);
});
</script>

<template>
  <div class="article-list-page">
    <div class="page-shell">
      <section class="hero-banner" :style="{ '--hero-image': `url(${archiveHeroUrl})` }">
        <div class="hero-banner__content">
          <div class="hero-copy">
            <h2 class="hero-title">文章归档</h2>
            <p class="hero-summary">{{ heroSummary }}</p>

            <div class="hero-highlights">
              <span v-for="highlight in heroHighlights" :key="highlight" class="hero-pill">
                {{ highlight }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div class="content">
        <ArticleSidebar
          class="article-list-sidebar"
          :tags="tags"
          :selectedTopTag="currentFilter.topTag"
          :selectedSubTag="currentFilter.subTag"
          :selectedYear="currentFilter.year"
          :selectedMonth="currentFilter.month"
          :totalArticles="pagination.total"
          @update="handleFilterChange"
        />

        <main class="main panel">
          <div class="main-header">
            <div class="main-title-row">
              <div class="main-heading">
                <div class="main-title-line">
                  <h1 class="main-title">{{ articleListSectionTitle }}</h1>

                  <form class="article-list__search" @submit.prevent="handleSearchSubmit">
                    <button type="submit" aria-label="搜索文章">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m21 21-4.3-4.3" />
                        <circle cx="11" cy="11" r="7" />
                      </svg>
                    </button>
                    <input v-model="searchInput" type="search" placeholder="搜索文章..." aria-label="搜索文章" />
                  </form>
                </div>
                <div class="subtext">{{ subtitle }}</div>
              </div>
            </div>
          </div>

          <p v-if="errorMessage" class="article-error">{{ errorMessage }}</p>

          <section v-if="hasArticles" class="article-list" v-auto-animate>
            <ArticleCard
              v-for="(article, index) in articles"
              :key="`${article.id}-${index % 2}`"
              :article="article"
              :index="index"
            />
          </section>

          <div v-else-if="showEmpty" class="empty-state">{{ emptyText }}</div>

          <ArticlePagination v-if="hasPagination" :pagination="pagination" @change="handlePageChange" />
        </main>
      </div>

      <LoadingOverlay :show="loading" />
    </div>
  </div>
</template>

<style scoped>
.article-list-page {
  --article-list-panel: rgba(255, 255, 255, 0.84);
  --article-list-panel-border: rgba(15, 23, 42, 0.08);
  --article-list-text: #1f2937;
  --article-list-text-soft: #6b7280;
  --article-list-text-faint: #9ca3af;
  --article-list-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
  --article-list-shell-top: rgb(248, 251, 249);
  --article-list-shell-bottom: rgb(241, 245, 247);
  width: 100%;
  min-height: calc(100vh - 60px);
  min-height: calc(100dvh - 60px);
  color: var(--article-list-text);
  background: transparent;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.article-list-page * {
  box-sizing: border-box;
}

.page-shell {
  width: 100%;
  min-height: inherit;
  padding-bottom: 26px;
  background: linear-gradient(180deg, var(--article-list-shell-top), var(--article-list-shell-bottom));
}

.hero-banner {
  position: relative;
  min-height: 320px;
  padding: 92px 0 72px;
  overflow: hidden;
  color: #ffffff;
  background-image:
    linear-gradient(90deg, rgba(15, 23, 42, 0.78), rgba(24, 49, 57, 0.46) 48%, rgba(39, 74, 80, 0.24)),
    var(--hero-image);
  background-position: center 42%;
  background-repeat: no-repeat;
  background-size: cover;
}

.hero-banner::before {
  content: "";
  position: absolute;
  inset: auto 0 0;
  z-index: 1;
  height: 168px;
  background: linear-gradient(
    180deg,
    rgba(248, 251, 249, 0) 0%,
    rgba(248, 251, 249, 0.08) 22%,
    rgba(247, 250, 248, 0.3) 42%,
    rgba(246, 250, 248, 0.62) 64%,
    rgba(245, 249, 248, 0.9) 82%,
    var(--article-list-shell-top) 100%
  );
  pointer-events: none;
}

.hero-banner::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(9, 14, 24, 0.18) 54%, rgba(9, 14, 24, 0) 100%);
  pointer-events: none;
}

.hero-banner__content {
  position: relative;
  z-index: 2;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 22px;
}

.hero-copy {
  max-width: 640px;
}

.hero-title {
  margin: 0;
  font-size: 3rem;
  line-height: 1.04;
  font-weight: 800;
}

.hero-summary {
  max-width: 58ch;
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;
  line-height: 1.9;
}

.hero-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  overflow-wrap: anywhere;
  backdrop-filter: blur(10px);
}

.content {
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
  align-items: start;
  gap: 22px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 18px 22px 32px;
}

.main {
  min-width: 0;
}

.panel {
  overflow: hidden;
  border-radius: 8px;
  background: transparent;
}

.main-header {
  padding: 30px 30px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(248, 250, 248, 0.02));
}

.main-title-row {
  min-width: 0;
}

.main-heading {
  min-width: 0;
}

.main-title-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(168px, 28vw, 260px);
  align-items: flex-end;
  gap: 12px;
  min-width: 0;
  min-height: 46px;
}

.main-title {
  margin: 0;
  font-size: 1.85rem;
  line-height: 1.12;
  font-weight: 800;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtext {
  margin-top: 8px;
  color: #7f8792;
  font-size: 14px;
}

.article-list__search {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 46px;
  gap: 10px;
  padding: 6px 12px;
  margin: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.article-list__search button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  appearance: none;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #5b5b5b;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.1s ease;
}

.article-list__search button:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #3f3f3f;
}

.article-list__search button:active {
  transform: translateY(1px);
}

.article-list__search button:focus-visible {
  outline: 2px solid rgba(60, 60, 60, 0.35);
  outline-offset: 2px;
}

.article-list__search svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.article-list__search input {
  width: 100%;
  min-width: 0;
  padding: 6px 2px;
  border: none;
  background: transparent;
  outline: none;
  color: #3f3f3f;
  font-size: 0.95rem;
  line-height: 1.2;
}

.article-list__search input:focus {
  box-shadow: none;
}

.article-list {
  display: grid;
  gap: 16px;
  padding: 20px 18px;
}

.article-error {
  margin: 18px 18px 0;
  color: #ef4444;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
}

.empty-state {
  padding: 36px 24px 48px;
  text-align: center;
  color: #7b8490;
}

@media (max-width: 980px) {
  .article-list-sidebar {
    display: none;
  }

  .hero-banner {
    min-height: 288px;
    padding: 84px 0 64px;
    background-position: center;
  }

  .hero-banner::before {
    height: 144px;
  }

  .hero-banner__content {
    padding: 0 18px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .content {
    grid-template-columns: 1fr;
    padding: 16px 18px 24px;
  }
}

@media (max-width: 640px) {
  .hero-banner {
    min-height: 248px;
    padding: 76px 0 52px;
  }

  .hero-banner::before {
    height: 116px;
  }

  .hero-banner__content {
    padding: 0 10px;
  }

  .hero-pill {
    font-size: 12px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-summary {
    font-size: 14px;
    line-height: 1.75;
  }

  .content {
    gap: 14px;
    padding: 12px 10px 16px;
  }

  .main-header {
    padding: 20px 18px 16px;
  }

  .main-title {
    font-size: 1.55rem;
  }

  .main-title-line {
    grid-template-columns: minmax(0, 1fr) clamp(132px, 42vw, 172px);
    align-items: center;
    gap: 8px;
  }

  .article-list__search {
    min-height: 42px;
    gap: 8px;
    padding: 4px 10px;
  }

  .article-list__search input {
    font-size: 0.9rem;
  }

  .article-list {
    gap: 12px;
    padding: 14px 10px 12px;
  }
}
</style>
