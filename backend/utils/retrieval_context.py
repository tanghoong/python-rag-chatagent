"""
Retrieval Context Manager

Tracks retrieval metadata for transparency and quality feedback.
Allows capturing retrieved chunks, relevance scores, and sources.
"""

from typing import List, Dict, Any, Optional
from contextvars import ContextVar
from dataclasses import dataclass, field, asdict
from datetime import datetime


@dataclass
class RetrievedChunk:
    """Represents a single retrieved chunk with metadata"""
    content: str
    relevance_score: float
    source: str  # e.g., "global_memory", "chat_12345", "documents/guide.pdf"
    metadata: Dict[str, Any] = field(default_factory=dict)
    chunk_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


@dataclass
class RetrievalContext:
    """Stores all retrieval information for a single agent response"""
    chunks: List[RetrievedChunk] = field(default_factory=list)
    search_queries: List[str] = field(default_factory=list)
    search_strategies: List[str] = field(default_factory=list)
    total_searches: int = 0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def add_chunk(
        self,
        content: str,
        relevance_score: float,
        source: str,
        metadata: Optional[Dict[str, Any]] = None,
        chunk_id: Optional[str] = None
    ):
        """Add a retrieved chunk to the context"""
        chunk = RetrievedChunk(
            content=content,
            relevance_score=relevance_score,
            source=source,
            metadata=metadata or {},
            chunk_id=chunk_id
        )
        self.chunks.append(chunk)
    
    def add_search(self, query: str, strategy: str = "semantic"):
        """Record a search query and strategy"""
        self.search_queries.append(query)
        self.search_strategies.append(strategy)
        self.total_searches += 1
    
    def get_unique_sources(self) -> List[str]:
        """Get list of unique sources"""
        return list({chunk.source for chunk in self.chunks})
    
    def get_chunks_by_source(self, source: str) -> List[RetrievedChunk]:
        """Get all chunks from a specific source"""
        return [chunk for chunk in self.chunks if chunk.source == source]
    
    def get_top_chunks(self, n: int = 5) -> List[RetrievedChunk]:
        """Get top N chunks by relevance score (lower is better for distance metrics)"""
        return sorted(self.chunks, key=lambda x: x.relevance_score)[:n]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "chunks": [chunk.to_dict() for chunk in self.chunks],
            "search_queries": self.search_queries,
            "search_strategies": self.search_strategies,
            "total_searches": self.total_searches,
            "unique_sources": self.get_unique_sources(),
            "total_chunks": len(self.chunks),
            "timestamp": self.timestamp
        }
    
    def clear(self):
        """Clear all retrieval data"""
        self.chunks.clear()
        self.search_queries.clear()
        self.search_strategies.clear()
        self.total_searches = 0


# Context variable to store retrieval context for current request
current_retrieval_context: ContextVar[Optional[RetrievalContext]] = ContextVar(
    'current_retrieval_context', 
    default=None
)


def get_retrieval_context() -> RetrievalContext:
    """Get or create the current retrieval context"""
    context = current_retrieval_context.get()
    if context is None:
        context = RetrievalContext()
        current_retrieval_context.set(context)
    return context


def clear_retrieval_context():
    """Clear the current retrieval context"""
    context = current_retrieval_context.get()
    if context:
        context.clear()
    else:
        current_retrieval_context.set(RetrievalContext())


def set_retrieval_context(context: RetrievalContext):
    """Set the retrieval context"""
    current_retrieval_context.set(context)
