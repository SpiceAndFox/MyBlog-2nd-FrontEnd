<script setup>
import imageIcon from "@/assets/images/icons/image.svg";

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

const addImage = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*"; // 只接受图片文件
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        props.editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
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
</style>
