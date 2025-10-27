import type { Route } from "./+types/reminders";
import { ReminderManager } from "../components/ReminderManager";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Reminders | RAG Chatbot" },
    { name: "description", content: "Manage your reminders and notifications" },
  ];
}

export default function Reminders() {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ReminderManager />
    </div>
  );
}