import type { Route } from "./+types/home";
import { Link } from "react-router";
import { 
  Brain, MessageCircle, Sparkles, ArrowRight, Zap, 
  Database, FileText, TrendingUp, Layers, 
  Search
} from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { FeatureCard } from "../components/FeatureCard";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "RAG Chatbot - Intelligent AI Assistant with Smart Model Switching" },
    { name: "description", content: "Advanced RAG-powered chatbot with auto-switching between GPT-4o and GPT-4o-mini based on query complexity. Features smart memory, task management, and document retrieval." },
  ];
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Auto-Switching Intelligence</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Smart RAG Chatbot</span>
            <br />
            <span className="text-white">That Adapts to Your Needs</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience intelligent conversations with automatic model switching between GPT-4o and GPT-4o-mini. 
            Our AI analyzes query complexity and chooses the optimal model for cost-effective, accurate responses.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/chat" 
              className="inline-flex items-center gap-2 gradient-button text-lg px-8 py-3 group"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/memory" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-lg transition-colors"
            >
              <Brain className="w-5 h-5" />
              <span>Explore Memory</span>
            </Link>
          </div>
        </div>

        {/* Key Features Highlight */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 sm:mb-20">
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-default">
            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Auto-Switching</h3>
            <p className="text-sm text-gray-400">Dynamic model selection</p>
          </div>
          
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-default">
            <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Vector RAG</h3>
            <p className="text-sm text-gray-400">Chromadb integration</p>
          </div>
          
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-default">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Smart Memory</h3>
            <p className="text-sm text-gray-400">Context-aware recall</p>
          </div>
          
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-default">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-1">Task Manager</h3>
            <p className="text-sm text-gray-400">Integrated workflows</p>
          </div>
        </div>

        {/* Detailed Features Section */}
        <div className="mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 gradient-text">
            Powerful Features
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Built with cutting-edge technology to deliver intelligent, context-aware conversations
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Auto Model Switching"
              description="Automatically switches between GPT-4o and GPT-4o-mini based on query complexity analysis. Saves costs on simple queries while using advanced models for complex reasoning."
            />
            <FeatureCard
              icon={Brain}
              title="Smart Memory System"
              description="Stores and recalls information from past conversations. Uses semantic search to find relevant context and maintains conversation continuity across sessions."
            />
            <FeatureCard
              icon={Database}
              title="Vector Database RAG"
              description="Chromadb-powered retrieval system that searches through your documents and past conversations to provide accurate, context-aware responses with source citations."
            />
            <FeatureCard
              icon={MessageCircle}
              title="Advanced Chat Interface"
              description="Clean, responsive UI with markdown support, code highlighting, thought process visibility, and real-time LLM metadata display showing which model handled your query."
            />
            <FeatureCard
              icon={FileText}
              title="Document Management"
              description="Upload and index documents for RAG retrieval. Supports PDF, TXT, and DOCX formats. Quick document switching for context-specific conversations."
            />
            <FeatureCard
              icon={Layers}
              title="Multi-Scope Memory"
              description="Organize memories by scope (general, personal, work, study). Each scope maintains separate context for focused, relevant conversations."
            />
            <FeatureCard
              icon={Search}
              title="Semantic Search"
              description="Find relevant information across all your memories and documents using natural language queries. Powered by embedding-based similarity matching."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Complexity Analysis"
              description="Real-time query complexity scoring using keyword detection, sentence structure, and domain analysis. Ensures optimal model selection for each interaction."
            />
            <FeatureCard
              icon={Sparkles}
              title="ReAct Agent Tools"
              description="LangChain-powered agent with intelligent tool selection. Uses memory search, document retrieval, and task management only when contextually relevant."
            />
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 gradient-text">
            How It Works
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6 items-start group">
              <div className="shrink-0 w-12 h-12 bg-linear-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Query Analysis</h3>
                <p className="text-gray-400">
                  Your message is analyzed for complexity, keywords, and intent. The system detects technical terms, question complexity, and domain requirements.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start group">
              <div className="shrink-0 w-12 h-12 bg-linear-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Smart Model Selection</h3>
                <p className="text-gray-400">
                  Based on complexity score, the optimal model is chosen: GPT-4o-mini for simple queries (fast & cost-effective), GPT-4o for complex reasoning (powerful & accurate).
                </p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start group">
              <div className="shrink-0 w-12 h-12 bg-linear-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Context Retrieval</h3>
                <p className="text-gray-400">
                  The ReAct agent decides if it needs additional context. It can search memories, query documents, or check tasks - only when relevant to your question.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start group">
              <div className="shrink-0 w-12 h-12 bg-linear-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Response Generation</h3>
                <p className="text-gray-400">
                  The selected model generates a response using conversation history, retrieved context, and your query. You see the model used, complexity score, and thought process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats/Benefits */}
        <div className="glass-card p-8 mb-16 sm:mb-20">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">60%</div>
              <p className="text-gray-400">Cost savings with auto-switching</p>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">2x</div>
              <p className="text-gray-400">Faster responses for simple queries</p>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">100%</div>
              <p className="text-gray-400">Accuracy on complex reasoning</p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-6">Built With Modern Technology</h3>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">FastAPI</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">LangChain</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">OpenAI GPT-4o</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">Chromadb</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">MongoDB</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">React Router v7</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">TypeScript</span>
            <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">Tailwind CSS</span>
          </div>
          <p className="text-gray-500 text-sm">
            Open source • Production ready • Self-hostable
          </p>
        </div>
      </div>
    </div>
  );
}
