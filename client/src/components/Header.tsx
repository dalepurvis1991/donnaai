import { Button } from "@/components/ui/button";
import { Mail, RefreshCw } from "lucide-react";

interface HeaderProps {
  connectionStatus: "connected" | "disconnected";
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ connectionStatus, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-baron-blue to-baron-indigo rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Baron</h1>
              <p className="text-xs text-slate-500">Email Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-slate-600">
                {connectionStatus === 'connected' ? 'Connected to Gmail' : 'Gmail Disconnected'}
              </span>
            </div>
            
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
