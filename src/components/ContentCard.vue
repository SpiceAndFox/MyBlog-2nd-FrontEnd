<script setup>
import { computed } from "vue";
import { useViewTransitionNavigation } from "@/composables/useViewTransitionNavigation";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  summary: {
    type: String,
    default: "",
  },
  thumbnail: {
    type: String,
    default: "",
  },
  link: {
    type: String,
    default: "",
  },
  to: {
    type: [Object, String],
    default: null,
  },
  datetime: {
    type: String,
    default: "",
  },
  tags: {
    type: Array,
    default: () => [],
  },
  index: {
    type: Number,
    default: 0,
  },
  imageAlt: {
    type: String,
    default: "内容封面",
  },
  emptyImageText: {
    type: String,
    default: "暂无封面",
  },
});

const emit = defineEmits(["click"]);
const { navigateWithTransition } = useViewTransitionNavigation();

const isReversed = computed(() => props.index % 2 === 1);
const tagList = computed(() => props.tags.filter(Boolean));
const hasMeta = computed(() => tagList.value.length > 0 || Boolean(props.datetime));
const titleHref = computed(() => props.link || (typeof props.to === "string" ? props.to : "#"));

function navigate() {
  emit("click");
  if (props.to) navigateWithTransition(props.to);
}
</script>

<template>
  <article class="content-card" :class="{ 'content-card--reverse': isReversed }" @click="navigate">
    <div class="content-card__thumb" :class="{ 'content-card__thumb--empty': !thumbnail }">
      <img v-if="thumbnail" class="content-card__thumb-img" :src="thumbnail" :alt="imageAlt" />
      <span v-else class="content-card__thumb-label">{{ emptyImageText }}</span>
    </div>

    <div class="content-card__body">
      <a class="content-card__title" :href="titleHref" @click.prevent>{{ title }}</a>
      <p class="content-card__desc">{{ summary }}</p>

      <div v-if="hasMeta" class="content-card__meta">
        <div v-if="tagList.length" class="content-card__tags">
          <span v-for="tag in tagList" :key="tag" class="content-card__chip">{{ tag }}</span>
        </div>
        <time v-if="datetime" class="content-card__date" :datetime="datetime">{{ datetime }}</time>
      </div>
    </div>
  </article>
</template>

<style scoped>
.content-card {
  display: grid;
  grid-template-columns: minmax(340px, 40%) minmax(0, 1fr);
  align-items: stretch;
  gap: 0;
  height: 228px;
  overflow: hidden;
  border: 1px solid rgba(92, 126, 105, 0.1);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 251, 250, 0.78));
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.content-card:hover {
  transform: translateY(-2px);
  border-color: rgba(92, 126, 105, 0.28);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.content-card__thumb {
  position: relative;
  overflow: hidden;
  height: 100%;
  min-height: 0;
  margin-right: -26px;
  clip-path: polygon(0 0, 100% 0, calc(100% - 26px) 100%, 0 100%);
  background: linear-gradient(135deg, #9bc4cb, #5aa48f 44%, #2e615d 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.content-card__thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    transform 0.3s ease,
    filter 0.3s ease;
}

.content-card:hover .content-card__thumb-img {
  transform: scale(1.035);
  filter: saturate(1.04);
}

.content-card__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8fb0b4, #6ea37e 48%, #536f63 100%);
}

.content-card__thumb-label {
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  backdrop-filter: blur(8px);
}

.content-card__body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 22px 24px 22px 46px;
}

.content-card--reverse {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 40%);
}

.content-card--reverse .content-card__thumb {
  grid-column: 2;
  grid-row: 1;
  margin-right: 0;
  margin-left: -26px;
  clip-path: polygon(26px 0, 100% 0, 100% 100%, 0 100%);
}

.content-card--reverse .content-card__body {
  grid-column: 1;
  grid-row: 1;
  padding: 22px 46px 22px 24px;
}

.content-card__title {
  display: block;
  margin: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 1.48rem;
  font-weight: 800;
  line-height: 1.35;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-card__title:hover {
  color: #5c7e69;
}

.content-card__desc {
  display: -webkit-box;
  max-width: 72ch;
  margin: 12px 0 16px;
  overflow: hidden;
  color: #7b8490;
  font-size: 15px;
  line-height: 1.75;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.content-card__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
}

.content-card__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.content-card__chip {
  padding: 6px 10px;
  border: 1px solid rgba(92, 126, 105, 0.08);
  border-radius: 999px;
  color: #6b7280;
  background: rgba(244, 248, 245, 0.95);
  font-size: 12px;
}

.content-card__date {
  justify-self: end;
  color: #8b94a1;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .content-card {
    grid-template-columns: minmax(286px, 40%) minmax(0, 1fr);
    height: 208px;
  }

  .content-card--reverse {
    grid-template-columns: minmax(0, 1fr) minmax(286px, 40%);
  }

  .content-card__desc {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .content-card,
  .content-card--reverse {
    grid-template-columns: 1fr;
    height: auto;
  }

  .content-card__title {
    font-size: 1.35rem;
  }

  .content-card__thumb,
  .content-card--reverse .content-card__thumb {
    grid-column: auto;
    grid-row: auto;
    height: auto;
    min-height: auto;
    margin-right: 0;
    margin-left: 0;
    aspect-ratio: 16 / 9;
    clip-path: none;
  }

  .content-card__body,
  .content-card--reverse .content-card__body {
    grid-column: auto;
    grid-row: auto;
    padding: 16px;
  }

  .content-card__meta {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .content-card__date {
    justify-self: start;
  }
}
</style>
