<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import writeIcon from "@/assets/images/icons/write.svg";
import articleIcon from "@/assets/images/icons/article.svg";
import tagIcon from "@/assets/images/icons/tag.svg";

// 导航项
const navItems = ref([
  { name: "articles", path: "/admin/articles", icon: articleIcon, text: "文章管理" },
  { name: "write", path: "/admin/write", icon: writeIcon, text: "发布文章" },
  { name: "tags", path: "/admin/tags", icon: tagIcon, text: "标签管理" },
]);

const expandedItemName = ref(null);
const route = useRoute();
const indicatorStyle = ref({ left: "0px", width: "0px" });

function handleItemClick(itemName) {
  expandedItemName.value = itemName;
  nextTick(updateIndicator);
}

const updateExpandedItemFromRoute = (currentPath) => {
  const currentItem = navItems.value.find((item) => currentPath.startsWith(item.path));
  expandedItemName.value = currentItem ? currentItem.name : null;
  nextTick(updateIndicator);
};

// 更新滑块位置
function updateIndicator() {
  const activeEl = document.querySelector(".nav-item.is-expanded");
  if (activeEl) {
    indicatorStyle.value = {
      left: `${activeEl.offsetLeft}px`,
      width: `${activeEl.offsetWidth}px`,
    };
  } else {
    // 如果没有激活项，则隐藏指示器
    indicatorStyle.value = { ...indicatorStyle.value, width: "0px" };
  }
}

// 监听窗口大小变化，重新计算指示器位置
const onResize = () => {
  updateIndicator();
};

onMounted(() => {
  updateExpandedItemFromRoute(route.path);
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});

watch(
  () => route.path,
  (newPath) => updateExpandedItemFromRoute(newPath)
);
</script>

<template>
  <aside class="admin-bottom-bar">
    <nav>
      <ul>
        <div class="active-indicator" :style="indicatorStyle"></div>

        <li v-for="item in navItems" :key="item.name">
          <router-link
            :to="item.path"
            class="nav-item"
            :class="{ 'is-expanded': expandedItemName === item.name }"
            @click="handleItemClick(item.name)"
          >
            <span class="icon"><img :src="item.icon" class="icon-img" /></span>
            <span v-if="expandedItemName === item.name" class="text">{{ item.text }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.admin-bottom-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  padding: 8px;
  transition: all 0.3s ease-in-out;
}

nav ul {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 滑块背景，带弹性过渡 */
.active-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: #ffffff;
  border-radius: 40px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  transition: left 0.6s cubic-bezier(0.25, 1.25, 0.5, 1), width 0.6s cubic-bezier(0.25, 1.25, 0.5, 1);
  z-index: 0;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  min-width: 48px;
  padding: 0 16px;
  color: #333;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 40px;
  cursor: pointer;
  transition: color 0.3s ease, background-color 0.3s ease;
  overflow: hidden;
  z-index: 1;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.nav-item.is-expanded {
  color: #000000;
}

/* 当滑块存在时，激活项不再有hover效果，防止颜色叠加 */
.nav-item.is-expanded:hover {
  background-color: transparent;
}

.icon-img {
  width: 24px;
  height: 24px;
  display: block;
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

/* --- 移动端适配 --- */
@media (max-width: 425px) {
  .admin-bottom-bar {
    left: 10px;
    right: 10px;
    width: auto;
    transform: translateX(0);
    bottom: 10px;
    padding: 6px;
  }

  nav ul {
    justify-content: space-around;
    width: 100%;
    gap: 4px;
  }

  .nav-item {
    height: 44px;
    min-width: 44px;
    padding: 0 12px;
    flex: 1;
  }

  .text {
    font-size: 0.9rem;
    margin-left: 6px;
  }

  .icon-img {
    width: 22px;
    height: 22px;
  }
}
</style>
