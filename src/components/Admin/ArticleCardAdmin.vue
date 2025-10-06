<script setup>
defineProps({
  article: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["edit", "delete"]);

const handleEdit = (id) => {
  emit("edit", id);
};

const handleDelete = (id) => {
  emit("delete", id);
};
</script>

<template>
  <div class="article-card">
    <div class="card-thumbnail">
      <img :src="article.thumbnail" alt="Article Thumbnail" class="thumbnail-img" />
      <div class="thumbnail-overlay"></div>
      <div class="card-actions">
        <button @click.stop="handleEdit(article.id)" class="action-btn edit-btn">修改</button>
        <button @click.stop="handleDelete(article.id)" class="action-btn delete-btn">删除</button>
      </div>
      <span class="status-badge" :class="`status--${article.status}`">
        {{ article.status === "published" ? "已发布" : "草稿" }}
      </span>
    </div>
    <div class="card-content">
      <h3 class="card-title" :title="article.title">{{ article.title }}</h3>
      <div class="card-meta">
        <div class="meta-tags">
          <span class="tag top-tag">{{ article.topTag }}</span>
          <span v-for="tag in article.subTags" :key="tag" class="tag sub-tag">{{ tag }}</span>
        </div>
        <span class="meta-date">{{ article.publishDate }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 这里粘贴之前 ArticleManage.vue 中所有关于 .article-card 及其子元素的样式 */
.article-card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 点击卡片主体也可以触发事件，但按钮部分要阻止事件冒泡 .stop */
.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
}

.card-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.article-card:hover .thumbnail-img {
  transform: scale(1.05);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.article-card:hover .thumbnail-overlay {
  opacity: 1;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.status--published {
  background-color: rgba(22, 163, 74, 0.7);
}
.status--draft {
  background-color: rgba(249, 115, 22, 0.7);
}

.card-actions {
  position: absolute;
  bottom: 15px;
  right: 15px;
  display: flex;
  gap: 10px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: 2; /* 确保按钮在遮罩层之上 */
}
.article-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: white;
  transition: background-color 0.2s ease;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.edit-btn {
  background-color: rgba(59, 130, 246, 0.7);
}
.edit-btn:hover {
  background-color: rgba(37, 99, 235, 0.9);
}

.delete-btn {
  background-color: rgba(239, 68, 68, 0.7);
}
.delete-btn:hover {
  background-color: rgba(220, 38, 38, 0.9);
}

.card-content {
  padding: 15px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44px; /* 保证两行的高度 */
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
}
.top-tag {
  background-color: #e0e7ff;
  color: #4338ca;
}
.sub-tag {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style>
