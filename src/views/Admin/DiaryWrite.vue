<script setup>
import { onBeforeUnmount, ref } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import EditorToolBar from "@/components/Admin/EditorToolBar.vue";
import { createDiary } from "@/api/articles";

const title = ref("");
const submitting = ref(false);
const uploadingContentImage = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

const editor = useEditor({
  content: "",
  extensions: [StarterKit, Image],
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

function extractTempContentImageKeys(html) {
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
    const regex = /\/uploads\/articles\/content\/tmp\/([^"'\s?#/]+)/g;
    let match;
    while ((match = regex.exec(html))) keys.add(match[1]);
  }

  return Array.from(keys);
}

async function submitDiary() {
  if (uploadingContentImage.value) {
    errorMsg.value = "图片上传中，请稍候再提交";
    return;
  }

  if (!editor.value || submitting.value) return;

  errorMsg.value = "";
  successMsg.value = "";

  const normalizedTitle = title.value.trim();
  if (!normalizedTitle) {
    errorMsg.value = "标题不能为空";
    return;
  }

  const contentHtml = editor.value.getHTML();
  if (!contentHtml || contentHtml === "<p></p>") {
    errorMsg.value = "日记内容不能为空";
    return;
  }

  submitting.value = true;

  try {
    await createDiary({
      title: normalizedTitle,
      content: contentHtml,
      status: "published",
      contentImageKeys: extractTempContentImageKeys(contentHtml),
    });

    successMsg.value = "日记发布成功";
    title.value = "";
    editor.value.commands.setContent("");
  } catch (err) {
    console.error(err);
    errorMsg.value = err.message || "提交失败";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="diary-write-page">
    <div class="diary-write-shell">
      <header class="page-header">
        <div>
          <RouterLink class="back-link" to="/diaries">返回日记</RouterLink>
          <h1>写日记</h1>
        </div>
      </header>

      <div class="diary-editor">
        <div class="diary-editor__title">
          <label class="field-label" for="diary-title">日记标题</label>
          <input id="diary-title" v-model="title" type="text" class="title-input" placeholder="请输入日记标题" />
        </div>

        <div class="diary-editor__main">
          <EditorToolBar v-if="editor" :editor="editor" @uploading-content-image="uploadingContentImage = $event" />
          <EditorContent :editor="editor" class="diary-editor__content" />
        </div>

        <div class="submit-wrapper">
          <button class="diary-editor__submit" :disabled="submitting" @click="submitDiary">
            {{ submitting ? "提交中..." : "发布日记" }}
          </button>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.diary-write-page {
  width: 100%;
  min-height: calc(100vh - 60px);
  background: rgb(238, 238, 238);
  color: #1f2937;
}

.diary-write-shell {
  max-width: 860px;
  margin: 0 auto;
  padding: 96px 20px 86px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 10px 0 0;
  font-size: 2.3rem;
  line-height: 1.15;
}

.back-link {
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
}

.back-link:hover {
  color: #31533d;
}

.diary-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.diary-editor__title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.field-label {
  flex: 0 0 auto;
  color: #1c1d20;
  font-size: 1.08rem;
  font-weight: 700;
  white-space: nowrap;
}

.title-input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  background-color: #f9fafb;
  color: #3c4964;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.5;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.title-input:focus {
  background-color: #ffffff;
  border-color: #6ea37e;
  box-shadow: 0 0 0 3px rgba(110, 163, 126, 0.16);
}

.title-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.diary-editor__main {
  display: flex;
  flex-direction: column;
  min-height: 460px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.diary-editor__content {
  flex: 1;
  min-height: 400px;
  padding: 20px;
  overflow-y: auto;
}

.submit-wrapper {
  display: flex;
  justify-content: flex-start;
}

.diary-editor__submit {
  min-width: 118px;
  padding: 9px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background-color: #6ea37e;
  color: #ffffff;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition:
    background 0.2s ease,
    transform 0.1s ease,
    opacity 0.2s ease;
}

.diary-editor__submit:hover:not(:disabled) {
  background-color: #5c8c6c;
}

.diary-editor__submit:active:not(:disabled) {
  transform: translateY(1px);
}

.diary-editor__submit:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

.error-msg,
.success-msg {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.error-msg {
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fecdd3;
}

.success-msg {
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.diary-editor__content :deep(.ProseMirror) {
  min-height: 100%;
}

.diary-editor__content :deep(.ProseMirror:focus) {
  outline: none;
}

.diary-editor__content :deep(.ProseMirror h1),
.diary-editor__content :deep(.ProseMirror h2),
.diary-editor__content :deep(.ProseMirror h3) {
  margin-top: 0.5em;
}

.diary-editor__content :deep(.ProseMirror p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.diary-editor__content :deep(.ProseMirror ul),
.diary-editor__content :deep(.ProseMirror ol) {
  margin-left: 1.5rem;
  margin-bottom: 1em;
}

.diary-editor__content :deep(.ProseMirror blockquote) {
  border-left: 3px solid #d1d5db;
  margin-left: 1rem;
  padding-left: 1rem;
  color: #6b7280;
  font-style: italic;
}

.diary-editor__content :deep(.ProseMirror pre) {
  margin-bottom: 1em;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: #1f2937;
  color: #f9fafb;
  font-family: "JetBrains Mono", monospace;
  overflow-x: auto;
}

.diary-editor__content :deep(.ProseMirror img) {
  max-width: 90%;
  max-height: 250px;
  display: block;
  margin: 1rem auto;
}

@media (max-width: 640px) {
  .diary-write-shell {
    padding: 82px 12px 72px;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .diary-editor__title {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
  }

  .field-label {
    white-space: normal;
  }

  .diary-editor__content {
    padding: 16px;
  }
}
</style>
