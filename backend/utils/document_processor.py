"""
Document Processing Module

Handles document ingestion, chunking, and processing for RAG.
Supports multiple file formats: PDF, TXT, MD, DOCX, HTML.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Import document loaders conditionally
try:
    from langchain_community.document_loaders import (
        PyPDFLoader,
        TextLoader,
        UnstructuredMarkdownLoader,
        Docx2txtLoader,
        UnstructuredHTMLLoader
    )
    LOADERS_AVAILABLE = True
except ImportError:
    LOADERS_AVAILABLE = False
    print("⚠️ Warning: Some document loaders not available. Install langchain-community.")


class DocumentProcessor:
    """
    Processes documents for ingestion into vector store.
    Handles multiple formats and intelligent chunking.
    """

    SUPPORTED_EXTENSIONS = {
        '.pdf': 'PDF',
        '.txt': 'Text',
        '.md': 'Markdown',
        '.docx': 'Word',
        '.html': 'HTML',
        '.htm': 'HTML'
    }

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None
    ):
        """
        Initialize document processor.

        Args:
            chunk_size: Maximum size of each chunk
            chunk_overlap: Overlap between chunks for context
            separators: Custom separators for chunking
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Use semantic separators by default
        self.separators = separators or [
            "\n\n\n",  # Multiple newlines (section breaks)
            "\n\n",    # Paragraphs
            "\n",      # Lines
            ". ",      # Sentences
            ", ",      # Clauses
            " ",       # Words
            ""         # Characters
        ]

        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=self.separators,
            length_function=len,
            is_separator_regex=False
        )

    def is_supported(self, file_path: str) -> bool:
        """
        Check if file format is supported.

        Args:
            file_path: Path to the file

        Returns:
            True if supported, False otherwise
        """
        ext = Path(file_path).suffix.lower()
        return ext in self.SUPPORTED_EXTENSIONS

    def get_file_type(self, file_path: str) -> str:
        """
        Get readable file type.

        Args:
            file_path: Path to the file

        Returns:
            File type string
        """
        ext = Path(file_path).suffix.lower()
        return self.SUPPORTED_EXTENSIONS.get(ext, "Unknown")

    def load_document(self, file_path: str) -> List[Document]:
        """
        Load a document based on its file type.

        Args:
            file_path: Path to the document

        Returns:
            List of Document objects (before chunking)
        """
        if not LOADERS_AVAILABLE:
            raise ImportError("Document loaders not available. Install required packages.")

        # Security: Validate path to prevent directory traversal
        resolved_path = Path(file_path).resolve()
        if not os.path.exists(resolved_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Security: Ensure the resolved path is a file (not a directory or symlink to sensitive location)
        if not resolved_path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")

        ext = resolved_path.suffix.lower()

        try:
            # Select appropriate loader
            if ext == '.pdf':
                loader = PyPDFLoader(str(resolved_path))
            elif ext == '.txt':
                loader = TextLoader(str(resolved_path), encoding='utf-8')
            elif ext == '.md':
                loader = UnstructuredMarkdownLoader(str(resolved_path))
            elif ext == '.docx':
                loader = Docx2txtLoader(str(resolved_path))
            elif ext in ['.html', '.htm']:
                loader = UnstructuredHTMLLoader(str(resolved_path))
            else:
                raise ValueError(f"Unsupported file type: {ext}")

            # Load documents
            documents = loader.load()

            # Add source metadata
            for doc in documents:
                doc.metadata.update({
                    'source_file': os.path.basename(file_path),
                    'source_path': file_path,
                    'file_type': self.get_file_type(file_path),
                    'ingested_at': datetime.now().isoformat()
                })

            return documents

        except Exception as e:
            raise Exception(f"Error loading {file_path}: {str(e)}")

    def chunk_documents(
        self,
        documents: List[Document],
        add_chunk_metadata: bool = True
    ) -> List[Document]:
        """
        Split documents into chunks with intelligent splitting.

        Args:
            documents: List of documents to chunk
            add_chunk_metadata: Whether to add chunk-specific metadata

        Returns:
            List of chunked documents
        """
        try:
            # Split documents
            chunks = self.text_splitter.split_documents(documents)

            # Add chunk metadata
            if add_chunk_metadata:
                for i, chunk in enumerate(chunks):
                    chunk.metadata.update({
                        'chunk_id': i,
                        'chunk_size': len(chunk.page_content),
                        'total_chunks': len(chunks)
                    })

            return chunks

        except Exception as e:
            raise Exception(f"Error chunking documents: {str(e)}")

    def process_file(
        self,
        file_path: str,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Complete processing pipeline: load -> chunk -> enrich.

        Args:
            file_path: Path to the file
            additional_metadata: Extra metadata to add to all chunks

        Returns:
            List of processed document chunks ready for embedding
        """
        try:
            # Validate file
            if not self.is_supported(file_path):
                raise ValueError(f"Unsupported file type: {Path(file_path).suffix}")

            # Load document
            documents = self.load_document(file_path)

            # Add additional metadata if provided
            if additional_metadata:
                for doc in documents:
                    doc.metadata.update(additional_metadata)

            # Chunk documents
            chunks = self.chunk_documents(documents)

            print(f"✅ Processed {file_path}: {len(chunks)} chunks created")

            return chunks

        except Exception as e:
            print(f"❌ Error processing {file_path}: {str(e)}")
            raise

    def process_directory(
        self,
        directory_path: str,
        recursive: bool = True,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Process all supported documents in a directory.

        Args:
            directory_path: Path to the directory
            recursive: Whether to search subdirectories
            additional_metadata: Extra metadata for all documents

        Returns:
            List of all processed chunks
        """
        all_chunks = []

        # Get all files
        path = Path(directory_path)
        pattern = "**/*" if recursive else "*"

        files = [f for f in path.glob(pattern) if f.is_file() and self.is_supported(str(f))]

        print(f"📁 Found {len(files)} supported files in {directory_path}")

        # Process each file
        for file_path in files:
            try:
                chunks = self.process_file(str(file_path), additional_metadata)
                all_chunks.extend(chunks)
            except Exception as e:
                print(f"⚠️ Skipping {file_path}: {str(e)}")
                continue

        print(f"✅ Total: {len(all_chunks)} chunks from {len(files)} files")

        return all_chunks

    def process_text(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Process raw text directly.

        Args:
            text: Raw text content
            metadata: Metadata for the document

        Returns:
            List of chunked documents
        """
        # Create document
        doc = Document(
            page_content=text,
            metadata=metadata or {}
        )

        # Add processing metadata
        doc.metadata.update({
            'source': 'raw_text',
            'ingested_at': datetime.now().isoformat()
        })

        # Chunk
        chunks = self.text_splitter.split_documents([doc])

        # Add chunk metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                'chunk_id': i,
                'chunk_size': len(chunk.page_content),
                'total_chunks': len(chunks)
            })

        return chunks


# Utility function for quick file processing
def process_file(file_path: str, **kwargs) -> List[Document]:
    """
    Quick utility to process a single file.

    Args:
        file_path: Path to file
        **kwargs: Additional arguments for DocumentProcessor

    Returns:
        List of processed chunks
    """
    processor = DocumentProcessor(**kwargs)
    return processor.process_file(file_path)


# For testing
if __name__ == "__main__":
    print("Testing Document Processor...")

    # Create test file
    test_file = "test_document.txt"
    with open(test_file, "w") as f:
        f.write("""
This is a test document for the RAG system.

Python is a high-level programming language known for its simplicity and readability.
It's widely used in web development, data science, machine learning, and automation.

Machine learning is a subset of artificial intelligence that focuses on building systems
that can learn from data and improve their performance over time without being explicitly programmed.

Vector databases are specialized databases designed to store and query high-dimensional vectors,
making them ideal for similarity search and retrieval-augmented generation systems.
        """)

    # Test processing
    try:
        processor = DocumentProcessor(chunk_size=200, chunk_overlap=50)
        chunks = processor.process_file(test_file)

        print(f"\nCreated {len(chunks)} chunks:")
        for i, chunk in enumerate(chunks):
            print(f"\n--- Chunk {i} ---")
            print(f"Content: {chunk.page_content[:100]}...")
            print(f"Metadata: {chunk.metadata}")

    finally:
        # Cleanup
        if os.path.exists(test_file):
            os.remove(test_file)

    print("\nTest completed!")
