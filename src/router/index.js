import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import Article from "@/views/Article.vue";
import ArticleList from "@/views/ArticleList.vue";
import LogIn from "@/views/LogIn.vue";
import ArticleWrite from "@/views/Admin/ArticleWrite.vue";
import AdminLayout from "@/views/AdminLayout.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      layoutClass: "home",
    },
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
  {
    path: "/login",
    name: "LogIn",
    component: LogIn,
    meta: {
      layoutClass: "admin",
    },
  },
  {
    path: "/admin",
    name: "AdminLayout",
    component: AdminLayout,
    meta: {
      layoutClass: "admin",
    },
  },
  {
    path: "/admin/write",
    name: "ArticleWrite",
    component: ArticleWrite,
    meta: {
      layoutClass: "admin",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
