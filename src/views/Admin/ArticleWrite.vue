<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import EditorToolBar from "@/components/Admin/EditorToolBar.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import { useRoute } from "vue-router";
import { createArticle, getArticleByIdAdmin, updateArticle } from "@/api/articles";
import { fetchAllTags } from "@/api/tags";

// 文章标题
const title = ref("");

// 文章头图
const headImgFile = ref(null);
const headImgPreviewUrl = ref(""); // 用于本地预览的临时 URL（注意：这不是 headImgUrl，只是前端预览用）

// 提交状态和提示
const submitting = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

// 标签数据
const rawTags = ref([]); // 从后端拿到的层级结构
const tagsLoading = ref(false);
const tagsErrorMsg = ref("");

// 选中的标签
const selectedTopTag = ref("");
const selectedSubTags = ref([]);

// 顶层标签列表
const topTagList = computed(() => rawTags.value.map((t) => t.name));

// 文章修改部分
const route = useRoute();
const articleId = computed(() => route.params.id);
const isEditMode = computed(() => Boolean(articleId.value));
const articleLoading = ref(false);
const existingHeaderUrl = ref("");
const existingThumbUrl = ref("");
const prefillTagIds = ref([]);

// 检测文章内容图是否正在上传
const uploadingContentImage = ref(false);

// 当前选中子标签列表（名称数组）
const subTagList = computed(() => {
  const parent = rawTags.value.find((t) => t.name === selectedTopTag.value);
  if (!parent || !Array.isArray(parent.subTags)) return [];
  return parent.subTags.map((s) => s.name);
});

// 头图选择变化
const onHeadImgChange = (event) => {
  const target = event.target;
  const file = target.files?.[0];

  // 清理旧预览 URL
  if (headImgPreviewUrl.value && headImgPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(headImgPreviewUrl.value);
  }
  headImgPreviewUrl.value = "";

  if (!file) {
    headImgFile.value = null;
    return;
  }

  headImgFile.value = file;
  headImgPreviewUrl.value = URL.createObjectURL(file); // 生成本地预览 URL
};

// 初始化编辑器
const editor = useEditor({
  content: ``,
  extensions: [StarterKit, Image],
});

// 在组件卸载前销毁编辑器实例、预览头图Url，防止内存泄漏
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }

  // 防止预览撤销误操作，确保服务器URL不会被撤销
  if (headImgPreviewUrl.value && headImgPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(headImgPreviewUrl.value);
  }
  headImgPreviewUrl.value = "";
});

// 从后端获取标签
const fetchTags = async () => {
  tagsLoading.value = true;
  tagsErrorMsg.value = "";
  try {
    const data = await fetchAllTags();
    rawTags.value = data;

    if (data.length > 0 && !selectedTopTag.value) {
      selectedTopTag.value = data[0].name;
    }
  } catch (err) {
    console.error(err);
    tagsErrorMsg.value = err.message || "标签获取失败";
  } finally {
    tagsLoading.value = false;
  }
};

// 编辑模式下加载文章；与标签加载合并：
const mapTagIdsToNames = (ids) => {
  const top = rawTags.value.find((t) => ids.includes(t.id));
  if (top) selectedTopTag.value = top.name;
  const subs = [];
  rawTags.value.forEach((t) => {
    (t.subTags || []).forEach((s) => {
      if (ids.includes(s.id)) subs.push(s.name);
    });
  });
  selectedSubTags.value = subs;
};

const loadArticleIfEdit = async () => {
  if (!isEditMode.value) return;
  articleLoading.value = true;
  try {
    const article = await getArticleByIdAdmin(articleId.value);
    title.value = article.title || "";
    existingHeaderUrl.value = article.header_image_url || "";
    existingThumbUrl.value = article.thumbnail_url || "";
    headImgPreviewUrl.value = existingHeaderUrl.value || existingThumbUrl.value || "";
    prefillTagIds.value = Array.isArray(article.tag_ids) ? article.tag_ids : [];
    if (editor.value) editor.value.commands.setContent(article.content || "");
  } catch (err) {
    errorMsg.value = err.message || "加载文章失败";
  } finally {
    articleLoading.value = false;
  }
};

onMounted(async () => {
  await fetchTags();
  await loadArticleIfEdit();
  if (prefillTagIds.value.length) mapTagIdsToNames(prefillTagIds.value);
});

// 子标签选中/取消
const toggleSubTag = (tagName) => {
  if (selectedSubTags.value.includes(tagName)) {
    selectedSubTags.value = selectedSubTags.value.filter((t) => t !== tagName);
  } else {
    selectedSubTags.value.push(tagName);
  }
};

// name -> id 映射（包含顶层 + 子标签）
const tagNameToIdMap = computed(() => {
  const map = {};
  rawTags.value.forEach((top) => {
    map[top.name] = top.id;
    if (Array.isArray(top.subTags)) {
      top.subTags.forEach((sub) => {
        map[sub.name] = sub.id;
      });
    }
  });
  return map;
});

// 根据当前选择生成 tag_ids 数组
const buildTagIds = () => {
  const ids = [];
  const map = tagNameToIdMap.value;

  // 顶层标签也可以算成一个 tag
  if (selectedTopTag.value && map[selectedTopTag.value]) {
    ids.push(map[selectedTopTag.value]);
  }

  selectedSubTags.value.forEach((name) => {
    const id = map[name];
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  });

  return ids;
};

const extractTempContentImageKeys = (html) => {
  if (!html) return [];

  const keys = new Set();
  const extractFromSrc = (src) => {
    if (!src) return;
    const match = src.match(/\/uploads\/articles\/content\/tmp\/([^/?#]+)/);
    if (match?.[1]) keys.add(match[1]);
  };

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      extractFromSrc(img.getAttribute("src"));
      extractFromSrc(img.getAttribute("data-src"));
    });
  } catch {
    // Fallback：尽量从字符串里提取（避免因为解析失败导致图片永远停留在 tmp 目录）
    const regex = /\/uploads\/articles\/content\/tmp\/([^"'\s?#/]+)/g;
    let match;
    while ((match = regex.exec(html))) keys.add(match[1]);
  }

  return Array.from(keys);
};

// 提交文章：status = 'published' | 'draft'
const submitArticle = async (status) => {
  if (uploadingContentImage.value) {
    errorMsg.value = "图片上传中，请稍候再提交";
    return;
  }

  if (!editor.value) return;

  errorMsg.value = "";
  successMsg.value = "";

  if (!title.value.trim()) {
    errorMsg.value = "标题不能为空";
    return;
  }

  const contentHtml = editor.value.getHTML();
  const tempContentImageKeys = extractTempContentImageKeys(contentHtml);
  if (!contentHtml || contentHtml === "<p></p>") {
    errorMsg.value = "文章内容不能为空";
    return;
  }

  submitting.value = true;

  try {
    if (!isEditMode.value) {
      const formData = new FormData();
      formData.append("title", title.value.trim());
      formData.append("content", contentHtml);
      formData.append("status", status);
      formData.append("tag_ids", JSON.stringify(buildTagIds()));
      formData.append("content_image_keys", JSON.stringify(tempContentImageKeys));
      if (headImgFile.value) formData.append("headerImage", headImgFile.value);
      await createArticle(formData);
      successMsg.value = status === "published" ? "文章发布成功" : "草稿保存成功";

      // 发布成功后清除数据
      title.value = "";
      editor.value.commands.setContent("");
      headImgFile.value = null;
      if (headImgPreviewUrl.value && headImgPreviewUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(headImgPreviewUrl.value);
      }
      headImgPreviewUrl.value = "";
      selectedSubTags.value = [];
    } else {
      const formData = new FormData();
      formData.append("title", title.value.trim());
      formData.append("content", contentHtml);
      formData.append("status", status);
      formData.append("tag_ids", JSON.stringify(buildTagIds()));
      formData.append("content_image_keys", JSON.stringify(tempContentImageKeys));
      if (headImgFile.value) formData.append("headerImage", headImgFile.value);

      // 如果没选新图，也可附带原有 url 以防置空
      if (existingHeaderUrl.value) formData.append("header_image_url", existingHeaderUrl.value);
      if (existingThumbUrl.value) formData.append("thumbnail_url", existingThumbUrl.value);
      await updateArticle(articleId.value, formData);

      successMsg.value = status === "published" ? "文章更新成功" : "草稿更新成功";
    }
  } catch (err) {
    console.error(err);
    errorMsg.value = err.message || "提交失败";
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="article-editor">
    <!-- 标题 -->
    <div class="article-editor__title">
      <label class="field-label">文章标题</label>
      <input v-model="title" type="text" class="title-input" placeholder="请输入文章标题" />
    </div>

    <!-- 编辑器 -->
    <div class="article-editor__main">
      <EditorToolBar v-if="editor" :editor="editor" @uploading-content-image="uploadingContentImage = $event" />
      <EditorContent :editor="editor" class="article-editor__content" />
    </div>

    <!-- 头图上传区域 -->
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

    <!-- 标签选择 -->
    <div class="article-editor__tags">
      <p v-if="tagsLoading">标签加载中...</p>
      <p v-if="tagsErrorMsg" class="error-msg">{{ tagsErrorMsg }}</p>

      <!-- 一级标签 -->
      <div class="tag-field">
        <span class="tag-field-label">主标签</span>
        <CustomSelect
          v-model="selectedTopTag"
          :options="topTagList"
          placeholder="请选择主标签"
          customClass="top-tag-select"
        />
      </div>

      <!-- 二级标签 -->
      <div class="tag-field" v-if="selectedTopTag && subTagList.length">
        <span class="tag-field-label">副标签</span>
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
      <button
        class="article-editor__submit"
        :disabled="submitting || articleLoading"
        @click="submitArticle('published')"
      >
        {{ submitting ? "提交中..." : "提交" }}
      </button>
      <button class="article-editor__save" :disabled="submitting || articleLoading" @click="submitArticle('draft')">
        {{ submitting ? "保存中..." : "存草稿" }}
      </button>
    </div>

    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
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

/* 文章标题区域 - 卡片容器 */
.article-editor__title {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  padding-left: 20px;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 10px;
}

.article-editor__title .field-label {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1c1d20;
  white-space: nowrap;
  margin-right: 20px;
}

.title-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.5;
  color: #3c4964;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
}

.title-input:focus {
  background-color: #ffffff;
  border-color: #4574da;
  box-shadow: 0 0 0 3px rgba(69, 116, 218, 0.15);
}

.title-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
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

.tag-field-label {
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

@media (max-width: 640px) {
  .article-editor {
    width: 100%;
    margin: 20px auto 80px;
    padding: 0 12px;
    box-sizing: border-box; /* include padding in width to keep both gutters even */
  }

  .article-editor__title {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }

  .article-editor__title .field-label {
    margin: 0;
    font-size: 1.1rem;
    white-space: normal;
  }

  .title-input {
    width: 100%;
    font-size: 1rem;
    padding: 10px 12px;
  }
}
</style>
