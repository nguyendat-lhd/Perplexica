'use client';

import { useState, useEffect } from 'react';
import { Search, Image, Video, ExternalLink, Star, Zap, Shield, Brain } from 'lucide-react';
import { Document } from '@langchain/core/documents';

interface AIAgentReviewWidgetProps {
  messageId: string;
  sources: Document[];
  chatHistory?: any[];
  userQuery?: string;
}

interface MediaResult {
  title: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

const AIAgentReviewWidget = ({ messageId, sources, chatHistory = [], userQuery = '' }: AIAgentReviewWidgetProps) => {
  const [images, setImages] = useState<MediaResult[]>([]);
  const [videos, setVideos] = useState<MediaResult[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Extract AI agent name from user query for better search
  const getAIAgentName = () => {
    if (!userQuery) return 'AI Agent';
    
    // Look for common AI agent patterns in user query
    const patterns = [
      /ChatGPT|GPT-?4?|OpenAI/i,
      /Claude|Anthropic/i,
      /Bard|Gemini|Google/i,
      /Copilot|GitHub/i,
      /Jasper|Jasper AI/i,
      /Copy\.ai|CopyAI/i,
      /Notion AI/i,
      /Perplexity/i,
      /You\.com|You AI/i,
      /Character\.ai|Character AI/i,
      /Replika/i,
      /Synthesia/i,
      /Runway/i,
      /Midjourney/i,
      /DALL-E|DALL·E/i,
      /Stable Diffusion/i,
      /Nexcyra/i
    ];
    
    for (const pattern of patterns) {
      const match = userQuery.match(pattern);
      if (match) return match[0];
    }
    
    return 'AI Agent';
  };

  const searchImages = async () => {
    setLoadingImages(true);
    try {
      const agentName = getAIAgentName();
      const query = `${agentName} giao diện ảnh chụp màn hình demo`;
      
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, chatHistory }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm hình ảnh:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const searchVideos = async () => {
    setLoadingVideos(true);
    try {
      const agentName = getAIAgentName();
      const query = `${agentName} hướng dẫn demo đánh giá`;
      
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, chatHistory }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm video:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const getAIAgentIcon = (agentName: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('chatgpt') || name.includes('gpt') || name.includes('openai')) {
      return <Brain className="w-5 h-5 text-green-500" />;
    } else if (name.includes('claude') || name.includes('anthropic')) {
      return <Shield className="w-5 h-5 text-orange-500" />;
    } else if (name.includes('bard') || name.includes('gemini') || name.includes('google')) {
      return <Zap className="w-5 h-5 text-blue-500" />;
    } else {
      return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="mt-4 p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-200 dark:border-dark-200">
      <div className="flex items-center gap-2 mb-4">
        {getAIAgentIcon(getAIAgentName())}
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
          Đánh giá AI Agent: {getAIAgentName()}
        </h3>
      </div>

      {/* Media Search Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={searchImages}
          disabled={loadingImages}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm transition-colors"
        >
          <Image className="w-4 h-4" />
          {loadingImages ? 'Đang tìm kiếm...' : 'Tìm hình ảnh'}
        </button>
        <button
          onClick={searchVideos}
          disabled={loadingVideos}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm transition-colors"
        >
          <Video className="w-4 h-4" />
          {loadingVideos ? 'Đang tìm kiếm...' : 'Tìm video'}
        </button>
      </div>

      {/* Images Section */}
      {images.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-light-text dark:text-dark-text mb-3 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Hình ảnh liên quan
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.slice(0, 8).map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-light-200 dark:border-dark-200 hover:shadow-lg transition-shadow"
              >
                <img
                  src={image.thumbnail || image.url}
                  alt={image.title || 'Hình ảnh liên quan đến AI Agent'}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icon.png';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-2">
                  <p className="text-xs text-light-text dark:text-dark-text truncate">
                    {image.title}
                  </p>
                </div>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-light-text dark:text-dark-text mb-3 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Video liên quan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.slice(0, 4).map((video, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-light-200 dark:border-dark-200 hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={video.thumbnail || video.url}
                    alt={video.title || 'AI Agent related video'}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h5 className="text-sm font-medium text-light-text dark:text-dark-text line-clamp-2 mb-1">
                    {video.title}
                  </h5>
                  {video.description && (
                    <p className="text-xs text-light-text/70 dark:text-dark-text/70 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources Section */}
      {sources.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-light-text dark:text-dark-text mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Sources
          </h4>
          <div className="space-y-2">
            {sources.slice(0, 5).map((source, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-light-primary dark:bg-dark-primary rounded-lg border border-light-200 dark:border-dark-200"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-light-text dark:text-dark-text line-clamp-1">
                    {source.metadata?.title || 'Untitled'}
                  </h5>
                  <p className="text-xs text-light-text/70 dark:text-dark-text/70 line-clamp-2 mt-1">
                    {source.pageContent.length > 100 
                      ? source.pageContent.substring(0, 100) + '...' 
                      : source.pageContent}
                  </p>
                  {source.metadata?.url && (
                    <a
                      href={source.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Source
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentReviewWidget;
