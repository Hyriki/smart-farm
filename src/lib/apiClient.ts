interface ApiOptions extends RequestInit {
  data?: unknown;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const apiClient = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  const { data, headers, ...customConfig } = options;
  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': data ? 'application/json' : '',
      ...headers,
    },
    ...customConfig,
  };

  try {
    const response = await fetch(endpoint, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new ApiError(result.message || result.error || 'An error occurred', response.status);
    }
    
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network failure. Please check your connection.', 0);
  }
};
