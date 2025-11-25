// src/api/articles.js

// 公开接口
export async function getPublishedArticles({ topTag, subTag, year, month, search, page = 1, limit = 5 } = {}) {
  const params = new URLSearchParams();
  if (topTag) params.set("topTag", topTag);
  if (subTag) params.set("subTag", subTag);
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);
  if (search) params.set("search", search);

  const url = params.toString() ? `/api/articles?${params.toString()}` : "/api/articles";
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "加载文章失败");
  return data; // { articles, pagination }
}

// 获取认证信息
export function getAuthHeader() {
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

// 后台：获取文章列表（对应 GET /api/admin/articles）
export async function getAdminArticles({ search, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const queryString = params.toString();
  const url = queryString ? `/api/admin/articles?${queryString}` : "/api/admin/articles";

  const res = await fetch(url, {
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || "获取文章列表失败");
  }
  return data; // { articles, pagination }
}

// 后台：删除文章（对应 DELETE /api/admin/articles/:id）
export async function deleteArticleAdmin(id) {
  const res = await fetch(`/api/admin/articles/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  // 你的后端 deleteArticle 返回 204 No Content
  if (res.status === 204) {
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || "删除文章失败");
  }
  return data;
}

// 取单篇文章（后台）
export async function getArticleByIdAdmin(id) {
  const res = await fetch(`/api/admin/articles/${id}`, { headers: { ...getAuthHeader() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "获取文章失败");
  return data; // { id, title, content, thumbnail_url, header_image_url, status, tag_ids }
}

// 更新文章（后台）
// payload 可以是 FormData（含 headerImage）或普通对象
export async function updateArticle(id, payload) {
  const isFormData = payload instanceof FormData;
  const headers = isFormData
    ? { ...getAuthHeader() } // 不要手动设 Content-Type
    : { "Content-Type": "application/json", ...getAuthHeader() };

  const res = await fetch(`/api/admin/articles/${id}`, {
    method: "PUT",
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "更新文章失败");
  return data;
}

export async function uploadArticleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/admin/articles/upload-image", {
    method: "POST",
    headers: { ...getAuthHeader() }, // 不手动设 Content-Type
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "图片上传失败");
  return data; // { url }
}
