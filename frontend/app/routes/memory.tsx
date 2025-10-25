import MemoryManager from "../components/MemoryManager";
import { Navbar } from "../components/Navbar";

export function meta() {
  return [
    { title: "Memory Manager - RAG Chat Agent" },
    { name: "description", content: "Manage and explore RAG chatbot memories" },
  ];
}

export default function MemoryRoute() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MemoryManager />
    </div>
  );
}
