import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/chat", "routes/chat.tsx"),
  route("/memory", "routes/memory.tsx"),
  route("/settings", "routes/settings.tsx"),
] satisfies RouteConfig;
