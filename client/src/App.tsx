import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageRequestCard } from '@/components/ImageRequestCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { ImageGenerationRequest, CreateImageRequestInput } from '../../server/src/schema';
import './App.css';

function App() {
  const [requests, setRequests] = useState<ImageGenerationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userIdea, setUserIdea] = useState('');
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    "A magical forest with glowing mushrooms",
    "Cyberpunk cityscape at night",
    "Cute dragon reading a book",
    "Steampunk airship in the clouds",
    "Underwater castle with mermaids",
    "Space cat exploring galaxies"
  ];

  const loadRequests = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const result = await trpc.getImageRequests.query();
      setRequests(result);
      setError(null);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setError('Failed to load your creations. Please try refreshing.');
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Auto-refresh for processing requests
  useEffect(() => {
    const hasProcessingRequests = requests.some((req: ImageGenerationRequest) => req.status === 'processing');
    
    if (hasProcessingRequests) {
      const interval = setInterval(() => {
        loadRequests();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [requests, loadRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdea.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const formData: CreateImageRequestInput = {
        user_idea: userIdea.trim()
      };
      
      const response = await trpc.processFullRequest.mutate(formData);
      setRequests((prev: ImageGenerationRequest[]) => [response, ...prev]);
      setUserIdea('');
    } catch (error) {
      console.error('Failed to create image request:', error);
      setError('Failed to create your image request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      completed: 0,
      processing: 0,
      failed: 0,
      pending: 0
    };
    
    requests.forEach((req: ImageGenerationRequest) => {
      counts[req.status as keyof typeof counts]++;
    });
    
    return counts;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      <div className="grid"></div>
      <div className="gradient"></div>
      
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            🎨 AI Image Creator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            Transform your ideas into stunning images with AI! Just describe what you're imagining, and watch it come to life. ✨
          </p>
          
          <div className="max-w-3xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>🚧 Demo Mode:</strong> This application is currently running with mock data handlers. 
                In production, it would connect to real AI services for prompt expansion and image generation.
              </p>
              <details className="text-xs text-yellow-700 dark:text-yellow-300">
                <summary className="cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-200">
                  Click for example prompts to try
                </summary>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                    • "A serene mountain lake at sunset"
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                    • "Cyberpunk city with neon lights"
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                    • "Cute robot gardening flowers"
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                    • "Ancient library with floating books"
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card className="mb-8 border-2 border-dashed border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              💡 Share Your Creative Idea
            </CardTitle>
            <CardDescription>
              Describe anything you can imagine - a scene, character, object, or abstract concept!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="A magical forest with glowing mushrooms and fairy lights..."
                  value={userIdea}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserIdea(e.target.value)}
                  className="text-lg py-6 px-4 pr-20 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-500"
                  maxLength={500}
                  required
                />
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  {userIdea && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserIdea('')}
                      className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      disabled={isLoading}
                    >
                      ✕
                    </Button>
                  )}
                </div>
                <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                  {userIdea.length}/500
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 w-full mb-2">
                  💡 Quick ideas to try:
                </p>
                {examplePrompts.slice(0, 6).map((prompt, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUserIdea(prompt)}
                    className="text-xs bg-white/50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                    disabled={isLoading}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={isLoading || !userIdea.trim()}
                className="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Creating Magic... ✨
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    🚀 Generate Image
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🖼️ Your Creations
              {requests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {requests.length}
                </Badge>
              )}
            </h2>
            
            {requests.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const counts = getStatusCounts();
                    return (
                      <>
                        {counts.completed > 0 && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✨ {counts.completed} completed
                          </Badge>
                        )}
                        {counts.processing > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 processing-pulse">
                            ⚡ {counts.processing} processing
                          </Badge>
                        )}
                        {counts.failed > 0 && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            ❌ {counts.failed} failed
                          </Badge>
                        )}
                        {counts.pending > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            ⏳ {counts.pending} pending
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadRequests(true)}
                  disabled={isRefreshing}
                  className="ml-auto"
                >
                  {isRefreshing ? (
                    <span className="flex items-center gap-1">
                      <LoadingSpinner size="sm" />
                    </span>
                  ) : (
                    '🔄 Refresh'
                  )}
                </Button>
              </div>
            )}
          </div>

          {requests.length === 0 ? (
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-xl font-semibold mb-2">No images yet!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Share your first creative idea above to get started with AI image generation.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>💡 Pro Tip:</strong> Try being descriptive! Instead of "cat", try "a fluffy orange cat sitting in a magical garden with glowing butterflies"
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] scroll-area">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((request: ImageGenerationRequest) => (
                  <ImageRequestCard key={request.id} request={request} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Made with ❤️ and AI magic • Turn your imagination into reality
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;