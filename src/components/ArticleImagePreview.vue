<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const visible = ref(false);
const imageSrc = ref("");
const imageAlt = ref("");
const closeButtonRef = ref(null);
const previousBodyOverflow = ref("");

const imageTitle = computed(() => imageAlt.value || "图片预览");

const lockBodyScroll = () => {
  if (typeof document === "undefined") return;

  previousBodyOverflow.value = document.body.style.overflow;
  document.body.style.overflow = "hidden";
};

const unlockBodyScroll = () => {
  if (typeof document === "undefined") return;

  document.body.style.overflow = previousBodyOverflow.value;
};

const close = () => {
  visible.value = false;
};

const open = async ({ src, alt = "" }) => {
  if (!src) return;

  imageSrc.value = src;
  imageAlt.value = alt;
  visible.value = true;

  await nextTick();
  closeButtonRef.value?.focus?.();
};

const handleKeydown = (event) => {
  if (event.key === "Escape") close();
};

watch(visible, (isVisible) => {
  if (typeof window === "undefined") return;

  if (isVisible) {
    lockBodyScroll();
    window.addEventListener("keydown", handleKeydown);
  } else {
    unlockBodyScroll();
    window.removeEventListener("keydown", handleKeydown);
  }
});

onBeforeUnmount(() => {
  unlockBodyScroll();

  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
});

defineExpose({
  open,
  close,
});
</script>

<template>
  <Teleport to="body">
    <Transition name="image-preview">
      <div v-if="visible" class="image-preview" role="dialog" aria-modal="true" :aria-label="imageTitle" @click.self="close">
        <button ref="closeButtonRef" type="button" class="image-preview__close" aria-label="关闭图片预览" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <figure class="image-preview__figure">
          <img :src="imageSrc" :alt="imageAlt" class="image-preview__image" />
          <figcaption v-if="imageAlt" class="image-preview__caption">{{ imageAlt }}</figcaption>
        </figure>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.image-preview {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 64px 24px 36px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.image-preview__close {
  position: fixed;
  top: 22px;
  right: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.image-preview__close:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: scale(1.04);
}

.image-preview__close:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.56);
  outline-offset: 3px;
}

.image-preview__close svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.image-preview__figure {
  display: grid;
  gap: 14px;
  justify-items: center;
  max-width: min(1180px, 100%);
  max-height: 100%;
  margin: 0;
}

.image-preview__image {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 150px);
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
}

.image-preview__caption {
  max-width: min(780px, 100%);
  color: rgba(255, 255, 255, 0.84);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

.image-preview-enter-active,
.image-preview-leave-active {
  transition: opacity 0.22s ease;
}

.image-preview-enter-from,
.image-preview-leave-to {
  opacity: 0;
}

.image-preview-enter-active .image-preview__figure,
.image-preview-leave-active .image-preview__figure {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.image-preview-enter-from .image-preview__figure,
.image-preview-leave-to .image-preview__figure {
  opacity: 0;
  transform: scale(0.96);
}

@media (max-width: 768px) {
  .image-preview {
    padding: 58px 14px 28px;
  }

  .image-preview__close {
    top: 14px;
    right: 14px;
  }

  .image-preview__image {
    max-height: calc(100vh - 130px);
    border-radius: 8px;
  }
}
</style>
