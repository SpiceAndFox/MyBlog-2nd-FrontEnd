import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Article from "../views/Article.vue";
import ArticleList from "../views/ArticleList.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/article/:id",
    name: "Article",
    component: Article,
    meta: {
      layoutClass: "article",
    },
  },
  {
    path: "/articles",
    name: "ArticleList",
    component: ArticleList,
    meta: {
      layoutClass: "articleList",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
