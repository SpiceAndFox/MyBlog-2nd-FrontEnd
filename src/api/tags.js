// src/api/tags.js

// 公共获取所有标签（层级结构）
export async function fetchAllTags() {
  const res = await fetch("/api/tags");

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // 如果解析失败，就保持 data = {}，下面按通用错误处理
  }

  if (!res.ok) {
    throw new Error(data.error || "获取标签失败");
  }

  return data;
}

// 下面三个是 admin 专用，需要带 token
function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("尚未登录或登录已过期");
  return { Authorization: `Bearer ${token}` };
}

export async function createTag({ name, parent_id = null }) {
  const res = await fetch("/api/admin/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ name, parent_id }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "创建标签失败");
  }
  return data;
}

export async function updateTag(id, { name }) {
  const res = await fetch(`/api/admin/tags/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "更新标签失败");
  }
  return data;
}

export async function deleteTag(id) {
  const res = await fetch(`/api/admin/tags/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  if (res.status === 204) {
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 409) {
    throw new Error(data.error || "该标签仍有文章在使用，无法删除");
  }
  if (!res.ok) {
    throw new Error(data.error || "删除标签失败");
  }
}
