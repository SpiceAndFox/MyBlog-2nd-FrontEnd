<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPublishedArticleById } from "@/api/articles";
import LoadingOverlay from "@/components/LoadingOverlay.vue";

// 获取文章ID
const route = useRoute();
const router = useRouter();
const rawArticleId = computed(() => route.params.id);
const articleId = computed(() => {
  const raw = rawArticleId.value;
  return raw != null ? String(raw).trim() : "";
});

// 调试信息
const loading = ref(false);
const errorMessage = ref("");

// 文章数据
const articleData = ref({
  id: "",
  title: "",
  headImgUrl: "",
  topTag: "",
  subTag: "",
  date: "",
  content: "",
});

const mapTags = (tags = []) => {
  const top = tags.find((t) => t && t.parent_id === null)?.name || "未分类";
  const sub = tags.find((t) => t && t.parent_id !== null)?.name || "";
  return { top, sub };
};

const fetchArticle = async () => {
  if (!articleId.value) {
    errorMessage.value = "缺少文章ID";
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await getPublishedArticleById(articleId.value);
    const { top, sub } = mapTags(data.tags);
    articleData.value = {
      id: data.id,
      title: data.title,
      headImgUrl: data.header_image_url || articleData.value.headImgUrl,
      topTag: top,
      subTag: sub,
      date: data.published_at ? data.published_at.slice(0, 10) : articleData.value.date,
      content: data.content || "",
    };
  } catch (err) {
    errorMessage.value = err.message || "文章加载失败";
  } finally {
    loading.value = false;
  }
};

watch(articleId, () => {
  fetchArticle();
});

onMounted(() => {
  fetchArticle();
});
</script>

<template>
  <article class="article-container">
    <header class="article-header" :class="{ loaded: !!articleData.headImgUrl }">
      <img
        v-if="articleData.headImgUrl"
        :src="articleData.headImgUrl"
        alt="文章头图"
        class="article-header__image"
        @load="$event.target.parentElement.classList.add('loaded')"
      />
      <div v-else class="article-header__placeholder"></div>
      <h1 class="article__title">{{ articleData.title || "文章加载中..." }}</h1>
      <div class="article__meta">
        <div class="article__tags" v-if="articleData.topTag || articleData.subTag">
          <a v-if="articleData.topTag" class="tag tag--top">{{ articleData.topTag }}</a>
          <span v-if="articleData.topTag && articleData.subTag"> / </span>
          <a v-if="articleData.subTag" class="tag tag--sub">{{ articleData.subTag }}</a>
        </div>
        <time v-if="articleData.date">{{ articleData.date }}</time>
      </div>
    </header>

    <div class="article__content">
      <p v-if="errorMessage" class="article__error">{{ errorMessage }}</p>
      <p v-else-if="!articleData.content">内容加载中...</p>
      <div v-else v-html="articleData.content"></div>
    </div>
  </article>

  <LoadingOverlay :show="loading" />
</template>

<style scoped>
.article-container {
  background-color: #ffffffee;

  width: 100%;
  overflow: hidden;
}

.article-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 3/1;
  overflow: hidden;
  min-height: 320px;
}

.article-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;

  background: linear-gradient(to top, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0.233) 30%, transparent 50%);
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.article-header.loaded::after {
  opacity: 1;
}

.article-header__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.article__title {
  background-color: transparent;
  color: aliceblue;
  font-size: 4rem;
  z-index: 1;
}

.article__meta {
  position: absolute;
  bottom: 5px;
  right: 10px;
  z-index: 1;

  display: flex;
  align-items: center;
  gap: 15px;
}

.article__meta time {
  display: block;
  padding: 8px;

  background-color: #6e6e6e36;
  border-radius: 15px;
  color: #6e6e6e;
  font-size: 12px;
  cursor: default;

  transition: color 0.2s ease-in-out;
}

.article__meta time:hover {
  color: #070707;
}

.article__tags {
  display: flex;
  align-items: center;
  padding: 8px;

  background-color: #6e6e6e36;
  border-radius: 15px;
}

.article__tags span {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #6e6e6e;
  cursor: default;
}

.article__tags .tag {
  text-decoration: none;
  color: #525252;
  font-size: 12px;
  font-weight: 600;

  transition: color 0.2s ease-in-out;
}

.article__tags .tag.tag--sub {
  font-size: 10px;
  margin-top: auto;
  color: #868686;
}

.article__tags .tag:hover {
  text-decoration: underline;
  color: #070707;
}

.article__content {
  max-width: 800px;
  margin: 40px auto 60px;
  padding: 0 20px;
  box-sizing: border-box;

  color: #333333;
  font-size: 17px;
  line-height: 1.8;
  letter-spacing: 0.05em;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "WenQuanYi Micro Hei";

  word-wrap: break-word;
  overflow-wrap: break-word;
}

.article__content p {
  margin-top: 0;
  margin-bottom: 1.5em;
  text-align: justify;
}

.article__content p:last-child {
  margin-bottom: 0;
}

.article__content h2,
.article__content h3,
.article__content h4 {
  color: #222;
  margin-top: 2em;
  margin-bottom: 1em;
  line-height: 1.4;
}

.article__content h2 {
  font-size: 1.8rem;
}
.article__content h3 {
  font-size: 1.5rem;
}
.article__content h4 {
  font-size: 1.2rem;
}

.article__content a {
  color: #c44569;
  text-decoration: none;
  border-bottom: 1px solid #c4456955;
  transition: border-bottom 0.3s ease;
}

.article__content a:hover {
  border-bottom: 1px solid #c44569;
}

.article__content blockquote {
  margin: 2em 0;
  padding: 0.5em 1.5em;
  border-left: 4px solid #c44569;
  background-color: #f8f8f8;
  color: #666;
}

.article__content ul,
.article__content ol {
  margin-bottom: 1.5em;
  padding-left: 1.8em;
}

.article-header__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(120deg, #ececec, #f9f9f9);
  color: #8f8f8f;
  font-weight: 600;
}

.article__error {
  color: #c0392b;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 10px 12px;
  border-radius: 8px;
}

.article__content :deep(img) {
  max-width: 100%; /* 限制在容器内 */
  height: auto; /* 按比例缩放 */
  display: block;
  margin: 18px auto; /* 可选：上下留白并居中 */
  object-fit: contain;
}
</style>
