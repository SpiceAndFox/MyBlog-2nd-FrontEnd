import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Material Design样式引入
import "@material/web/all.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/textfield/outlined-text-field.js";

// 纱布ios
function adjustViewHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
window.addEventListener("load", adjustViewHeight);
window.addEventListener("resize", adjustViewHeight);

const app = createApp(App);
app.use(router);
app.mount("#app");
