import { createSettingsAdapter } from "./settingsAdapter.js";

// Local UI policy only. Technical names and enum values come from the schema.
const samplingKeys = new Set(["topP", "presencePenalty", "frequencyPenalty"]);

export const chatSettingsAdapter = createSettingsAdapter({
  toggleCopy: {
    stream: { label: "逐字显示", description: "随生成进度逐步显示内容" },
    enableWebSearch: { label: "联网搜索", description: "允许模型搜索网络，补充信息" },
  },
  sections: [
    {
      id: "sampling",
      title: "采样参数",
      matches: (control) => samplingKeys.has(control.key),
    },
    {
      id: "search",
      title: "搜索选项",
      matches: (control) => control.key.startsWith("webSearch"),
    },
    {
      id: "safety",
      title: "内容过滤",
      description: "分别设置各类内容的拦截级别。",
      matches: (control) => control.key.startsWith("safety"),
    },
  ],
});
