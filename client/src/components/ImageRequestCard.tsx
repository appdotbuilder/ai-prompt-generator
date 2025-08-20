import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from './LoadingSpinner';
import type { ImageGenerationRequest } from '../../../server/src/schema';

interface ImageRequestCardProps {
  request: ImageGenerationRequest;
}

export function ImageRequestCard({ request }: ImageRequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 processing-pulse';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <span className="emoji-float">✨</span>;
      case 'processing': return <span className="emoji-float">⚡</span>;
      case 'failed': return '❌';
      default: return <span className="emoji-float">⏳</span>;
    }
  };

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300 card-hover glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon(request.status)}
            Request #{request.id}
          </CardTitle>
          <Badge className={getStatusColor(request.status)}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Original Idea */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <span className="emoji-float">💭</span> Original Idea:
          </h4>
          <p className="text-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border-l-4 border-purple-400">
            {request.user_idea}
          </p>
        </div>

        {/* Expanded Prompt */}
        {request.expanded_prompt && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <span className="emoji-float">🎯</span> AI Enhanced Prompt:
            </h4>
            <div className="max-h-20 overflow-y-auto">
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                {request.expanded_prompt}
              </p>
            </div>
          </div>
        )}

        {/* Generated Image */}
        {request.image_url ? (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <span className="emoji-float">🖼️</span> Generated Image:
            </h4>
            <div 
              className="relative group cursor-pointer image-overlay"
              onClick={() => handleImageClick(request.image_url!)}
            >
              <img
                src={request.image_url}
                alt={`Generated image for: ${request.user_idea}`}
                className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjxzdHNwYW4geD0iNTAlIiBkeT0iMC4zZW0iPvCfkoEgSW1hZ2U8L3RzdHNwYW4+PHRzdHNwYW4geD0iNTAlIiBkeT0iMS4yZW0iPm5vdCBhdmFpbGFibGU8L3RzdHNwYW4+PC90ZXh0Pjwvc3ZnPg==';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 shadow-lg">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    🔍 Click to open
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          request.status === 'processing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="md" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-3">
                <span className="emoji-float">⚡</span> Generating your image...
              </p>
              <div className="mt-3 w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )
        )}

        {request.status === 'failed' && (
          <div className="text-center py-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-4xl mb-2">😔</div>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Generation failed. Please try again!
            </p>
          </div>
        )}

        <Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            📅 Created: {request.created_at.toLocaleDateString()}
          </span>
          {request.completed_at && (
            <span className="flex items-center gap-1">
              ✅ Completed: {request.completed_at.toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}