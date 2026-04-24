<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getPublishedArticleById } from "@/api/articles";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import ArticleImagePreview from "@/components/ArticleImagePreview.vue";

const route = useRoute();
const articleId = computed(() => {
  const raw = route.params.id;
  return raw != null ? String(raw).trim() : "";
});

const loading = ref(false);
const errorMessage = ref("");
const contentRef = ref(null);
const imagePreviewRef = ref(null);
const tocItems = ref([]);
const activeHeadingId = ref("");
let activeHeadingFrame = 0;

const articleData = ref({
  id: "",
  title: "",
  headImgUrl: "",
  topTag: "",
  subTag: "",
  date: "",
  summary: "",
  content: "",
});

const mapTags = (tags = []) => {
  const top = tags.find((tag) => tag && tag.parent_id === null)?.name || "未分类";
  const sub = tags.find((tag) => tag && tag.parent_id !== null)?.name || "";
  return { top, sub };
};

const normalizeText = (text = "") => String(text).replace(/\s+/g, " ").trim();

const stripHtml = (html = "") => {
  const source = String(html || "");
  if (!source) return "";

  if (typeof document === "undefined") {
    return source.replace(/<[^>]*>/g, " ");
  }

  const element = document.createElement("div");
  element.innerHTML = source;
  return element.textContent || element.innerText || "";
};

const articlePlainText = computed(() =>
  normalizeText(articleData.value.summary || stripHtml(articleData.value.content)),
);

const articleSummary = computed(() => {
  const text = articlePlainText.value;
  if (!text) return "";
  return text.length > 92 ? `${text.slice(0, 92)}...` : text;
});

const readMinutes = computed(() => {
  const text = normalizeText(stripHtml(articleData.value.content));
  if (!text) return 0;

  const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const wordCount = text
    .replace(/[\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil((cjkCount + wordCount) / 420));
});

const updateActiveHeading = () => {
  if (!tocItems.value.length) {
    activeHeadingId.value = "";
    return;
  }

  const headings = tocItems.value.map((item) => document.getElementById(item.id)).filter(Boolean);
  let currentId = headings[0]?.id || "";

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= 132) {
      currentId = heading.id;
    } else {
      break;
    }
  }

  activeHeadingId.value = currentId;
};

const requestActiveHeadingUpdate = () => {
  if (typeof window === "undefined" || activeHeadingFrame) return;

  activeHeadingFrame = window.requestAnimationFrame(() => {
    activeHeadingFrame = 0;
    updateActiveHeading();
  });
};

const buildToc = async () => {
  await nextTick();

  const root = contentRef.value;
  if (!root) {
    tocItems.value = [];
    activeHeadingId.value = "";
    return;
  }

  const headings = Array.from(root.querySelectorAll("h1, h2, h3"));
  const usedIds = new Set();

  tocItems.value = headings.map((heading, index) => {
    const text = normalizeText(heading.textContent || `章节 ${index + 1}`);
    const baseId = heading.id || `article-heading-${index + 1}`;
    let id = baseId;
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);
    heading.id = id;

    return {
      id,
      text,
      level: Number(heading.tagName.slice(1)),
    };
  });

  activeHeadingId.value = tocItems.value[0]?.id || "";
  requestActiveHeadingUpdate();
};

const scrollToHeading = (id) => {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  activeHeadingId.value = id;
};

const openArticleImagePreview = (event) => {
  const image = event.target?.closest?.("img");

  if (!image || !contentRef.value?.contains(image)) return;

  imagePreviewRef.value?.open({
    src: image.currentSrc || image.src,
    alt: image.alt || articleData.value.title || "文章图片",
  });
};

const fetchArticle = async () => {
  if (!articleId.value) {
    errorMessage.value = "缺少文章 ID";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await getPublishedArticleById(articleId.value);
    const { top, sub } = mapTags(data.tags);
    const displayDate = data.published_at || data.created_at || "";
    articleData.value = {
      id: data.id,
      title: data.title || "",
      headImgUrl: data.header_image_url || "",
      topTag: top,
      subTag: sub,
      date: displayDate ? displayDate.slice(0, 10) : "",
      summary: data.summary || "",
      content: data.content || "",
    };
  } catch (err) {
    errorMessage.value = err.message || "文章加载失败";
  } finally {
    loading.value = false;
  }
};

watch(articleId, fetchArticle);
watch(() => articleData.value.content, buildToc, { flush: "post" });

onMounted(() => {
  fetchArticle();
  window.addEventListener("scroll", requestActiveHeadingUpdate, { passive: true });
  window.addEventListener("resize", requestActiveHeadingUpdate);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", requestActiveHeadingUpdate);
  window.removeEventListener("resize", requestActiveHeadingUpdate);

  if (activeHeadingFrame) {
    window.cancelAnimationFrame(activeHeadingFrame);
  }
});
</script>

<template>
  <article class="article-page">
    <header class="article-hero" :class="{ 'article-hero--empty': !articleData.headImgUrl }">
      <img v-if="articleData.headImgUrl" :src="articleData.headImgUrl" alt="文章头图" class="article-hero__image" />
      <div v-else class="article-hero__placeholder"></div>

      <div class="article-hero__content">
        <div class="article__meta" v-if="articleData.topTag || articleData.subTag || articleData.date">
          <div class="article__tags" v-if="articleData.topTag || articleData.subTag">
            <span v-if="articleData.topTag" class="tag tag--top">{{ articleData.topTag }}</span>
            <span v-if="articleData.subTag" class="tag tag--sub">{{ articleData.subTag }}</span>
          </div>
          <time v-if="articleData.date" class="article__date" :datetime="articleData.date">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            </svg>
            {{ articleData.date }}
          </time>
        </div>

        <h1 class="article__title">{{ articleData.title || "文章加载中..." }}</h1>
        <p v-if="articleSummary" class="article__summary">{{ articleSummary }}</p>

        <div v-if="readMinutes" class="article__stats" aria-label="文章信息">
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            约 {{ readMinutes }} 分钟阅读
          </span>
        </div>
      </div>
    </header>

    <main class="article-shell">
      <div class="article-layout">
        <section class="article-card">
          <p v-if="errorMessage" class="article__error">{{ errorMessage }}</p>
          <p v-else-if="!articleData.content" class="article__loading-text">内容加载中...</p>
          <div
            v-else
            ref="contentRef"
            class="article__content"
            v-html="articleData.content"
            @click="openArticleImagePreview"
          ></div>
        </section>

        <aside v-if="tocItems.length" class="article-aside">
          <nav class="toc-card" aria-label="文章目录">
            <div class="toc-card__title">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              文章目录
            </div>
            <ol class="toc-list">
              <li
                v-for="item in tocItems"
                :key="item.id"
                class="toc-list__item"
                :class="[`toc-list__item--h${item.level}`, { 'is-active': activeHeadingId === item.id }]"
              >
                <a
                  :href="`#${item.id}`"
                  :class="{ 'is-active': activeHeadingId === item.id }"
                  @click.prevent="scrollToHeading(item.id)"
                >
                  {{ item.text }}
                </a>
              </li>
            </ol>
          </nav>
        </aside>
      </div>
    </main>
  </article>

  <LoadingOverlay :show="loading" />
  <ArticleImagePreview ref="imagePreviewRef" />
</template>

<style scoped>
.article-page {
  width: 100%;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, rgba(247, 250, 252, 0.72) 0%, #f6f8fb 440px, #f9fafb 100%), #f9fafb;
  color: #243042;
  overflow-x: hidden;
}

.article-hero {
  position: relative;
  min-height: clamp(390px, 52vh, 580px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  isolation: isolate;
  background: #edf3f7;
}

.article-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(
      90deg,
      rgba(247, 250, 252, 0.82) 0%,
      rgba(247, 250, 252, 0.72) 31%,
      rgba(247, 250, 252, 0.32) 64%,
      rgba(247, 250, 252, 0.55) 100%
    ),
    linear-gradient(180deg, rgba(247, 250, 252, 0.82) 0%, rgba(247, 250, 252, 0.14) 42%, #f6f8fb 100%);
  pointer-events: none;
}

.article-hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  z-index: 2;
  height: 160px;
  background: linear-gradient(180deg, rgba(246, 248, 251, 0), #f6f8fb 78%);
  pointer-events: none;
}

.article-hero__image,
.article-hero__placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.article-hero__image {
  z-index: 0;
  object-fit: cover;
  object-position: center;
  filter: saturate(0.95) contrast(0.96);
  opacity: 0.75;
}

.article-hero__placeholder {
  background:
    radial-gradient(circle at 68% 22%, rgba(126, 159, 183, 0.28), transparent 34%),
    radial-gradient(circle at 18% 82%, rgba(70, 116, 154, 0.12), transparent 36%),
    linear-gradient(135deg, #f7fafc 0%, #e5eef4 52%, #f2f5f8 100%);
}

.article-hero__content {
  position: relative;
  z-index: 3;
  width: min(1120px, calc(100% - 44px));
  margin: 0 auto;
  padding: 126px 0 76px;
}

.article__title {
  max-width: 700px;
  margin: 20px 0 18px;
  color: #213044;
  font-size: clamp(2.4rem, 5vw, 4.8rem);
  line-height: 1.08;
  font-weight: 850;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.article__summary {
  max-width: 620px;
  margin: 0;
  color: #5d6978;
  font-size: 1.05rem;
  line-height: 1.85;
}

.article__meta,
.article__stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #758293;
  font-size: 14px;
}

.article__stats {
  margin-top: 24px;
}

.article__stats span,
.article__date {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.article__stats svg,
.article__date svg,
.toc-card__title svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.article__tags {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tag,
.article__date {
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 999px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.tag {
  display: inline-flex;
  align-items: center;
  color: #405066;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.16);
  font-weight: 700;
}

.tag--top {
  color: #ffffff;
  border-color: rgba(37, 99, 235, 0.28);
  background: linear-gradient(180deg, #2f6fbd, #255fa8);
  box-shadow: 0 10px 26px rgba(37, 99, 235, 0.18);
}

.tag--sub,
.article__date {
  color: #334155;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.article-shell {
  width: min(100%, 1120px);
  margin: -36px auto 0;
  padding: 0 22px 92px;
  box-sizing: border-box;
  position: relative;
  z-index: 4;
}

.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  align-items: start;
  gap: 34px;
}

.article-card,
.toc-card {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 58px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.article-card {
  min-width: 0;
  padding: clamp(34px, 5vw, 58px) clamp(24px, 5vw, 64px);
}

.article-aside {
  position: sticky;
  top: 84px;
}

.toc-card {
  padding: 22px 20px 24px;
}

.toc-card__title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
  color: #243042;
  font-size: 1rem;
  font-weight: 800;
}

.toc-list {
  position: relative;
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0 0 0 16px;
  list-style: none;
}

.toc-list::before {
  content: "";
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 3px;
  width: 2px;
  border-radius: 999px;
  background: #d7dde5;
}

.toc-list__item {
  position: relative;
}

.toc-list__item::before {
  content: "";
  position: absolute;
  top: 15px;
  left: -17px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #c4ccd7;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.toc-list__item.is-active::before {
  background: #2f6fbd;
  box-shadow: 0 0 0 4px rgba(47, 111, 189, 0.12);
  transform: scale(1.05);
}

.toc-list a {
  display: block;
  padding: 9px 0;
  color: #6b7685;
  font-size: 14px;
  line-height: 1.35;
  text-decoration: none;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.toc-list a:hover,
.toc-list a.is-active {
  color: #2f6fbd;
}

.toc-list a:hover {
  transform: translateX(2px);
}

.toc-list__item--h3 a {
  padding-left: 14px;
  font-size: 13px;
}

.article__content {
  color: #303946;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 18px;
  line-height: 1.92;
  letter-spacing: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.article__content :deep(*) {
  scroll-margin-top: 96px;
}

.article__content :deep(p) {
  margin: 0 0 1.4em;
  text-align: justify;
}

.article__content :deep(p:last-child) {
  margin-bottom: 0;
}

.article__content :deep(h1),
.article__content :deep(h2),
.article__content :deep(h3),
.article__content :deep(h4) {
  color: #1f2937;
  line-height: 1.32;
  letter-spacing: 0;
  text-wrap: balance;
}

.article__content :deep(h1) {
  margin: 0 0 0.85em;
  font-size: 2.05rem;
}

.article__content :deep(h2) {
  margin: 2.25em 0 0.82em;
  font-size: 1.68rem;
}

.article__content :deep(h3) {
  margin: 2em 0 0.72em;
  font-size: 1.32rem;
}

.article__content :deep(h4) {
  margin: 1.8em 0 0.62em;
  font-size: 1.14rem;
}

.article__content :deep(a) {
  color: #2f6fbd;
  text-decoration: none;
  border-bottom: 1px solid rgba(47, 111, 189, 0.28);
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.article__content :deep(a:hover) {
  color: #24558f;
  border-bottom-color: currentColor;
}

.article__content :deep(blockquote) {
  margin: 2em 0;
  padding: 0.8em 1.35em;
  border-left: 4px solid #2f6fbd;
  border-radius: 0 8px 8px 0;
  background: #f4f8fb;
  color: #5d6978;
}

.article__content :deep(ul),
.article__content :deep(ol) {
  margin: 0 0 1.5em;
  padding-left: 1.6em;
}

.article__content :deep(li + li) {
  margin-top: 0.35em;
}

.article__content :deep(pre) {
  overflow-x: auto;
  margin: 2em 0;
  padding: 1rem 1.1rem;
  border-radius: 8px;
  background: #182232;
  color: #f9fafb;
  font-size: 0.92em;
}

.article__content :deep(code) {
  border-radius: 4px;
  background: rgba(31, 41, 55, 0.08);
  padding: 0.15em 0.35em;
}

.article__content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.article__content :deep(img) {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 400px;
  margin: 28px auto;
  border-radius: 8px;
  cursor: zoom-in;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.article__content :deep(img:hover) {
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.18);
  transform: translateY(-2px);
}

.article__error,
.article__loading-text {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
}

.article__error {
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fecdd3;
}

.article__loading-text {
  color: #64748b;
  background: #f8fafc;
}

@media (max-width: 1040px) {
  .article-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .article-aside {
    display: none;
  }
}

@media (max-width: 768px) {
  .article-hero {
    min-height: 390px;
  }

  .article-hero::before {
    background:
      linear-gradient(180deg, rgba(247, 250, 252, 0.72) 0%, rgba(247, 250, 252, 0.36) 45%, #f6f8fb 100%),
      linear-gradient(90deg, rgba(247, 250, 252, 0.78), rgba(247, 250, 252, 0.28));
  }

  .article-hero__image {
    opacity: 0.68;
  }

  .article-hero__content {
    width: min(100% - 30px, 1120px);
    padding: 104px 0 68px;
  }

  .article__title {
    max-width: 100%;
    margin-top: 18px;
    font-size: clamp(2.05rem, 11vw, 3.35rem);
    line-height: 1.12;
  }

  .article__summary {
    font-size: 0.98rem;
    line-height: 1.75;
  }

  .article-shell {
    margin-top: -28px;
    padding: 0 14px 66px;
  }

  .article-card {
    padding: 28px 20px 34px;
    box-shadow: 0 16px 38px rgba(15, 23, 42, 0.07);
  }

  .article__content {
    font-size: 16.5px;
    line-height: 1.82;
  }

  .article__content :deep(p) {
    text-align: left;
  }

  .article__content :deep(img) {
    max-width: 100%;
    margin: 26px auto;
    border-radius: 7px;
  }
}
</style>
