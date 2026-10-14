export function shouldRedirectToLogin(error) {
  // Provider errors can mention API tokens or model access after our own
  // authentication succeeded. Only the site's authentication failures redirect.
  if (error?.code === "AUTH_REQUIRED") return true;
  const status = Number(error?.status);
  if (status === 401) return true;
  // The existing backend returns 403 for a missing Authorization header.
  return status === 403 && error?.message === "需要提供Token用于认证";
}

export function createApiErrorHandler(router) {
  return function handleApiError(error, { silent = false } = {}) {
    console.error(error);
    if (shouldRedirectToLogin(error)) {
      const currentRoute = router?.currentRoute?.value;
      const redirectTarget =
        currentRoute && currentRoute.name !== "LogIn" ? currentRoute.fullPath : "";
      const location = { name: "LogIn" };
      if (redirectTarget) {
        location.query = { redirect: redirectTarget };
      }
      router?.push?.(location);
      return true;
    }
    if (!silent) window.alert(error?.message || "请求失败");
    return false;
  };
}
