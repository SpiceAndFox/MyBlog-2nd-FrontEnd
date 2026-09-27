export function isMemoryPendingError(error) {
  return ["CHAT_MEMORY_COVERAGE_PENDING", "CHAT_MEMORY_REBUILDING", "CHAT_PRIVACY_PENDING"].includes(error?.code)
    || error?.status === 423;
}

export function memoryBlockingMessage(health) {
  const scope = health?.memory?.scope;
  if (scope?.chatBlocked !== true) return "";
  const paused = scope.targets?.some(target => target.status === "needs_attention");
  const message = paused ? "记忆补齐已暂停，暂时无法继续对话，请点击“重试长期记忆”"
    : scope.availability === "rebuilding" ? "记忆正在重建，历史上下文尚未恢复，请等待后再继续对话"
      : "记忆正在补齐历史上下文，请等待后再继续对话";
  const progress = scope.progress;
  return Number.isSafeInteger(progress?.processedMessages) && Number.isSafeInteger(progress?.totalMessages)
    && progress.totalMessages > 0
    ? `${message}（已处理 ${progress.processedMessages}/${progress.totalMessages} 条消息）`
    : message;
}
