import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Material Design样式引入
import "@material/web/all.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/textfield/outlined-text-field.js";

const app = createApp(App);
app.use(router);
app.mount("#app");
