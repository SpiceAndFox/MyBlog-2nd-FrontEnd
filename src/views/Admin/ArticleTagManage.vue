<script setup>
import { ref } from "vue";
import TagItem from "@/components/Admin/TagItem.vue";

// 层级式模拟数据
const topTags = ref([
  {
    id: 101,
    name: "生活",
    subTags: [
      { id: 1, name: "旅行", articleCount: 1 },
      { id: 2, name: "杂项", articleCount: 1 },
    ],
  },
  {
    id: 102,
    name: "科技",
    subTags: [
      { id: 3, name: "Vue", articleCount: 1 },
      { id: 4, name: "Cpp", articleCount: 1 },
      { id: 5, name: "Js", articleCount: 1 },
      { id: 6, name: "Linux", articleCount: 1 },
    ],
  },
]);

// 状态管理
const newTopTagName = ref("");
const subTagInputFor = ref(null); // 记录正在为哪个TopTag添加SubTag
const newSubTagName = ref("");

// 添加顶层标签
const addTopTag = () => {
  if (!newTopTagName.value.trim()) return;
  const newId = Date.now(); // 使用时间戳确保唯一性
  topTags.value.unshift({
    id: newId,
    name: newTopTagName.value.trim(),
    subTags: [],
  });
  newTopTagName.value = "";
};

// 显示为某个TopTag添加子标签的输入框
const showSubTagInput = (topTagId) => {
  subTagInputFor.value = topTagId;
  newSubTagName.value = "";
};

// 添加子标签
const addSubTag = (parentTopTag) => {
  if (!newSubTagName.value.trim()) return;
  const newId = Date.now();
  parentTopTag.subTags.push({
    id: newId,
    name: newSubTagName.value.trim(),
    articleCount: 0,
  });
  newSubTagName.value = "";
  subTagInputFor.value = null;
};

// 更新标签（处理来自TagItem组件的事件）
const handleUpdateTag = (updatedTag, parentTopTag = null) => {
  // 如果有parentTopTag，说明更新的是子标签
  if (parentTopTag) {
    const tagIndex = parentTopTag.subTags.findIndex((t) => t.id === updatedTag.id);
    if (tagIndex !== -1) {
      parentTopTag.subTags[tagIndex] = updatedTag;
    }
  } else {
    // 否则更新的是顶层标签
    const tagIndex = topTags.value.findIndex((t) => t.id === updatedTag.id);
    if (tagIndex !== -1) {
      topTags.value[tagIndex].name = updatedTag.name;
    }
  }
};

// 删除标签（处理来自TagItem组件的事件）
const handleDeleteTag = (tagToDelete, parentTopTag = null) => {
  if (!window.confirm(`确定要删除标签 "${tagToDelete.name}" 吗？`)) return;

  if (parentTopTag) {
    parentTopTag.subTags = parentTopTag.subTags.filter((t) => t.id !== tagToDelete.id);
  } else {
    topTags.value = topTags.value.filter((t) => t.id !== tagToDelete.id);
  }
};
</script>

<template>
  <div class="tag-manage-container">
    <header class="manage-header">
      <h1>文章标签管理</h1>
    </header>

    <form @submit.prevent="addTopTag" class="add-tag-form">
      <input type="text" v-model="newTopTagName" placeholder="输入新的顶层标签..." class="add-tag-input" />
      <button type="submit" class="add-tag-button">添加顶层标签</button>
    </form>

    <div class="tag-groups-container">
      <div v-for="topTag in topTags" :key="topTag.id" class="tag-group">
        <TagItem :tag="topTag" type="top" @update="handleUpdateTag" @delete="handleDeleteTag" />

        <div class="sub-tags-list">
          <TagItem
            v-for="subTag in topTag.subTags"
            :key="subTag.id"
            :tag="subTag"
            type="sub"
            @update="handleUpdateTag($event, topTag)"
            @delete="handleDeleteTag($event, topTag)"
          />
        </div>

        <div class="add-sub-tag-wrapper">
          <form v-if="subTagInputFor === topTag.id" @submit.prevent="addSubTag(topTag)" class="add-sub-tag-form">
            <input
              type="text"
              v-model="newSubTagName"
              placeholder="输入子标签名称..."
              class="add-sub-tag-input"
              @keyup.esc="subTagInputFor = null"
            />
            <button type="submit" class="add-sub-tag-button">添加</button>
            <button type="button" class="cancel-sub-tag-button" @click="subTagInputFor = null">取消</button>
          </form>
          <button v-else @click="showSubTagInput(topTag.id)" class="show-add-sub-tag-btn">+ 添加子标签</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag-manage-container {
  width: 90%;
  max-width: 900px;
  margin: 40px auto 120px;
  padding: 0 20px;
  box-sizing: border-box;
}

.manage-header h1 {
  color: #1f2937;
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 25px;
}

.add-tag-form {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 12px;
}

.add-tag-input {
  flex-grow: 1;
  padding: 12px 18px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 1rem;
}
.add-tag-input:focus {
  outline: none;
  border-color: #a78061;
  box-shadow: 0 0 0 3px rgba(167, 128, 97, 0.2);
}

.add-tag-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: #a78061;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.add-tag-button:hover {
  background-color: #8e6b50;
}

.tag-groups-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.tag-group {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
}

.sub-tags-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid #f3f4f6;
}

.add-sub-tag-wrapper {
  margin-top: 15px;
  padding-left: 20px;
}

.show-add-sub-tag-btn {
  border: none;
  background: none;
  color: #a78061;
  font-weight: 500;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background-color 0.2s;
}
.show-add-sub-tag-btn:hover {
  background-color: #fdfaf7;
}

.add-sub-tag-form {
  display: flex;
  gap: 8px;
}
.add-sub-tag-input {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.add-sub-tag-input:focus {
  outline: none;
  border-color: #a78061;
}

.add-sub-tag-button,
.cancel-sub-tag-button {
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.add-sub-tag-button {
  background-color: #2563eb;
  color: white;
}
.cancel-sub-tag-button {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}
</style>
