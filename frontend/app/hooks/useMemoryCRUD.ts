import { useState, useCallback } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "../config";

export interface Memory {
  memory_id: string;
  content: string;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

export interface CreateMemoryRequest {
  content: string;
  collection: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateMemoryRequest {
  content?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface MemoryListResponse {
  status: string;
  collection: string;
  total: number;
  limit: number;
  offset: number;
  memories: Memory[];
}

export function useMemoryCRUD(collection: string = "global_memory") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new memory
   */
  const createMemory = useCallback(
    async (request: Omit<CreateMemoryRequest, "collection">): Promise<Memory | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/memory/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...request,
            collection,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to create memory");
        }

        const data = await response.json();
        toast.success("Memory created successfully");
        
        return {
          memory_id: data.memory_id,
          content: data.content,
          metadata: data.metadata,
          created_at: data.metadata.created_at,
          tags: data.tags,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create memory";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [collection]
  );

  /**
   * List memories with pagination and filtering
   */
  const listMemories = useCallback(
    async (
      limit: number = 50,
      offset: number = 0,
      tag?: string
    ): Promise<MemoryListResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });
        
        if (tag) {
          params.append("tag", tag);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/memory/list/${collection}?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to list memories");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to list memories";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [collection]
  );

  /**
   * Get a specific memory by ID
   */
  const getMemory = useCallback(
    async (memoryId: string): Promise<Memory | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/memory/${collection}/${memoryId}`
        );

        if (!response.ok) {
          throw new Error("Memory not found");
        }

        const data = await response.json();
        return {
          memory_id: data.memory_id,
          content: data.content,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
          tags: data.tags,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get memory";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [collection]
  );

  /**
   * Update an existing memory
   */
  const updateMemory = useCallback(
    async (
      memoryId: string,
      request: UpdateMemoryRequest
    ): Promise<Memory | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/memory/${collection}/${memoryId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update memory");
        }

        const data = await response.json();
        toast.success("Memory updated successfully");
        
        return {
          memory_id: data.memory_id,
          content: data.content,
          metadata: data.metadata,
          updated_at: data.updated_at,
          tags: data.tags,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update memory";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [collection]
  );

  /**
   * Delete a specific memory
   */
  const deleteMemory = useCallback(
    async (memoryId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/memory/${collection}/${memoryId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete memory");
        }

        toast.success("Memory deleted successfully");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete memory";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collection]
  );

  /**
   * Delete multiple memories
   */
  const bulkDeleteMemories = useCallback(
    async (memoryIds: string[]): Promise<number> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/memory/bulk-delete?collection=${collection}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memory_ids: memoryIds }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete memories");
        }

        const data = await response.json();
        toast.success(`Deleted ${data.deleted_count} memories`);
        return data.deleted_count;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to bulk delete";
        setError(message);
        toast.error(message);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [collection]
  );

  /**
   * Get all tags in collection
   */
  const getAllTags = useCallback(async (): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/memory/tags/${collection}`
      );

      if (!response.ok) {
        throw new Error("Failed to get tags");
      }

      const data = await response.json();
      return data.tags || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get tags";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [collection]);

  return {
    loading,
    error,
    createMemory,
    listMemories,
    getMemory,
    updateMemory,
    deleteMemory,
    bulkDeleteMemories,
    getAllTags,
  };
}
