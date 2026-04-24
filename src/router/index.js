import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import Article from "@/views/Article.vue";
import ArticleList from "@/views/ArticleList.vue";
import DiaryArticle from "@/views/DiaryArticle.vue";
import DiaryList from "@/views/DiaryList.vue";
import DiaryWrite from "@/views/Admin/DiaryWrite.vue";
import LogIn from "@/views/LogIn.vue";
import ArticleWrite from "@/views/Admin/ArticleWrite.vue";
import AdminLayout from "@/views/AdminLayout.vue";
import ArticleManage from "@/views/Admin/ArticleManage.vue";
import ArticleTagManage from "@/views/Admin/ArticleTagManage.vue";
import Chat from "@/views/Chat.vue";

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
    path: "/diaries",
    name: "DiaryList",
    component: DiaryList,
    meta: {
      layoutClass: "articleList",
      requiresAuth: true,
    },
  },
  {
    path: "/diaries/write",
    redirect: "/admin/diary",
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/diaries/:id",
    name: "DiaryArticle",
    component: DiaryArticle,
    meta: {
      layoutClass: "article",
      requiresAuth: true,
    },
  },
  {
    path: "/chat",
    name: "Chat",
    component: Chat,
    meta: {
      layoutClass: "chat",
      requiresAuth: true,
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
    redirect: "/admin/write",
    meta: {
      layoutClass: "admin",
      requiresAuth: true,
    },
    children: [
      {
        path: "write",
        name: "ArticleWrite",
        component: ArticleWrite,
      },
      {
        path: "write/:id",
        name: "ArticleWriteEdit",
        component: ArticleWrite,
      },
      {
        path: "articles",
        name: "ArticleManage",
        component: ArticleManage,
      },
      {
        path: "tags",
        name: "ArticleTagManage",
        component: ArticleTagManage,
      },
      {
        path: "diary",
        name: "DiaryWrite",
        component: DiaryWrite,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((route) => route.meta?.requiresAuth);
  if (!requiresAuth) return true;

  const token = localStorage.getItem("token");
  if (token) return true;

  return {
    name: "LogIn",
    query: { redirect: to.fullPath },
  };
});

export default router;
