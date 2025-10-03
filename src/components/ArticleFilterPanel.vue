<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import MonthPicker from "./MonthPicker.vue";

// 模拟数据
const topTags = ref(["科技", "生活"]);
const subTags = ref({
  科技: ["Vue", "Cpp", "ML"],
  生活: ["旅行", "杂项", "动画", "Book", "电影", "音乐"],
});

// active数据
const selectedTopTag = ref("");
const selectedSubTag = ref("");
const selectedYear = ref(null);
const selectedMonth = ref(-1);

// 从URL初始化筛选状态
const route = useRoute();
onMounted(() => {
  selectedTopTag.value = route.query.topTag || "";
  selectedSubTag.value = route.query.subTag || "";
  selectedYear.value = parseInt(route.query.year) || null;
  selectedMonth.value = parseInt(route.query.month) || -1;
});

// Tag触发函数
function toggleTopTag(topTag) {
  if (!selectedTopTag.value) {
    selectedTopTag.value = topTag;
  } else if (selectedTopTag.value != topTag) {
    selectedTopTag.value = topTag;
    selectedSubTag.value = "";
  } else {
    selectedTopTag.value = "";
    selectedSubTag.value = "";
  }
}

function toggleSubTag(subTag) {
  if (!selectedSubTag.value) {
    selectedSubTag.value = subTag;
  } else if (selectedSubTag.value != subTag) {
    selectedSubTag.value = subTag;
  } else selectedSubTag.value = "";
}

// 动态生成tag对应的链接
// todo
// https://gemini.google.com/u/2/app/9b02ac4e8f74fc23
function getTagLink(tagType, tagValue) {
  const params = new URLSearchParams(window.location.search);

  if (tagType === "topTag") {
    if (params.get("topTag") === tagValue) {
      // 如果当前已经选中，则点击取消
      params.delete("topTag");
      params.delete("subTag"); // 取消主标签时，二级标签也应取消
    } else {
      params.set("topTag", tagValue);
      params.delete("subTag"); // 切换主标签时，清空二级标签
    }
  } else if (tagType === "subTag") {
    if (params.get("subTag") === tagValue) {
      // 如果当前已经选中，则点击取消
      params.delete("subTag");
    } else {
      params.set("subTag", tagValue);
    }
  }

  const queryString = params.toString();
  return queryString ? `/articles?${queryString}` : "/articles";
}

// 定义emit事件
const emit = defineEmits(["filter-change"]);
watch(
  [selectedTopTag, selectedSubTag, selectedYear, selectedMonth],
  ([newTopTag, newSubTag, newYear, newMonth]) => {
    emit("filter-change", {
      topTag: newTopTag,
      subTag: newSubTag,
      year: newYear,
      month: newMonth,
    });
  },
  { deep: true }
);
</script>

<template>
  <aside class="article-filter-panel">
    <form @submit.prevent>
      <section class="filter-section">
        <div class="article-search-bar">
          <label for="article-search-input" class="visually-hidden">搜索文章</label>
          <input type="search" placeholder="搜索文章..." id="article-search-input" class="article-search-bar__input" />
          <button type="submit" class="article-search-bar__button">Search</button>
        </div>
      </section>

      <!-- 文章主标签 -->
      <section class="filter-section">
        <div class="filter-section__header">
          <h3>主标签</h3>
          <a href="/tags/article/toptag">更多标签</a>
        </div>
        <div class="tag-list">
          <a
            class="tag-list__tag"
            v-for="topTag in topTags"
            :href="getTagLink('topTag', topTag)"
            :key="topTag"
            @click.prevent="toggleTopTag(topTag)"
            :class="{ 'is-active': selectedTopTag === topTag }"
          >
            {{ topTag }}
          </a>
        </div>
      </section>

      <!-- subtag需要在选择toptag后出现 -->
      <transition name="subtag-fade">
        <section class="filter-section" v-if="selectedTopTag">
          <div class="filter-section__header">
            <h3>二级标签</h3>
            <a href="/tags/article/subtag">更多标签</a>
          </div>
          <div class="tag-list">
            <a
              class="tag-list__tag"
              v-for="subTag in subTags[selectedTopTag]"
              :href="getTagLink('subTag', subTag)"
              :key="subTag"
              @click.prevent="toggleSubTag(subTag)"
              :class="{ 'is-active': selectedSubTag === subTag }"
            >
              {{ subTag }}
            </a>
          </div>
        </section>
      </transition>

      <section class="filter-section">
        <div class="time-filter-container">
          <MonthPicker
            v-model:selectedYear="selectedYear"
            v-model:selectedMonth="selectedMonth"
            :selected-sub-tag="selectedSubTag"
            :selected-top-tag="selectedTopTag"
          ></MonthPicker>
        </div>
      </section>
    </form>
  </aside>
</template>

<style scoped>
.article-filter-panel {
  --panel-bg: rgba(255, 255, 255, 0.75);
  --panel-border-color: rgba(229, 231, 235, 1);
  --primary-text-color: #1f2937;
  --secondary-text-color: #6b7280;
  --accent-color: #3b82f6;
  --accent-color-dark: #2563eb;
  --accent-text-color: #ffffff;
  --base-radius: 8px;
  --tag-bg: #f3f4f6;
  --tag-hover-bg: #e5e7eb;
}

/* --- 面板主容器 --- */
.article-filter-panel {
  background-color: var(--panel-bg);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--panel-border-color);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  max-height: 600px;
  width: 100%;
  box-sizing: border-box;
  z-index: 1;
}

.article-filter-panel form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* --- 筛选区块 --- */
.filter-section {
  width: 100%;
}

.filter-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-section__header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-text-color);
}

.filter-section__header a {
  font-size: 0.8rem;
  color: var(--secondary-text-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

.filter-section__header a:hover {
  color: var(--accent-color);
}

/* --- 搜索框 --- */
.article-search-bar {
  display: flex;
  width: 100%;
}

.article-search-bar__input {
  min-width: 0;
  flex-grow: 1;
  border: 1px solid var(--panel-border-color);
  padding: 8px 12px;
  border-radius: var(--base-radius) 0 0 var(--base-radius);
  background-color: #fff;
  font-size: 0.9rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.article-search-bar__input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  z-index: 1;
}

.article-search-bar__button {
  border: none;
  background-color: var(--accent-color);
  color: var(--accent-text-color);
  padding: 8px 16px;
  border-radius: 0 var(--base-radius) var(--base-radius) 0;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.article-search-bar__button:hover {
  background-color: var(--accent-color-dark);
}

/* --- 标签列表 --- */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list__tag {
  text-decoration: none;
  background-color: var(--tag-bg);
  color: var(--secondary-text-color);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  align-items: center;
}

.tag-list__tag:hover {
  background-color: var(--tag-hover-bg);
  color: var(--primary-text-color);
}

.tag-list__tag.is-active {
  background-color: var(--accent-color);
  color: var(--accent-text-color);
  text-shadow: 0 0 1px currentColor;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* subTag的平滑出现 */

.subtag-fade-enter-from,
.subtag-fade-leave-to {
  opacity: 0;
  scale: 0.95;
  transform: translateY(-5px);
}

.subtag-fade-enter-active {
  transition: all 0.2s ease-in;
}

.subtag-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 辅助样式 */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 1200px) {
  .article-filter-panel {
    max-width: 100%;
    margin-bottom: 10px;
  }
}
</style>
