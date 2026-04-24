<script setup>
import { computed } from "vue";
import ContentCard from "@/components/ContentCard.vue";

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
});

const tagList = computed(() => {
  if (Array.isArray(props.article.tags) && props.article.tags.length) return props.article.tags;
  return [props.article.topTag, props.article.subTag].filter(Boolean);
});

const articleTarget = computed(() => ({ name: "Article", params: { id: props.article.id } }));
</script>

<template>
  <ContentCard
    :title="article.title"
    :summary="article.summary"
    :thumbnail="article.thumbnail"
    :link="article.link"
    :to="articleTarget"
    :datetime="article.datetime"
    :tags="tagList"
    :index="index"
    image-alt="文章头图"
    empty-image-text="暂无头图"
  />
</template>
