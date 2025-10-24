import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Brain, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { FeatureCard } from "../components/FeatureCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RAG Chatbot - AI-Powered Assistant" },
    { name: "description", content: "Experience intelligent conversations with our poetic AI assistant powered by Google Gemini and MongoDB RAG" },
  ];
}

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">AI-Powered Chat</span>
            <br />
            <span className="text-white">With Poetic Flair</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Experience intelligent conversations with our AI assistant,
            powered by Google Gemini and MongoDB RAG technology.
          </p>
          <Link to="/chat" className="inline-flex items-center space-x-2 gradient-button text-lg">
            <span>Start Chatting</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard
            icon={Brain}
            title="Intelligent RAG"
            description="Retrieval-Augmented Generation queries your personal knowledge base only when relevant, providing accurate and contextual responses."
          />
          <FeatureCard
            icon={MessageCircle}
            title="Natural Conversations"
            description="Clear, concise responses that provide accurate information in a friendly and professional manner."
          />
          <FeatureCard
            icon={Sparkles}
            title="Smart Tool Usage"
            description="LangChain ReAct agent intelligently decides when to use tools like database queries, ensuring optimal performance."
          />
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm">
            Built with FastAPI • LangChain • Google Gemini • MongoDB • React Router • TypeScript
          </p>
        </div>
      </div>
    </div>
  );
}
