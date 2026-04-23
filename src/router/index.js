import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import Article from "@/views/Article.vue";
import ReferenceArticleList from "@/views/ReferenceArticleList.vue";
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
    component: ReferenceArticleList,
    meta: {
      layoutClass: "referenceArticleList",
      hideNavigation: true,
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
