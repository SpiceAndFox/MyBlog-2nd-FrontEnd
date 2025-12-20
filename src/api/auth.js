// src/api/auth.js
const BASE_URL = "";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("尚未登录或登录已过期");
  return { Authorization: `Bearer ${token}` };
}

export async function loginApi({ username, password }) {
  const res = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error || "登录失败";
    throw new Error(msg);
  }

  return res.json(); // { message, token }
}

export async function getMeApi() {
  const res = await fetch(`/api/auth/me`, {
    headers: { ...getAuthHeader() },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "获取用户信息失败");
  return data.user;
}
