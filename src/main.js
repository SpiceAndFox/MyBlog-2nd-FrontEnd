import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Material Design样式引入
import "@material/web/all.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/textfield/outlined-text-field.js";

// PWA
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

const app = createApp(App);
app.use(router);
router.isReady().then(() => {
  app.mount("#app");
});
