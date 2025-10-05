<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";

// 定义导航项的数据结构
const navItems = ref([
  {
    name: "articles",
    path: "/admin/articles",
    icon: "📚",
    text: "文章管理",
  },
  {
    name: "write",
    path: "/admin/write",
    icon: "✍️",
    text: "发布文章",
  },
  {
    name: "tags",
    path: "/admin/tags",
    icon: "🏷️",
    text: "标签管理",
  },
]);

// 追踪当前展开的项
const expandedItemName = ref(null);
const route = useRoute();

// 点击时，设置当前展开的项
function handleItemClick(itemName) {
  expandedItemName.value = itemName;
}

// 根据当前路由路径来更新展开项，确保刷新页面或手动改URL时状态正确
const updateExpandedItemFromRoute = (currentPath) => {
  const currentItem = navItems.value.find((item) => currentPath.startsWith(item.path));
  if (currentItem) {
    expandedItemName.value = currentItem.name;
  } else {
    expandedItemName.value = null;
  }
};

// 组件挂载时，根据当前路由初始化状态
onMounted(() => {
  updateExpandedItemFromRoute(route.path);
});

// 监听路由变化，自动更新展开项
watch(
  () => route.path,
  (newPath) => {
    updateExpandedItemFromRoute(newPath);
  }
);
</script>

<template>
  <aside class="admin-bottom-bar">
    <nav>
      <ul>
        <li v-for="item in navItems" :key="item.name">
          <router-link
            :to="item.path"
            class="nav-item"
            :class="{ 'is-expanded': expandedItemName === item.name }"
            @click="handleItemClick(item.name)"
          >
            <span class="icon">{{ item.icon }}</span>
            <span v-if="expandedItemName === item.name" class="text">{{ item.text }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.admin-bottom-bar {
  /* 固定在页面底部中心 */
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  /* * [核心改造] 灰色毛玻璃风格
   */
  background-color: rgba(255, 255, 255, 0.2); /* 关键：使用带透明度的浅色背景 */
  backdrop-filter: blur(12px); /* 关键：模糊背景 */
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.25); /* 关键：添加微妙的亮色边框，模拟玻璃边缘 */
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15); /* 柔和的阴影 */
  padding: 8px;
}

nav ul {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  min-width: 48px;
  padding: 0 16px;

  /* [改造] 修改文字和图标颜色以适应浅色背景 */
  color: #333; /* 使用深灰色文字，对比度更高 */
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;

  border-radius: 40px;
  cursor: pointer;

  transition: all 0.3s ease-in-out; /* 动画稍作调整 */
  overflow: hidden;
}

/* [改造] 悬停效果 */
.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.3); /* 悬停时变得更亮一点 */
}

/* * [改造] 激活/展开状态
 * 放弃了原来的绿色，统一为灰色系
 */
.nav-item.router-link-exact-active,
.nav-item.is-expanded {
  background-color: #ffffff; /* 使用不透明的白色作为激活背景 */
  color: #000000; /* 激活时使用纯黑色文字，最清晰 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* 给激活项一个轻微的阴影，使其“浮”起来 */
}

.icon {
  font-size: 1.5rem;
  line-height: 1;
}

.text {
  white-space: nowrap;
  margin-left: 10px;
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
