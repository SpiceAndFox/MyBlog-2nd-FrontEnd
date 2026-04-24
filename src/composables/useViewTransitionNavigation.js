import { nextTick } from "vue";
import { useRouter } from "vue-router";

export function useViewTransitionNavigation() {
  const router = useRouter();

  async function navigateWithTransition(target) {
    if (typeof document === "undefined" || !document.startViewTransition) {
      await router.push(target);
      return;
    }

    document.startViewTransition(async () => {
      await router.push(target);
      await nextTick();
    });
  }

  return {
    navigateWithTransition,
  };
}
