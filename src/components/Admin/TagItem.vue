<script setup>
import { ref } from "vue";

const props = defineProps({
  tag: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    default: "sub",
  },
});

const emit = defineEmits(["update", "delete"]);

const isEditing = ref(false);
const editedName = ref(props.tag.name);

const startEditing = () => {
  editedName.value = props.tag.name; // 同步初始值
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const handleUpdate = () => {
  if (!editedName.value.trim()) {
    alert("标签名称不能为空");
    return;
  }
  // 向上层发出更新事件，并附带更新后的标签数据
  emit("update", { ...props.tag, name: editedName.value.trim() });
  isEditing.value = false;
};

const handleDelete = () => {
  emit("delete", props.tag);
};
</script>

<template>
  <div class="tag-item" :class="`tag-item--${type}`">
    <template v-if="isEditing">
      <input
        type="text"
        v-model="editedName"
        class="edit-tag-input"
        @keyup.enter="handleUpdate"
        @keyup.esc="cancelEdit"
      />
      <div class="tag-actions">
        <button @click="handleUpdate" class="action-btn save-btn">保存</button>
        <button @click="cancelEdit" class="action-btn cancel-btn">取消</button>
      </div>
    </template>

    <template v-else>
      <div class="tag-info">
        <span class="tag-name">{{ tag.name }}</span>
        <span v-if="type === 'sub'" class="tag-count">{{ tag.articleCount }} 篇文章</span>
      </div>
      <div class="tag-actions">
        <button @click="startEditing" class="action-btn edit-btn">修改</button>
        <button @click="handleDelete" class="action-btn delete-btn">删除</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 10px rgba(0, 0, 0, 0.07);
}

/* 顶层标签的特殊样式 */
.tag-item--top {
  background-color: #f3f4f6;
  padding: 15px 20px;
  border-left: 4px solid #a78061;
}

.tag-info {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.tag-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.tag-item--top .tag-name {
  font-size: 1.25rem;
}

.tag-count {
  font-size: 0.9rem;
  color: #6b7280;
  background-color: #e5e7eb;
  padding: 3px 10px;
  border-radius: 12px;
}

.tag-actions {
  display: flex;
  gap: 10px;
}
.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  color: white;
}
.edit-btn,
.save-btn {
  background-color: #3b82f6;
}
.edit-btn:hover,
.save-btn:hover {
  background-color: #2563eb;
}
.delete-btn {
  background-color: #ef4444;
}
.delete-btn:hover {
  background-color: #dc2626;
}
.cancel-btn {
  background-color: #6b7280;
}
.cancel-btn:hover {
  background-color: #4b5563;
}

.edit-tag-input {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #a78061;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  outline: none;
}
</style>
