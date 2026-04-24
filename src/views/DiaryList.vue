<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getMeApi } from "@/api/auth";
import { getDiaryArticles } from "@/api/articles";
import diaryBackgroundUrl from "@/assets/images/diary-background.jpg";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import ArticleCard from "@/components/ArticleList/ArticleCard.vue";
import ArticlePagination from "@/components/ArticleList/ArticlePagination.vue";
import DiarySidebar from "@/components/DiaryList/DiarySidebar.vue";
import { vAutoAnimate } from "@formkit/auto-animate";

const DEFAULT_PAGE_SIZE = 6;

const route = useRoute();
const router = useRouter();

const currentUser = ref(null);
const articles = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const hasFetchedOnce = ref(false);

const currentFilter = ref({
  year: null,
  month: -1,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
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

const diaryListSectionTitle = computed(() => {
  const { year, month } = currentFilter.value;
  if (year && month !== -1) return `${year}-${String(month).padStart(2, "0")} 的日记`;
  if (year) return `${year} 年的日记`;
  if (month !== -1) return `${month} 月的日记`;
  return "全部日记";
});

const subtitle = computed(() => {
  const total = pagination.value.total;
  if (total) return `共 ${total} 篇日记`;
  if (loading.value && !hasFetchedOnce.value) return "正在加载日记";
  return "只显示当前账号匹配的内容";
});

const heroSummary = computed(() => {
  const { year, month } = currentFilter.value;
  if (year && month !== -1) return `${year} 年 ${month} 月记录的日记。`;
  if (year) return `${year} 年记录的日记。`;
  if (month !== -1) return `所有年份里 ${month} 月记录的日记。`;
  return "这里是登录后可见的个人日记归档。";
});

const heroHighlights = computed(() => {
  const items = [pagination.value.total ? `${pagination.value.total} 篇记录` : "个人归档"];
  items.push(diaryListSectionTitle.value);
  if (currentUser.value?.username) items.push(currentUser.value.username);
  return [...new Set(items)];
});

const emptyText = computed(() => {
  const { year, month } = currentFilter.value;
  if (year || month !== -1) return "当前日期范围下没有日记。";
  return "当前账号还没有可展示的日记。";
});

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(firstQueryValue(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function mapArticleFromApi(article) {
  return {
    id: article.id,
    link: `/diaries/${article.id}`,
    headImgUrl: article.header_image_url || "",
    thumbnail: diaryBackgroundUrl,
    title: article.title,
    topTag: "",
    subTag: "",
    tags: [],
    datetime: article.published_at ? article.published_at.slice(0, 10) : "",
    summary: article.summary || "",
  };
}

function buildFilterQuery() {
  const { year, month, page, limit } = currentFilter.value;
  const params = new URLSearchParams();

  if (year) params.set("year", year);
  if (month && month !== -1) params.set("month", month);
  if (page && page !== 1) params.set("page", page);
  if (limit && limit !== DEFAULT_PAGE_SIZE) params.set("limit", limit);

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
  router.push({ path: "/diaries", query });
}

function updateFilterFromRoute(r) {
  const query = r.query || {};
  currentFilter.value.year = query.year ? parsePositiveInt(query.year, null) : null;
  currentFilter.value.month = query.month ? parsePositiveInt(query.month, -1) : -1;
  currentFilter.value.page = parsePositiveInt(query.page, 1);
  currentFilter.value.limit = parsePositiveInt(query.limit, DEFAULT_PAGE_SIZE);
}

async function fetchCurrentUser() {
  try {
    currentUser.value = await getMeApi();
  } catch (err) {
    console.error(err);
    currentUser.value = null;
  }
}

async function fetchDiaries() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { year, month, page, limit } = currentFilter.value;
    const res = await getDiaryArticles({
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

    pagination.value = {
      total,
      page: pageFromServer,
      limit: limitFromServer,
      totalPages,
    };
    currentFilter.value.page = pageFromServer;
    currentFilter.value.limit = limitFromServer;
  } catch (err) {
    errorMessage.value = err.message || "日记加载失败";
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
      filter.year = null;
      filter.month = -1;
      break;
    case "year":
      filter.year = value;
      filter.month = -1;
      break;
    case "month":
      filter.month = value;
      break;
    default:
      return;
  }

  filter.page = 1;
  syncRouteWithFilter();
}

watch(
  () => route.query,
  () => {
    updateFilterFromRoute(route);
    fetchDiaries();
  },
);

onMounted(async () => {
  updateFilterFromRoute(route);
  await Promise.all([fetchCurrentUser(), fetchDiaries()]);
});
</script>

<template>
  <div class="diary-list-page">
    <div class="page-shell">
      <section class="hero-banner" :style="{ '--hero-image': `url(${diaryBackgroundUrl})` }">
        <div class="hero-banner__content">
          <div class="hero-copy">
            <h2 class="hero-title">我的日记</h2>
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
        <DiarySidebar
          :user="currentUser"
          :selectedYear="currentFilter.year"
          :selectedMonth="currentFilter.month"
          :totalDiaries="pagination.total"
          @update="handleFilterChange"
        />

        <main class="main panel">
          <div class="main-header">
            <div class="main-heading">
              <h1 class="main-title">{{ diaryListSectionTitle }}</h1>
              <div class="subtext">{{ subtitle }}</div>
            </div>
          </div>

          <p v-if="errorMessage" class="diary-error">{{ errorMessage }}</p>

          <section v-if="hasArticles" class="diary-list" v-auto-animate>
            <ArticleCard
              v-for="(article, index) in articles"
              :key="`${article.id}-${index % 2}`"
              :article="article"
              :index="index"
              targetName="DiaryArticle"
              variant="tile"
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
.diary-list-page {
  --diary-list-panel: rgba(255, 255, 255, 0.84);
  --diary-list-panel-border: rgba(15, 23, 42, 0.08);
  --diary-list-text: #1f2937;
  --diary-list-text-soft: #6b7280;
  --diary-list-text-faint: #9ca3af;
  --diary-list-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
  --diary-list-shell-top: rgb(248, 251, 249);
  --diary-list-shell-bottom: rgb(241, 245, 247);
  width: 100%;
  min-height: calc(100vh - 60px);
  min-height: calc(100dvh - 60px);
  color: var(--diary-list-text);
  background: transparent;
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.diary-list-page * {
  box-sizing: border-box;
}

.page-shell {
  width: 100%;
  min-height: inherit;
  padding-bottom: 26px;
  background: linear-gradient(180deg, var(--diary-list-shell-top), var(--diary-list-shell-bottom));
}

.hero-banner {
  position: relative;
  min-height: 320px;
  padding: 92px 0 72px;
  overflow: hidden;
  color: #ffffff;
  background-image:
    linear-gradient(90deg, rgba(15, 23, 42, 0.78), rgba(46, 56, 74, 0.5) 48%, rgba(66, 94, 98, 0.22)),
    var(--hero-image);
  background-position: center 44%;
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
    var(--diary-list-shell-top) 100%
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

.main-heading {
  min-width: 0;
}

.main-title {
  margin: 0;
  font-size: 1.85rem;
  line-height: 1.12;
  font-weight: 800;
  min-width: 0;
  overflow-wrap: anywhere;
}

.subtext {
  margin-top: 8px;
  color: #7f8792;
  font-size: 14px;
}

.diary-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 340px));
  justify-content: center;
  align-items: stretch;
  gap: 16px;
  padding: 20px 18px;
}

.diary-error {
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

  .diary-list {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    padding: 14px 10px 12px;
  }
}
</style>
