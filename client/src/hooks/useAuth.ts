import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  console.log('useAuth - Query State:', { 
    user, 
    isLoading, 
    error: error?.message, 
    isAuthenticated: !!user 
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}