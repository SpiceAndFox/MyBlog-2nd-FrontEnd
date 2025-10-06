<script setup>
import { onBeforeUnmount, ref, computed } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import EditorToolBar from "@/components/Admin/EditorToolBar.vue";
import CustomSelect from "@/components/CustomSelect.vue";

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

// 在组件卸载前销毁编辑器实例，防止内存泄漏
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
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
