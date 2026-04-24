import { Extension } from "@tiptap/vue-3";
import { uploadArticleImage } from "@/api/articles";

export const BlockquoteIndent = Extension.create({
  name: "blockquoteIndent",

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (!this.editor.isActive("blockquote") || this.editor.isActive("listItem")) return false;
        return this.editor.chain().focus().wrapIn("blockquote").run();
      },
      "Shift-Tab": () => {
        if (!this.editor.isActive("blockquote") || this.editor.isActive("listItem")) return false;
        return this.editor.chain().focus().lift("blockquote").run();
      },
    };
  },
});

export function getImageFilesFromFileList(fileList) {
  return Array.from(fileList || []).filter((file) => file?.type?.startsWith("image/"));
}

function getImageFilesFromClipboard(event) {
  const clipboardData = event?.clipboardData;
  if (!clipboardData) return [];

  const files = getImageFilesFromFileList(clipboardData.files);
  if (files.length) return files;

  return Array.from(clipboardData.items || [])
    .filter((item) => item.kind === "file" && item.type?.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
}

export async function uploadAndInsertImages(editor, files, { setUploading, setError } = {}) {
  const imageFiles = getImageFilesFromFileList(files);
  if (!editor || !imageFiles.length) return false;

  setUploading?.(true);
  setError?.("");

  try {
    const uploadedImages = [];
    for (const file of imageFiles) {
      const { url } = await uploadArticleImage(file);
      uploadedImages.push({
        type: "image",
        attrs: { src: url },
      });
    }

    editor
      .chain()
      .focus()
      .insertContent([...uploadedImages, { type: "paragraph" }])
      .run();
  } catch (err) {
    const message = err?.message || "图片上传失败";
    setError?.(message);
    throw err;
  } finally {
    setUploading?.(false);
  }

  return true;
}

export function handlePastedImages(editor, event, hooks = {}) {
  const imageFiles = getImageFilesFromClipboard(event);
  if (!imageFiles.length) return false;

  event.preventDefault();
  void uploadAndInsertImages(editor, imageFiles, hooks).catch(() => {});
  return true;
}
