<script setup>
import { ref } from "vue";
import imageIcon from "@/assets/images/icons/image.svg";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import { uploadAndInsertImages } from "@/utils/editorContentImages";

const uploadStatus = ref({ loading: false, error: "" });
const emit = defineEmits(["uploading-content-image"]);

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

function setUploadState({ loading = uploadStatus.value.loading, error = uploadStatus.value.error } = {}) {
  uploadStatus.value = { loading, error };
  emit("uploading-content-image", loading);
}

const addImage = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.onchange = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      await uploadAndInsertImages(props.editor, files, {
        setUploading: (loading) => setUploadState({ loading }),
        setError: (error) => setUploadState({ error }),
      });
    } catch (error) {
      setUploadState({ loading: false, error: error.message || "图片上传失败" });
    }
  };
  input.click();
};
</script>

<template>
  <div class="editor-toolbar" v-if="editor">
    <button @click="addImage"><img :src="imageIcon" /></button>
    <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
      <span>B</span>
    </button>
    <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
      <span>I</span>
    </button>
    <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
      <span>S</span>
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
    >
      <span>H1</span>
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
    >
      <span>H2</span>
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
    >
      <span>H3</span>
    </button>
    <button
      @click="editor.chain().focus().toggleBulletList().run()"
      :class="{ 'is--active': editor.isActive('bulletList') }"
    >
      <span>UL</span>
    </button>
    <button
      @click="editor.chain().focus().toggleOrderedList().run()"
      :class="{ 'is-active': editor.isActive('orderedList') }"
    >
      <span>OL</span>
    </button>
    <button
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="{ 'is-active': editor.isActive('codeBlock') }"
    >
      <span>&lt;/&gt;</span>
    </button>
    <button
      @click="editor.chain().focus().toggleBlockquote().run()"
      :class="{ 'is-active': editor.isActive('blockquote') }"
    >
      <span>Quote</span>
    </button>
    <button @click="editor.chain().focus().setHorizontalRule().run()"><span>HR</span></button>

    <LoadingOverlay :show="uploadStatus.loading" text="正在上传图片..." />
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #d1d5db;
  background-color: #f9fafb;
}

img {
  height: 18px;
}

button {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background-color: transparent;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

span {
  display: block;
  height: 100%;
  line-height: 30px;
}

button:hover {
  background-color: #e5e7eb;
}

button.is-active {
  background-color: #d1d5db;
  color: #111827;
}

.toolbar-status {
  min-width: 120px;
  font-size: 12px;
  color: #6b7280;
}
.toolbar-status .error {
  color: #b91c1c;
}
</style>
