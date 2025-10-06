<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import ArticleCardAdmin from "@/components/Admin/ArticleCardAdmin.vue";

// 模拟文章数据
import img1 from "@/assets/images/articleThumb/1.png";
import img2 from "@/assets/images/articleThumb/2.jfif";
import img3 from "@/assets/images/articleThumb/3.jpg";
import img4 from "@/assets/images/articleThumb/4.jfif";
import img5 from "@/assets/images/articleThumb/5.jfif";
const allArticles = ref([
  {
    id: 1,
    title: "停下来，听听身边的风声",
    thumbnail: img1,
    publishDate: "2025-09-29",
    topTag: "生活",
    subTags: ["杂项"],
    status: "published",
  },
  {
    id: 2,
    title: "文章2：C++ 从入门到放弃的那些事",
    thumbnail: img2,
    publishDate: "2025-09-28",
    topTag: "科技",
    subTags: ["Cpp"],
    status: "published",
  },
  {
    id: 3,
    title: "Vue进阶技巧与最佳实践探索与发现",
    thumbnail: img3,
    publishDate: "2025-09-27",
    topTag: "科技",
    subTags: ["Vue", "Js"],
    status: "draft",
  },
  {
    id: 4,
    title: "一次说走就走的旅行",
    thumbnail: img4,
    publishDate: "2025-09-26",
    topTag: "生活",
    subTags: ["旅行"],
    status: "published",
  },
  {
    id: 5,
    title: "如何成为一名优秀的Linux内核开发者",
    thumbnail: img5,
    publishDate: "2025-09-25",
    topTag: "科技",
    subTags: ["Linux", "Cpp"],
    status: "published",
  },
]);

const router = useRouter();
const searchQuery = ref("");

const filteredArticles = computed(() => {
  if (!searchQuery.value) {
    return allArticles.value;
  }
  return allArticles.value.filter((article) => article.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// 这两个函数现在作为事件处理函数
const editArticle = (id) => {
  router.push(`/admin/write/${id}`);
};

const deleteArticle = (id) => {
  if (window.confirm("确定要删除这篇文章吗？此操作不可撤销。")) {
    allArticles.value = allArticles.value.filter((article) => article.id !== id);
  }
};
</script>

<template>
  <div class="article-manage-container">
    <header class="manage-header">
      <h1>文章管理</h1>
      <div class="search-wrapper">
        <input type="text" v-model="searchQuery" placeholder="搜索文章标题..." class="search-input" />
      </div>
    </header>

    <div v-if="filteredArticles.length > 0" class="article-grid">
      <ArticleCardAdmin
        v-for="article in filteredArticles"
        :key="article.id"
        :article="article"
        @edit="editArticle"
        @delete="deleteArticle"
        class="card-wrapper"
      />
    </div>

    <div v-else class="no-data-placeholder">
      <p>没有找到匹配的文章</p>
    </div>
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

@media (max-width: 768px) {
  .manage-header {
    flex-direction: column;
  }

  .search-input {
    width: 90%;
    max-width: 280px;
  }
}
</style>
