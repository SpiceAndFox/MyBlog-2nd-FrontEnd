<script setup>
import { onBeforeUnmount, ref, computed } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import EditorToolBar from "@/components/Admin/EditorToolBar.vue";
import CustomSelect from "@/components/CustomSelect.vue";

// 文章头图
const headImgFile = ref(null);
const headImgPreviewUrl = ref(""); // 用于本地预览的临时 URL（注意：这不是 headImgUrl，只是前端预览用）

// 头图选择变化
const onHeadImgChange = (event) => {
  const target = event.target;
  const file = target.files?.[0];

  // 清理旧预览 URL
  if (headImgPreviewUrl.value) {
    URL.revokeObjectURL(headImgPreviewUrl.value);
    headImgPreviewUrl.value = "";
  }

  if (!file) {
    headImgFile.value = null;
    return;
  }

  headImgFile.value = file;
  // 生成本地预览 URL
  headImgPreviewUrl.value = URL.createObjectURL(file);
};

// 初始化编辑器
const editor = useEditor({
  content: `
    <h2>你好，Tiptap!</h2>
    <p>这是一个基础的 Tiptap 编辑器实现，你可以开始在这里撰写你的文章了。</p>
    <ul>
      <li>这是一个列表项。</li>
    </ul>
  `,
  extensions: [StarterKit, Image],
});

// 在组件卸载前销毁编辑器实例、预览头图Url，防止内存泄漏
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }

  if (headImgPreviewUrl.value) {
    URL.revokeObjectURL(headImgPreviewUrl.value);
  }
});

// 模拟数据
const tags = ref({
  topTags: ["默认", "科技", "生活"],
  subTags: { 科技: ["Vue", "Cpp", "ML", "Js", "Python", "C", "Win32", "Qt", "RUST", "Linux"], 生活: ["旅行", "杂项"] },
});

// 定义tag
const selectedTopTag = ref("");
const selectedSubTags = ref([]);
const topTagList = computed(() => tags.value.topTags);
const subTagList = computed(() => tags.value.subTags[selectedTopTag.value]);

// subTag点击函数
const toggleSubTag = (tag) => {
  if (selectedSubTags.value.includes(tag)) {
    selectedSubTags.value = selectedSubTags.value.filter((t) => t !== tag);
  } else {
    selectedSubTags.value.push(tag);
  }
};
</script>

<template>
  <div class="article-editor">
    <div class="article-editor__main">
      <EditorToolBar v-if="editor" :editor="editor" />
      <EditorContent :editor="editor" class="article-editor__content" />
    </div>

    <!-- 头图上传区域-->
    <div class="article-editor__cover">
      <label class="field-label">文章头图</label>
      <div class="cover-input-row">
        <label class="cover-upload-btn">
          <input type="file" accept="image/*" class="cover-file-input" @change="onHeadImgChange" />
          <span class="cover-upload-icon">📁</span>
          <span>选择头图</span>
        </label>
      </div>
      <div class="cover-preview">
        <div
          class="cover-preview__image-wrapper"
          :class="{ 'cover-preview__image-wrapper--empty': !headImgPreviewUrl }"
        >
          <img v-if="headImgPreviewUrl" :src="headImgPreviewUrl" alt="文章头图预览" class="cover-preview__image" />
          <div v-else class="cover-preview__placeholder">
            <span class="cover-preview__placeholder-main">请插入头图</span>
            <span class="cover-preview__placeholder-sub"> 支持选择本地图片文件 </span>
          </div>
        </div>
      </div>
    </div>

    <div class="article-editor__tags">
      <!-- 一级标签选择 -->
      <div class="tag-field">
        <label for="top-tag">主标签</label>
        <CustomSelect
          v-model="selectedTopTag"
          :options="topTagList"
          placeholder="默认"
          customClass="top-tag-select"
        ></CustomSelect>
      </div>

      <!-- 二级标签选择 -->
      <div class="tag-field" v-if="selectedTopTag">
        <label for="sub-tags">副标签</label>
        <ul class="sub-tags">
          <li v-for="subTag in subTagList" :key="subTag">
            <button class="sub-tag" :class="{ active: selectedSubTags.includes(subTag) }" @click="toggleSubTag(subTag)">
              {{ subTag }}
            </button>
          </li>
          <li key="add-sub-tag">
            <button class="sub-tag">+</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="submit-wrapper">
      <button class="article-editor__submit">提交</button>
      <button class="article-editor__save">存草稿</button>
    </div>
  </div>
</template>

<style>
.article-editor {
  display: flex;
  flex-direction: column;
  max-width: 750px;
  width: 85%;
  margin: 40px auto;
  gap: 30px;
  margin-bottom: 120px;
}

.article-editor__main {
  display: flex;
  flex-direction: column;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.article-editor__content {
  padding: 20px;
  overflow-y: auto;
  min-height: 400px;
}

/* 头图 */
.article-editor__cover {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-editor__cover .field-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.cover-input-row {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.cover-file-input {
  display: none;
}

.cover-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, transform 0.1s;
}

.cover-upload-btn:hover {
  background-color: #f3f4f6;
}

.cover-upload-btn:active {
  transform: scale(0.97);
}

.cover-upload-icon {
  font-size: 1rem;
  line-height: 1;
}

.cover-preview {
  margin-top: 8px;
}

.cover-preview__image-wrapper {
  border-radius: 8px;
  border: 1px dashed #d1d5db;
  background-color: #f3f4f6;
  width: 100%;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-preview__image-wrapper--empty {
  background-color: #f9fafb;
}

.cover-preview__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-preview__placeholder {
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cover-preview__placeholder-main {
  font-weight: 500;
}

.cover-preview__placeholder-sub {
  font-size: 0.75rem;
}

/* tag样式 */
.article-editor__tags {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 15px;
  border-radius: 10px;
  gap: 20px;
}

.tag-field {
  display: flex;
}

.tag-field label {
  display: inline-block;
  white-space: nowrap;
  font-size: 1rem;
  margin-right: 12px;
  margin-left: 5px;
  width: 50px;
  height: 32px;
  line-height: 32px;
}

.sub-tags {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  padding-inline-start: 0;
  gap: 10px;
  margin: 0;
}

.sub-tags li {
  list-style: none;
}

.sub-tag {
  background-color: #f3f4f6;
  border: 1px solid #d2d4d7;
  border-radius: 9999px;
  padding: 4px 14px;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sub-tag:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
  color: #111827;
}

.sub-tag.active {
  background-color: #4574da;
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.sub-tag:active {
  transform: scale(0.96);
}

/* 提交文章 */
.submit-wrapper {
  display: flex;
  width: 100%;
  justify-content: start;
  gap: 25px;
}

.submit-wrapper button {
  padding: 8px 10px;
  border-radius: 999px;
  border-color: transparent;
  background-color: #a78061;
  color: #ebebeb;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 3px;
  text-indent: 3px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, scale 0.1s ease-in-out;
}

.submit-wrapper button:hover {
  background-color: #8a6649;
  color: #f3f3f3;
}

.submit-wrapper button:active {
  background-color: #7d593c;
  scale: 1.02;
}

.submit-wrapper .article-editor__save {
  background-color: transparent;
  color: #111827;
  border-color: #a78061;
}

.submit-wrapper .article-editor__save:hover {
  background-color: #d8bfad;
}

/* Tiptap 默认的 prose 样式 (基础排版) */
.ProseMirror {
  min-height: 100%;
}

.ProseMirror:focus {
  outline: none;
}

.ProseMirror h1,
.ProseMirror h2,
.ProseMirror h3 {
  margin-top: 0.5em;
}

.ProseMirror p {
  margin-bottom: 1em;
  line-height: 1.6;
}

.ProseMirror ul,
.ProseMirror ol {
  margin-left: 1.5rem;
  margin-bottom: 1em;
}

.ProseMirror li > p {
  margin-bottom: 0.25em;
}

.ProseMirror blockquote {
  border-left: 3px solid #d1d5db;
  margin-left: 1rem;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
}

.ProseMirror pre {
  background: #1f2937;
  color: #f9fafb;
  font-family: "JetBrains Mono", monospace;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1em;
}

.ProseMirror code {
  background-color: transparent;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

.ProseMirror img {
  max-width: 90%;
  max-height: 250px;
  display: block;
  margin: 1rem auto;
}
</style>
