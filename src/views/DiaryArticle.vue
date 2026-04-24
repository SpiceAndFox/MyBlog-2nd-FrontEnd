<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getDiaryById } from "@/api/articles";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import diaryBackgroundUrl from "@/assets/images/diary-background.jpg";

const route = useRoute();
const rawDiaryId = computed(() => route.params.id);
const diaryId = computed(() => {
  const raw = rawDiaryId.value;
  return raw != null ? String(raw).trim() : "";
});

const loading = ref(false);
const errorMessage = ref("");

const diaryData = ref({
  id: "",
  title: "",
  author: "",
  date: "",
  content: "",
});

async function fetchDiary() {
  if (!diaryId.value) {
    errorMessage.value = "缺少日记ID";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await getDiaryById(diaryId.value);
    diaryData.value = {
      id: data.id,
      title: data.title || "",
      author: data.author || "",
      date: data.published_at ? data.published_at.slice(0, 10) : "",
      content: data.content || "",
    };
  } catch (err) {
    errorMessage.value = err.message || "日记加载失败";
  } finally {
    loading.value = false;
  }
}

watch(diaryId, () => {
  fetchDiary();
});

onMounted(() => {
  fetchDiary();
});
</script>

<template>
  <article class="diary-container">
    <header class="diary-header" :style="{ '--diary-image': `url(${diaryBackgroundUrl})` }">
      <div class="diary-header__inner">
        <RouterLink class="back-link" to="/diaries">返回日记</RouterLink>
        <h1 class="diary-title">{{ diaryData.title || "日记加载中..." }}</h1>
        <div class="diary-meta">
          <span v-if="diaryData.author">{{ diaryData.author }}</span>
          <time v-if="diaryData.date" :datetime="diaryData.date">{{ diaryData.date }}</time>
        </div>
      </div>
    </header>

    <main class="diary-content">
      <p v-if="errorMessage" class="diary-error">{{ errorMessage }}</p>
      <p v-else-if="!diaryData.content">内容加载中...</p>
      <div v-else v-html="diaryData.content"></div>
    </main>
  </article>

  <LoadingOverlay :show="loading" />
</template>

<style scoped>
.diary-container {
  width: 100%;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f8fbf9, #f1f5f7);
  color: #26303b;
}

.diary-header {
  padding: 108px 20px 58px;
  background-image:
    linear-gradient(135deg, rgba(28, 42, 54, 0.84), rgba(71, 104, 96, 0.62)),
    var(--diary-image);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  color: #ffffff;
}

.diary-header__inner {
  max-width: 860px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  text-decoration: none;
}

.back-link:hover {
  color: #ffffff;
}

.diary-title {
  margin: 0;
  font-size: 3rem;
  line-height: 1.16;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.diary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 14px;
}

.diary-content {
  max-width: 820px;
  margin: 42px auto 72px;
  padding: 0 20px;
  color: #333333;
  font-size: 17px;
  line-height: 1.82;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.diary-error {
  color: #c0392b;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 10px 12px;
  border-radius: 8px;
}

.diary-content :deep(p) {
  margin-top: 0;
  margin-bottom: 1.5em;
  text-align: justify;
}

.diary-content :deep(h1),
.diary-content :deep(h2),
.diary-content :deep(h3) {
  color: #222;
  margin-top: 2em;
  margin-bottom: 1em;
  line-height: 1.4;
}

.diary-content :deep(blockquote) {
  margin: 2em 0;
  padding: 0.5em 1.5em;
  border-left: 4px solid #6ea37e;
  background-color: #f8f8f8;
  color: #666;
}

.diary-content :deep(pre) {
  overflow-x: auto;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  background: #1f2937;
  color: #f9fafb;
}

.diary-content :deep(img) {
  max-width: 100%;
  max-height: 300px;
  height: auto;
  display: block;
  margin: 18px auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .diary-header {
    padding: 88px 16px 46px;
  }

  .diary-title {
    font-size: 2rem;
  }

  .diary-content {
    margin-top: 30px;
    font-size: 16px;
  }
}
</style>
