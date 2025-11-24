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
  gap: 12px;
  padding: 10px 16px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.08);
}

/* 顶层标签特殊样式：略微更突出，配合主页面的色系 */
.tag-item--top {
  background-color: #f9fafb;
  border-left: 4px solid #a78061;
  padding: 14px 18px;
}

/* 基础信息区域 */
.tag-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.tag-name {
  font-size: clamp(0.95rem, 2.5vw, 1.05rem);
  font-weight: 600;
  color: #1f2937;
  word-break: break-all;
}

.tag-item--top .tag-name {
  font-size: clamp(1rem, 2.8vw, 1.15rem);
}

.tag-count {
  font-size: 0.8rem;
  color: #6b7280;
  background-color: #e5e7eb;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

/* 操作按钮区域 */
.tag-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  color: #ffffff;
  white-space: nowrap;
}

.action-btn:active {
  transform: scale(0.98);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.06) inset;
}

/* 不同动作的颜色 */
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

/* 编辑态输入框 */
.edit-tag-input {
  flex-grow: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  outline: none;
  min-width: 0;
}
.edit-tag-input:focus {
  border-color: #a78061;
  box-shadow: 0 0 0 3px rgba(167, 128, 97, 0.18);
}

/* ========= 小屏适配 ========= */
@media (max-width: 600px) {
  .tag-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 12px;
    gap: 8px;
  }

  .tag-item--top {
    padding: 12px 12px;
  }

  .tag-info {
    width: 100%;
    justify-content: space-between;
    gap: 6px;
  }

  .tag-name {
    font-size: 0.95rem;
  }

  .tag-actions {
    width: 100%;
    justify-content: flex-start; /* 不再靠右挤成一团 */
    flex-wrap: wrap;
    gap: 6px;
  }

  .action-btn {
    flex: 0 0 auto; /* 不再拉伸占满整行 */
    padding: 4px 10px; /* 缩小高度 */
    font-size: 0.8rem;
  }

  /* 小屏按钮改成“线框 + 文字色”，不再是大块纯色 */
  .edit-btn,
  .save-btn {
    background-color: transparent;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }

  .delete-btn {
    background-color: transparent;
    color: #ef4444;
    border: 1px solid #fecaca;
  }

  .cancel-btn {
    background-color: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  .action-btn:active {
    transform: scale(0.97);
    box-shadow: none;
  }
}

/* 超小屏进一步收紧 */
@media (max-width: 480px) {
  .tag-item {
    padding: 8px 10px;
  }

  .tag-name {
    font-size: 0.9rem;
  }

  .tag-count {
    display: none; /* 如果觉得挤，可以在最小屏隐藏篇数；不想隐藏可以删掉这段 */
  }
}
</style>
