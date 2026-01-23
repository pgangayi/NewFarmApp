// AI Insights Panel Component
// Displays AI-powered farm recommendations

import React, { useState, useEffect } from 'react';
import { aiService, AIResponse } from '../../services/aiService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, Bot, AlertCircle, CheckCircle } from 'lucide-react';

interface AIInsightsPanelProps {
  farmData?: {
    crops?: any[];
    livestock?: any[];
    currentSeason: string;
    location: string;
  };
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ farmData }) => {
  const [insights, setInsights] = useState<AIResponse | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (farmData) {
      loadGeneralAdvice();
    }
  }, [farmData]);

  const loadGeneralAdvice = async () => {
    if (!farmData) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.getGeneralFarmAdvice(farmData);
      setInsights(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.generateInsights({
        prompt: customPrompt,
        context: farmData,
      });
      setInsights(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (insights?.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Bot className="h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          AI Farm Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Prompt Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ask for specific advice:</label>
          <Textarea
            placeholder="e.g., What's the best approach to pest control for my tomato plants this season?"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleCustomPrompt}
            disabled={!customPrompt.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting AI Advice...
              </>
            ) : (
              'Get AI Advice'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* AI Response */}
        {insights && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">AI Recommendations</h3>
              {insights.model && (
                <span className="text-xs text-gray-500">Model: {insights.model}</span>
              )}
            </div>

            {insights.success ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <pre className="whitespace-pre-wrap text-sm text-blue-800 font-mono">
                  {insights.response}
                </pre>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  {insights.fallbackResponse || insights.error}
                </p>
              </div>
            )}

            {/* Usage Stats */}
            {insights.usage && Object.keys(insights.usage).length > 0 && (
              <div className="text-xs text-gray-500 border-t pt-2">
                <p>Usage: {JSON.stringify(insights.usage)}</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomPrompt('What are the top 3 priorities for my farm this week?')}
            disabled={isLoading}
          >
            Weekly Priorities
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomPrompt('Analyze potential weather risks for my current crops')}
            disabled={isLoading}
          >
            Weather Risks
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomPrompt('Suggest crop rotation plan for next season')}
            disabled={isLoading}
          >
            Crop Rotation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomPrompt('Optimize my resource allocation for better efficiency')}
            disabled={isLoading}
          >
            Resource Optimization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsightsPanel;
