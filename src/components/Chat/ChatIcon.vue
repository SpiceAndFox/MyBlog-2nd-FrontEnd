<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
});

const paths = {
  x: ["m6 6 12 12M6 18 18 6"],
  panel: [
    "M9 3v18",
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2",
  ],
  close: [
    "m15 9-3 3 3 3",
    "M9 3v18",
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2",
  ],
  expand: [
    "m12 9 3 3-3 3",
    "M9 3v18",
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2",
  ],
  chevron: ["m7 10 5 5 5-5"],
  calendar: [
    "M8 2v4m8-4v4M3 10h18",
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  ],
  chat: [
    "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z",
  ],
  book: [
    "M12 5v16",
    "M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z",
  ],
  diary: [
    "M8 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2",
    "M3 7h5m-5 5h5m-5 5h5m4-10h5m-5 5h5",
  ],
  settings: ["M4 7h9m4 0h3M4 17h3m4 0h9", "M13 4v6m-6 4v6"],
  home: ["m3 10 9-7 9 7", "M5 9v12h14V9M9 21v-8h6v8"],
  check: ["m5 12 4 4L19 6"],
  trash: ["M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"],
  edit: ["m16 3 5 5-12 12-6 1 1-6z", "m14 5 5 5"],
  more: ["M5 12h.01M12 12h.01M19 12h.01"],
  arrow: ["M12 19V5m-6 6 6-6 6 6"],
};
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="name === 'more' ? 3 : 1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(path, index) in paths[name] || paths.chat"
      :key="index"
      :d="path"
    />
  </svg>
</template>

<style scoped>
svg {
  display: block;
  flex: 0 0 auto;
}
</style>
