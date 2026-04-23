<script setup>
import { computed, ref } from "vue";
import Navigation from "@/components/Navigation.vue";
import avatarUrl from "@/assets/images/icons/avatar.jpg";

const searchText = ref("");

const menuItems = [
  { label: "全部文章", icon: "A", active: true },
  { label: "技术文章", icon: "T" },
  { label: "动画随笔", icon: "M" },
  { label: "生活记录", icon: "L" },
  { label: "设计分享", icon: "D" },
];

const hotTags = ["Tech", "JavaScript", "Vue", "动画", "生活", "设计", "随笔", "AI"];

const archives = [
  { label: "2024年5月", count: 18 },
  { label: "2024年4月", count: 24 },
  { label: "2024年3月", count: 21 },
];

const articles = [
  {
    order: 4,
    title: "使用 Slide Generate 自动生成精美 PPT",
    summary:
      "尝试了几个月的优化迭代和 PPT 方案后，我找到了目前最满意的工作流。配合自动化，可以显著提升内容整理与演示制作效率。",
    tags: ["Tech", "工具", "效率"],
    author: "香料的小屋",
    date: "2024-05-20",
    views: "1.2k",
    variant: "",
    keywords: "slide generate 自动生成 精美 ppt tech 工具 效率",
  },
  {
    order: 3,
    title: "宫崎骏对人类的思考与爱：风之谷",
    summary:
      "这部跨越时代的作品，至今仍在不断给予我们关于自然、战争与人类未来的思考。它温柔又锋利，值得反复重温。",
    tags: ["动画", "宫崎骏", "影评"],
    author: "香料的小屋",
    date: "2024-05-15",
    views: "2.5k",
    variant: "variant-2",
    keywords: "宫崎骏 风之谷 动画 影评 爱 人类 思考",
  },
  {
    order: 2,
    title: "一种必须保持运动的生物",
    summary:
      "如果非要概括当前前进的根源，或许是因为自己同时犯了贪婪与怯懦。但反过来说，什么造就了你的坚持与节奏？",
    tags: ["生活", "思考", "成长"],
    author: "香料的小屋",
    date: "2024-05-10",
    views: "985",
    variant: "variant-3",
    keywords: "运动 生活 思考 成长 自律",
  },
  {
    order: 1,
    title: "如何优雅地使用 CSS 实现现代化布局",
    summary:
      "深入探讨 Flexbox 和 Grid 布局的最佳实践，分享一些在实际项目中总结的小技巧，让页面更清晰、稳定，也更容易维护。",
    tags: ["Tech", "CSS", "前端"],
    author: "香料的小屋",
    date: "2024-05-08",
    views: "842",
    variant: "variant-4",
    keywords: "css 布局 前端 tech flexbox grid 现代化",
  },
];

const visibleArticles = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  const result = articles.filter((article) => {
    if (!keyword) return true;
    const haystack = [
      article.title,
      article.summary,
      article.author,
      article.date,
      article.views,
      article.keywords,
      ...article.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(keyword);
  });

  return result.sort((a, b) => b.order - a.order);
});

</script>

<template>
  <div class="reference-page">
    <div class="page-shell">
      <div class="reference-app">
        <Navigation layoutClass="layout--referenceArticleList" />

        <div class="content">
          <aside class="sidebar">
            <section class="panel profile-card">
              <img class="profile-avatar" :src="avatarUrl" alt="香料的小屋" />
              <div class="profile-name">香料的小屋</div>
              <p class="profile-desc">在代码与文字间，遇见更好的自己。</p>
              <div class="stats">
                <div class="stat">
                  <div class="stat-label">文章</div>
                  <div class="stat-value">128</div>
                </div>
                <div class="stat">
                  <div class="stat-label">分类</div>
                  <div class="stat-value">12</div>
                </div>
                <div class="stat">
                  <div class="stat-label">标签</div>
                  <div class="stat-value">36</div>
                </div>
              </div>
            </section>

            <section class="panel menu-panel">
              <div class="menu-list">
                <a
                  v-for="item in menuItems"
                  :key="item.label"
                  class="menu-item"
                  :class="{ active: item.active }"
                  href="#"
                  @click.prevent
                >
                  <span class="mini-icon">{{ item.icon }}</span>
                  {{ item.label }}
                </a>
              </div>
            </section>

            <section class="panel tag-panel">
              <div class="side-title">热门标签</div>
              <div class="tags">
                <span v-for="tag in hotTags" :key="tag" class="tag">{{ tag }}</span>
              </div>
              <a class="link-more" href="#" @click.prevent>更多标签 <span>→</span></a>
            </section>

            <section class="panel archive-panel">
              <div class="side-title">归档</div>
              <div class="archive-list">
                <div v-for="archive in archives" :key="archive.label" class="archive-item">
                  <span>{{ archive.label }}</span>
                  <span>{{ archive.count }}</span>
                </div>
              </div>
              <a class="link-more" href="#" @click.prevent>更多归档 <span>→</span></a>
            </section>
          </aside>

          <main class="main panel">
            <div class="main-header">
              <div class="main-title-row">
                <div>
                  <h1 class="main-title">全部文章</h1>
                  <div class="subtext">共 128 篇文章</div>
                </div>
                <div class="main-actions">
                  <form class="article-list__search" @submit.prevent>
                    <button type="submit">Search</button>
                    <input v-model="searchText" type="search" placeholder="搜索文章..." aria-label="搜索文章" />
                  </form>
                </div>
              </div>
            </div>

            <section v-if="visibleArticles.length" class="article-list">
              <article v-for="article in visibleArticles" :key="article.title" class="article-card">
                <div class="thumb" :class="article.variant">
                  <span class="thumb-label">图片占位 / 16:9</span>
                </div>
                <div class="article-body">
                  <h2 class="article-title">{{ article.title }}</h2>
                  <p class="article-desc">{{ article.summary }}</p>
                  <div class="meta-tags">
                    <span v-for="tag in article.tags" :key="tag" class="chip">{{ tag }}</span>
                  </div>
                  <div class="meta-bottom">
                    <div class="author-row">
                      <img class="author-mini" :src="avatarUrl" alt="" aria-hidden="true" />
                      <span>{{ article.author }}</span>
                      <span>{{ article.date }}</span>
                    </div>
                    <span class="views">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      {{ article.views }}
                    </span>
                  </div>
                </div>
              </article>
            </section>

            <div v-else class="empty-state">没有找到匹配的文章，试试别的关键词。</div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reference-page {
  --panel: rgba(255, 255, 255, 0.72);
  --panel-border: rgba(15, 23, 42, 0.05);
  --text: #1f2937;
  --text-soft: #6b7280;
  --text-faint: #9ca3af;
  --green: #6ea37e;
  --green-soft: #eef5f0;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  --radius-xl: 24px;
  width: 100%;
  min-height: 100vh;
  color: var(--text);
  background: linear-gradient(180deg, #f3f4f6 0%, #f7f8fa 100%);
  font-family: Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.reference-page * {
  box-sizing: border-box;
}

.page-shell,
.reference-app {
  width: 100%;
  min-height: 100vh;
}

.page-shell {
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(12px);
}

.profile-avatar,
.author-mini {
  object-fit: cover;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.content {
  display: grid;
  grid-template-columns: 286px minmax(0, 1fr);
  gap: 18px;
  padding: 0 18px 24px;
}

.sidebar,
.main {
  min-width: 0;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
}

.sidebar .panel + .panel {
  margin-top: 14px;
}

.profile-card {
  padding: 30px 24px 24px;
  text-align: center;
}

.profile-avatar {
  width: 74px;
  height: 74px;
  margin: 0 auto 16px;
}

.profile-name {
  margin-bottom: 10px;
  font-size: 1.45rem;
  font-weight: 700;
}

.profile-desc {
  margin: 0 8px 20px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.8;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 10px;
}

.stat {
  border-right: 1px solid rgba(17, 24, 39, 0.06);
}

.stat:last-child {
  border-right: 0;
}

.stat-label {
  color: var(--text-faint);
  font-size: 12px;
}

.stat-value {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

.menu-panel,
.tag-panel,
.archive-panel {
  padding: 18px 14px;
}

.side-title {
  margin: 2px 8px 14px;
  font-size: 1rem;
  font-weight: 700;
}

.menu-list,
.archive-list {
  display: grid;
}

.menu-list {
  gap: 6px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  color: #68717c;
  text-decoration: none;
  transition: 0.2s ease;
}

.menu-item:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.7);
}

.menu-item.active {
  color: var(--green);
  background: var(--green-soft);
  font-weight: 600;
}

.mini-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 11px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 8px 6px;
}

.tag,
.chip {
  border: 1px solid rgba(17, 24, 39, 0.04);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(245, 247, 249, 0.95);
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 8px 13px;
  font-size: 13px;
}

.link-more {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: 8px;
  padding: 8px;
  color: #7a8592;
  text-decoration: none;
  font-size: 14px;
}

.archive-list {
  gap: 14px;
  padding: 0 8px 4px;
}

.archive-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #727b87;
  font-size: 15px;
}

.main-header {
  padding: 28px 28px 18px;
}

.main-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.main-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.main-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.subtext {
  margin-top: 8px;
  color: #7f8792;
  font-size: 14px;
}

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
  border-radius: 10px;
  padding: 6px 8px;
  background: transparent;
  color: #5b5b5b;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease, transform 0.1s ease;
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

.article-list__search input {
  width: 160px;
  max-width: min(30vw, 220px);
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

.article-list {
  display: grid;
  gap: 18px;
  padding: 0 18px 18px;
}

.article-card {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  align-items: center;
  gap: 26px;
  padding: 22px;
  border: 1px solid rgba(17, 24, 39, 0.05);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: var(--shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.thumb {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  background: linear-gradient(135deg, #9bc4cb, #5aa48f 40%, #2e615d 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.thumb::before,
.thumb::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  opacity: 0.9;
  filter: blur(2px);
}

.thumb::before {
  left: -20px;
  bottom: -18px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(190, 235, 197, 0.95) 0, rgba(190, 235, 197, 0) 70%);
}

.thumb::after {
  right: -18px;
  top: -18px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255, 220, 175, 0.55) 0, rgba(255, 220, 175, 0) 65%);
}

.thumb.variant-2 {
  background: linear-gradient(135deg, #233d64, #4f6aa7 40%, #ef8b5a 100%);
}

.thumb.variant-3 {
  background: linear-gradient(135deg, #5a7ccc, #8797ff 35%, #f0656d 100%);
}

.thumb.variant-4 {
  background: linear-gradient(135deg, #87a3ff, #f09e7f 45%, #6070bc 100%);
}

.thumb-label {
  position: absolute;
  left: 16px;
  bottom: 16px;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  backdrop-filter: blur(8px);
}

.article-body {
  min-width: 0;
}

.article-title {
  margin: 0 0 12px;
  font-size: 1.9rem;
  line-height: 1.35;
  font-weight: 800;
}

.article-desc {
  max-width: 88%;
  margin: 0 0 18px;
  color: #7b8490;
  font-size: 15px;
  line-height: 1.8;
}

.meta-tags,
.meta-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.chip {
  padding: 7px 11px;
  font-size: 12px;
}

.meta-bottom {
  justify-content: space-between;
  margin-top: 16px;
  color: #8b94a1;
  font-size: 14px;
  gap: 16px;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.author-mini {
  width: 22px;
  height: 22px;
}

.views {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.views svg {
  width: 16px;
  height: 16px;
  color: #98a2ae;
}

.empty-state {
  padding: 36px 24px 48px;
  text-align: center;
  color: #7b8490;
}

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }

  .article-card {
    grid-template-columns: 1fr;
  }

  .article-desc {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .main-actions {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }

  .article-list__search {
    padding: 4px 0;
  }

  .article-list__search input {
    width: 128px;
    max-width: 42vw;
  }

  .content {
    padding: 0 10px 14px;
  }

  .main-header {
    padding: 20px 18px 14px;
  }

  .main-title {
    font-size: 1.65rem;
  }

  .article-list {
    padding: 0 10px 12px;
  }

  .article-card {
    padding: 16px;
    gap: 18px;
  }

  .article-title {
    font-size: 1.4rem;
  }

  .profile-card {
    padding: 24px 18px 20px;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
