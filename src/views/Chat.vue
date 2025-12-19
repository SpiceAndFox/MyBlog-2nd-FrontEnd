<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import ChatSessionSidebar from "@/components/Chat/ChatSessionSidebar.vue";
import ChatConversationPanel from "@/components/Chat/ChatConversationPanel.vue";
import ChatSettingsModal from "@/components/Chat/ChatSettingsModal.vue";
import ChatConfirmDialog from "@/components/Chat/ChatConfirmDialog.vue";

function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatSessionTitleFromMessage(messageText) {
  const normalized = String(messageText || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "新对话";
  return normalized.length > 22 ? `${normalized.slice(0, 22)}…` : normalized;
}

const isMobile = useMediaQuery("(max-width: 900px)");
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isSettingsOpen = ref(false);
const navHeight = ref(60);

function updateNavHeight() {
  const navigation = document.querySelector(".navigation");
  if (!navigation) return;
  navHeight.value = Math.max(0, Math.round(navigation.getBoundingClientRect().height));
}

let navResizeObserver;

onMounted(() => {
  updateNavHeight();
  window.addEventListener("resize", updateNavHeight);

  const navigation = document.querySelector(".navigation");
  if (!navigation) return;
  if (typeof ResizeObserver === "undefined") return;

  navResizeObserver = new ResizeObserver(updateNavHeight);
  navResizeObserver.observe(navigation);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateNavHeight);
  navResizeObserver?.disconnect();
});

const promptPresets = [
  {
    id: "default",
    name: "默认助手",
    systemPrompt: "你是一个专业、耐心、可靠的助手。请用中文回答，必要时给出清晰步骤与示例。",
  },
  {
    id: "developer",
    name: "代码助手",
    systemPrompt: "你是一名资深软件工程师。回答要聚焦可执行方案，给出清晰结构与权衡。",
  },
  {
    id: "translator",
    name: "翻译润色",
    systemPrompt: "你是一名专业译者。请在保持原意的前提下进行自然地道的表达，并指出关键术语。",
  },
];

const providers = [
  {
    id: "grok",
    name: "Grok (xAI)",
    models: [
      { id: "grok-2-latest", name: "grok-2-latest" },
      { id: "grok-2-vision-latest", name: "grok-2-vision-latest" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "deepseek-chat" },
      { id: "deepseek-reasoner", name: "deepseek-reasoner" },
    ],
  },
];

const settings = ref({
  providerId: "grok",
  modelId: "grok-2-latest",
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 1024,
  presencePenalty: 0,
  frequencyPenalty: 0,
  stream: true,
  enableWebSearch: false,
  systemPromptPresetId: "default",
  systemPrompt: promptPresets.find((p) => p.id === "default")?.systemPrompt || "",
});

const sessions = ref([]);
const messagesBySessionId = reactive({});
const activeSessionId = ref("");

function seedMockData() {
  const sessionAId = createId("session");
  const sessionBId = createId("session");
  const sessionCId = createId("session");

  sessions.value = [
    { id: sessionAId, title: "写一个博客首页的文案", updatedAt: new Date() },
    { id: sessionBId, title: "旅行计划：日本关西 5 天游", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: sessionCId, title: "如何设计一个聊天 UI", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ];

  messagesBySessionId[sessionAId] = [
    {
      id: createId("msg"),
      role: "assistant",
      content: "当然可以。你希望首页的风格更偏「技术感」还是「生活感」？我可以给你 3 套不同语气的文案。",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: createId("msg"),
      role: "user",
      content: "技术感，简洁一点，带一点点幽默。",
      createdAt: new Date(Date.now() - 1000 * 60 * 4),
    },
    {
      id: createId("msg"),
      role: "assistant",
      content:
        "给你 3 套备选：\n\n1) 记录思考，也记录 bug。\n2) 写点代码，写点生活。\n3) 欢迎来到我的小站：偶尔严肃，常常好奇。",
      createdAt: new Date(Date.now() - 1000 * 60 * 3),
    },
  ];

  messagesBySessionId[sessionBId] = [
    {
      id: createId("msg"),
      role: "assistant",
      content: "可以。你更想「城市漫步」还是「寺社+自然」？我可以按节奏给你排日程。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ];

  messagesBySessionId[sessionCId] = [
    {
      id: createId("msg"),
      role: "assistant",
      content: "做聊天 UI 时，建议先把布局拆成：会话列表 / 对话区 / 输入区 / 设置弹窗。这样更易维护。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: createId("msg"),
      role: "user",
      content: "希望像 ChatGPT 网页端那样，移动端要适配。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60),
    },
  ];

  activeSessionId.value = sessionAId;
}

seedMockData();

const activeSession = computed(() => sessions.value.find((s) => s.id === activeSessionId.value) || null);
const activeMessages = computed(() => messagesBySessionId[activeSessionId.value] || []);

function openMobileSidebar() {
  if (!isMobile.value) return;
  isMobileSidebarOpen.value = true;
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false;
}

function toggleSidebarCollapsed() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function selectSession(sessionId) {
  activeSessionId.value = sessionId;
  closeMobileSidebar();
}

function bringSessionToTop(sessionId) {
  const index = sessions.value.findIndex((s) => s.id === sessionId);
  if (index <= 0) return;
  const [session] = sessions.value.splice(index, 1);
  sessions.value.unshift(session);
}

function createNewSession() {
  const newSessionId = createId("session");
  const now = new Date();

  sessions.value.unshift({ id: newSessionId, title: "新对话", updatedAt: now });
  messagesBySessionId[newSessionId] = [];
  activeSessionId.value = newSessionId;
  closeMobileSidebar();
}

function renameSession({ sessionId, title }) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return;

  const target = sessions.value.find((s) => s.id === sessionId);
  if (!target) return;

  target.title = normalizedTitle;
  target.updatedAt = new Date();
}

const deleteDialog = ref({
  open: false,
  sessionId: "",
  sessionTitle: "",
});

function requestDeleteSession(sessionId) {
  const target = sessions.value.find((s) => s.id === sessionId);
  deleteDialog.value = {
    open: true,
    sessionId,
    sessionTitle: target?.title || "该会话",
  };
}

function cancelDeleteSession() {
  deleteDialog.value.open = false;
}

function confirmDeleteSession() {
  const sessionId = deleteDialog.value.sessionId;
  deleteDialog.value.open = false;

  sessions.value = sessions.value.filter((s) => s.id !== sessionId);
  delete messagesBySessionId[sessionId];

  if (activeSessionId.value === sessionId) {
    activeSessionId.value = sessions.value[0]?.id || "";
  }

  if (!activeSessionId.value) createNewSession();
}

async function sendMessage(text) {
  const sessionId = activeSessionId.value;
  if (!sessionId) return;

  const content = String(text || "").trim();
  if (!content) return;

  const now = new Date();
  const newUserMessage = { id: createId("msg"), role: "user", content, createdAt: now };
  messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), newUserMessage];

  const session = sessions.value.find((s) => s.id === sessionId);
  if (session) {
    if (session.title === "新对话" && (messagesBySessionId[sessionId] || []).length <= 1) {
      session.title = formatSessionTitleFromMessage(content);
    }
    session.updatedAt = now;
    bringSessionToTop(sessionId);
  }

  await nextTick();

  setTimeout(() => {
    const assistantMessage = {
      id: createId("msg"),
      role: "assistant",
      content:
        "（UI 演示）我已经收到你的消息了。\n\n后续接入 API（Grok / DeepSeek）后，这里会替换成真实的模型回复。",
      createdAt: new Date(),
    };
    messagesBySessionId[sessionId] = [...(messagesBySessionId[sessionId] || []), assistantMessage];
  }, 450);
}

function openSettings() {
  isSettingsOpen.value = true;
  closeMobileSidebar();
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function saveSettings(nextSettings) {
  settings.value = { ...settings.value, ...nextSettings };
  closeSettings();
}

watch(isMobile, (mobile) => {
  if (mobile) {
    isMobileSidebarOpen.value = false;
    return;
  }
  isMobileSidebarOpen.value = false;
});
</script>

<template>
  <div class="chat-page" :style="{ '--chat-nav-height': navHeight + 'px' }">
    <ChatSessionSidebar
      :sessions="sessions"
      :activeSessionId="activeSessionId"
      :collapsed="isSidebarCollapsed"
      :isMobile="isMobile"
      :mobileOpen="isMobileSidebarOpen"
      @select-session="selectSession"
      @create-session="createNewSession"
      @toggle-collapse="toggleSidebarCollapsed"
      @request-close="closeMobileSidebar"
      @request-rename-session="renameSession"
      @request-delete-session="requestDeleteSession"
      @open-settings="openSettings"
    />

    <ChatConversationPanel
      class="chat-conversation"
      :sessionTitle="activeSession?.title || '新对话'"
      :messages="activeMessages"
      :isMobile="isMobile"
      @open-sidebar="openMobileSidebar"
      @open-settings="openSettings"
      @send-message="sendMessage"
    />

    <ChatSettingsModal
      :open="isSettingsOpen"
      :providers="providers"
      :promptPresets="promptPresets"
      :currentSettings="settings"
      @close="closeSettings"
      @save="saveSettings"
    />

    <ChatConfirmDialog
      :open="deleteDialog.open"
      title="删除会话"
      :message="`确定要删除「${deleteDialog.sessionTitle}」吗？此操作仅影响本地 UI 演示数据。`"
      confirmText="删除"
      cancelText="取消"
      @confirm="confirmDeleteSession"
      @cancel="cancelDeleteSession"
    />
  </div>
</template>

<style scoped>
.chat-page {
  --chat-sidebar-bg: #202123;
  --chat-sidebar-border: rgba(255, 255, 255, 0.08);
  --chat-sidebar-text: rgba(236, 236, 241, 0.92);
  --chat-sidebar-muted: rgba(236, 236, 241, 0.62);
  --chat-sidebar-hover: rgba(255, 255, 255, 0.08);

  --chat-surface: #f7f7f8;
  --chat-surface-2: #ffffff;
  --chat-border: rgba(17, 24, 39, 0.12);
  --chat-text: #111827;
  --chat-muted: rgba(17, 24, 39, 0.62);

  --chat-accent: #3b82f6;
  --chat-accent-strong: #2563eb;

  --chat-radius-lg: 14px;
  --chat-radius-md: 10px;
  --chat-radius-sm: 8px;

  --chat-nav-height: 60px;

  flex: none;
  height: calc(100vh - var(--chat-nav-height, 60px));
  height: calc(100dvh - var(--chat-nav-height, 60px));
  min-height: 0;
  display: flex;
  overflow: hidden;
  position: relative;

  background: var(--chat-surface);
}

.chat-conversation {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
