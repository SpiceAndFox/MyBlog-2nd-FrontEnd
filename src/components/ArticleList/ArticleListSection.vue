<script setup>
import ArticleCard from "@/components/ArticleList/ArticleCard.vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { ref, watch } from "vue";

const props = defineProps({
  title: {
    type: String,
  },
  articles: {
    type: Array,
    required: true,
  },
  search: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update"]);

const searchInput = ref(props.search || "");
watch(
  () => props.search,
  (val) => {
    if ((val || "") !== searchInput.value) searchInput.value = val || "";
  }
);

const handleSearchSubmit = () => {
  emit("update", { type: "search", value: searchInput.value.trim() });
};
</script>

<template>
  <section class="article-list-section">
    <div class="article-list-header">
      <h2 class="article-list__title">{{ title }}</h2>
      <form class="article-list__search" id="article-list__search" @submit.prevent="handleSearchSubmit">
        <button type="submit">Search</button>
        <input
          v-model="searchInput"
          type="search"
          placeholder="搜索文章..."
          aria-label="搜索文章"
          id="article-search-input"
        />
      </form>
    </div>
    <ul class="article-list" v-auto-animate>
      <li class="article-list__item" v-for="article in articles" :key="article.id">
        <ArticleCard :article="article" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.article-list-section {
  max-width: 9999px;
  min-width: 300px;
  min-height: 200px;
  width: 100%;
  background-color: #ffffffb9;
  padding: 20px 20px;
  backdrop-filter: blur(8px);

  box-sizing: border-box;
  border-radius: 15px;

  container-type: inline-size;
  container-name: article-list-section;
  z-index: 1;
}

.article-list-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.article-list__title {
  padding-left: 12px;
  margin: 0;
  margin-bottom: 10px;
  margin-top: 5px;

  font-size: 1.5rem;
  color: rgb(108, 108, 108);
  cursor: default;
  transition: color 0.4s ease;
}

.article-list__title:hover {
  color: #3f3f3f;
}

/* search 区域样式 */
.article-list__search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  margin: 0;
}

.article-list__search button {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;

  font-size: 0.9rem;
  font-weight: 600;
  color: #5b5b5b;

  padding: 6px 8px;
  border-radius: 10px;

  transition: background 0.2s ease, color 0.2s ease, transform 0.1s ease;
}

.article-list__search button:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #3f3f3f;
}

.article-list__search button:active {
  transform: translateY(1px);
}

.article-list__search input {
  width: 160px;
  max-width: 30cqi; /* 配合 container query，随容器缩放 */
  padding: 6px 2px;

  border: none;
  border-bottom: 2px solid rgba(60, 60, 60, 0.28);
  background: transparent;

  outline: none;
  color: #3f3f3f;
  font-size: 0.95rem;

  transition: border-bottom-color 0.22s ease, box-shadow 0.22s ease;
}

.article-list__search input:focus {
  border-bottom-color: rgba(60, 60, 60, 0.75);
  box-shadow: 0 8px 18px -16px rgba(0, 0, 0, 0.55);
}

/* 键盘可访问性：tab 到按钮时也给个轻提示 */
.article-list__search button:focus-visible {
  outline: 2px solid rgba(60, 60, 60, 0.35);
  outline-offset: 2px;
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
  width: 100%;
}

/* 移动端适配 */
@media (max-width: 1200px) {
  .article-list-section {
    width: 80%;
  }
}

@media (max-width: 900px) {
  .article-list-section {
    width: 85%;
  }
  .article-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container article-list-section (max-width: 425px) {
  .article-list {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .article-list__search {
    gap: 8px;
    padding: 4px 8px;
  }

  .article-list__search input {
    width: 120px;
  }
}
</style>
