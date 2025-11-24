<script setup>
import { ref, onMounted } from "vue";
import TagItem from "@/components/Admin/TagItem.vue";
import { fetchAllTags, createTag, updateTag, deleteTag } from "@/api/tags";

// 初始化变量
const topTags = ref([]);
const loading = ref(false);
const errorMsg = ref("");

// 状态管理
const newTopTagName = ref("");
const subTagInputFor = ref(null); // 记录正在为哪个TopTag添加SubTag
const newSubTagName = ref("");

// 统一从后端拉一遍标签层级
const fetchTags = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    topTags.value = await fetchAllTags();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTags);

// 添加顶层标签
const addTopTag = async () => {
  if (!newTopTagName.value.trim()) return;

  try {
    const created = await createTag({
      name: newTopTagName.value.trim(),
      parent_id: null,
    });

    topTags.value.unshift({
      ...created,
      subTags: [],
    });

    newTopTagName.value = "";
  } catch (e) {
    console.error(e);
    alert(e.message || "创建顶层标签失败");
  }
};

// 显示为某个TopTag添加子标签的输入框
const showSubTagInput = (topTagId) => {
  subTagInputFor.value = topTagId;
  newSubTagName.value = "";
};

// 添加子标签
const addSubTag = async (parentTopTag) => {
  if (!newSubTagName.value.trim()) return;

  try {
    const created = await createTag({
      name: newSubTagName.value.trim(),
      parent_id: parentTopTag.id,
    });

    parentTopTag.subTags.push({
      ...created,
      articleCount: 0, // 后端没返回时先 0，占位
    });

    newSubTagName.value = "";
    subTagInputFor.value = null;
  } catch (e) {
    console.error(e);
    alert(e.message || "创建子标签失败");
  }
};

// 更新标签（TagItem emit 的 update）
const handleUpdateTag = async (updatedTag, parentTopTag = null) => {
  try {
    const result = await updateTag(updatedTag.id, { name: updatedTag.name });

    if (parentTopTag) {
      // 子标签
      const idx = parentTopTag.subTags.findIndex((t) => t.id === result.id);
      if (idx !== -1) {
        parentTopTag.subTags[idx] = {
          ...parentTopTag.subTags[idx],
          ...result,
        };
      }
    } else {
      // 顶层标签
      const idx = topTags.value.findIndex((t) => t.id === result.id);
      if (idx !== -1) {
        topTags.value[idx] = {
          ...topTags.value[idx],
          ...result,
        };
      }
    }
  } catch (e) {
    console.error(e);
    alert(e.message || "更新标签失败");
  }
};

// 删除标签（TagItem emit 的 delete）
const handleDeleteTag = async (tagToDelete, parentTopTag = null) => {
  if (!window.confirm(`确定要删除标签 "${tagToDelete.name}" 吗？`)) return;

  try {
    await deleteTag(tagToDelete.id);

    if (parentTopTag) {
      parentTopTag.subTags = parentTopTag.subTags.filter((t) => t.id !== tagToDelete.id);
    } else {
      topTags.value = topTags.value.filter((t) => t.id !== tagToDelete.id);
    }
  } catch (e) {
    console.error(e);
    alert(e.message || "删除标签失败");
  }
};
</script>

<template>
  <div class="tag-manage-container">
    <header class="manage-header">
      <h1>文章标签管理</h1>
    </header>

    <p v-if="loading">标签加载中...</p>
    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

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
            <div class="add-sub-tag-btn-wrapper">
              <button type="submit" class="add-sub-tag-button">添加</button>
              <button type="button" class="cancel-sub-tag-button" @click="subTagInputFor = null">取消</button>
            </div>
          </form>
          <button v-else @click="showSubTagInput(topTag.id)" class="show-add-sub-tag-btn">+ 添加子标签</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag-manage-container {
  width: 100%;
  max-width: 900px;
  margin: 32px auto 96px;
  padding: 0 16px;
  box-sizing: border-box;
}

.manage-header h1 {
  color: #1f2937;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 700;
  margin-bottom: 20px;
}

/* 顶层标签表单 */
.add-tag-form {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  align-items: stretch;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.add-tag-input {
  flex-grow: 1;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 0.95rem;
}
.add-tag-input:focus {
  outline: none;
  border-color: #a78061;
  box-shadow: 0 0 0 3px rgba(167, 128, 97, 0.2);
}

.add-tag-button {
  padding: 0 20px;
  min-width: 120px;
  border: none;
  border-radius: 8px;
  background-color: #a78061;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.add-tag-button:hover {
  background-color: #8e6b50;
}
.add-tag-button:active {
  transform: scale(0.98);
}

/* 标签组列表 */
.tag-groups-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tag-group {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

/* 子标签列表 */
.sub-tags-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-left: 18px;
  border-left: 2px solid #f3f4f6;
}

/* 子标签添加区域 */
.add-sub-tag-wrapper {
  margin-top: 14px;
  padding-left: 18px;
}

.show-add-sub-tag-btn {
  border: none;
  background: none;
  color: #a78061;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}
.show-add-sub-tag-btn:hover {
  background-color: #fdfaf7;
}

.add-sub-tag-form {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.add-sub-tag-input {
  flex-grow: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 0;
}
.add-sub-tag-input:focus {
  outline: none;
  border-color: #a78061;
}

.add-sub-tag-btn-wrapper {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.add-sub-tag-button,
.cancel-sub-tag-button {
  border: 1px solid transparent;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  line-height: 1.2;
}

.add-sub-tag-button {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}
.add-sub-tag-button:hover {
  filter: brightness(1.05);
}

.cancel-sub-tag-button {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}
.cancel-sub-tag-button:hover {
  background-color: #e5e7eb;
}

/* 状态提示 */
.error-msg {
  color: #b91c1c;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

/* ========= 小屏适配 ========= */

@media (max-width: 600px) {
  .tag-manage-container {
    margin: 24px auto 72px;
    padding: 0 12px;
  }

  .manage-header h1 {
    text-align: center;
    margin-bottom: 18px;
  }

  .add-tag-form {
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }

  .add-tag-input {
    font-size: 0.9rem;
    padding: 10px 12px;
  }

  .add-tag-button {
    width: 100%;
    padding: 10px 0;
    min-height: 40px;
  }

  .tag-group {
    padding: 14px 12px;
  }

  .sub-tags-list {
    margin-top: 10px;
    padding-left: 12px;
    border-left-width: 1px;
  }

  .add-sub-tag-wrapper {
    padding-left: 12px; /* 保持与子标签层级对齐 */
  }

  .add-sub-tag-form {
    display: flex;
    flex-direction: column; /* 小屏保持横排 */
    align-items: start;
    gap: 8px;
    width: 100%;
  }

  .add-sub-tag-input {
    flex: 1;
    max-width: 100%; /* 防止输入框超出 */
  }

  .add-sub-tag-button,
  .cancel-sub-tag-button {
    flex-shrink: 0; /* 不让按钮被压缩 */
    white-space: nowrap; /* 不换行 */
    padding: 6px 10px; /* 模仿“修改/删除”按钮的小巧风格 */
    font-size: 0.82rem;
  }

  .show-add-sub-tag-btn {
    padding-left: 0;
  }
}

/* 超小屏再收紧一点 */
@media (max-width: 480px) {
  .tag-manage-container {
    padding: 0 10px;
  }

  .manage-header h1 {
    font-size: 1.5rem;
  }
}
</style>
