export function shouldRedirectToLogin(error) {
  const msg = String(error?.message || "");
  if (!msg) return false;
  return /token|登录|过期|unauthorized|forbidden/i.test(msg);
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
