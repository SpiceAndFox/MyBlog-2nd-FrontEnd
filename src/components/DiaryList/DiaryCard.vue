<script setup>
import { computed } from "vue";
import ContentCard from "@/components/ContentCard.vue";

const props = defineProps({
  diary: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
});

const diaryTarget = computed(() => ({ name: "DiaryArticle", params: { id: props.diary.id } }));
</script>

<template>
  <ContentCard
    :title="diary.title"
    :summary="diary.summary"
    :thumbnail="diary.thumbnail"
    :link="diary.link"
    :to="diaryTarget"
    :datetime="diary.datetime"
    :index="index"
    image-alt="日记封面"
    empty-image-text="暂无封面"
  />
</template>
