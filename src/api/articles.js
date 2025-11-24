// src/api/articles.js

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("尚未登录或登录已过期");
  return { Authorization: `Bearer ${token}` };
}

// 创建文章（带 FormData）
export async function createArticle(formData) {
  const res = await fetch("/api/admin/articles", {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      // 不要加 Content-Type
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || "创建文章失败");
  }
  return data;
}
