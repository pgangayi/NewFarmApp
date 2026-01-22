import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ChartData {
  label: string;
  value: number;
  color?: string;
  timestamp?: Date;
}

interface InteractiveChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title?: string;
  width?: number;
  height?: number;
  animated?: boolean;
  interactive?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  onDataPointClick?: (data: ChartData, index: number) => void;
  customColors?: string[];
}

export function InteractiveChart({
  data,
  type,
  title,
  width = 400,
  height = 300,
  animated = true,
  interactive = true,
  showGrid = true,
  showLegend = true,
  onDataPointClick,
  customColors
}: InteractiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getThemeConfig } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: ChartData; index: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ data: ChartData; index: number } | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef<number>();

  const theme = getThemeConfig();

  const defaultColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    theme.success,
    theme.warning,
    theme.error,
    theme.info
  ];

  const colors = customColors || defaultColors;

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;

    ctx.strokeStyle = theme.border + '30';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height, showGrid, theme.border]);

  const drawLineChart = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    if (data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    const stepX = width / (data.length - 1 || 1);

    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = index * stepX;
      const y = height - ((point.value - minValue) / range) * height * progress;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    data.forEach((point, index) => {
      const x = index * stepX;
      const y = height - ((point.value - minValue) / range) * height * progress;
      
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      if (selectedPoint?.index === index) {
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [data, width, height, colors, selectedPoint, theme.text]);

  const drawBarChart = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    if (data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = width / data.length * 0.8;
    const stepX = width / data.length;

    data.forEach((point, index) => {
      const x = index * stepX + (stepX - barWidth) / 2;
      const barHeight = (point.value / maxValue) * height * progress;
      const y = height - barHeight;

      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      if (selectedPoint?.index === index) {
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
      }
    });
  }, [data, width, height, colors, selectedPoint, theme.text]);

  const drawPieChart = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    if (data.length === 0) return;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    let currentAngle = -Math.PI / 2;

    data.forEach((point, index) => {
      const sliceAngle = (point.value / total) * Math.PI * 2 * progress;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      if (selectedPoint?.index === index) {
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius + 5, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.stroke();
      }

      currentAngle += sliceAngle;
    });
  }, [data, width, height, colors, selectedPoint, theme.text]);

  const drawAreaChart = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    if (data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    const stepX = width / (data.length - 1 || 1);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0] + '80');
    gradient.addColorStop(1, colors[0] + '10');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, height);

    data.forEach((point, index) => {
      const x = index * stepX;
      const y = height - ((point.value - minValue) / range) * height * progress;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Draw line on top
    drawLineChart(ctx, progress);
  }, [data, width, height, colors, drawLineChart]);

  const drawScatterChart = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    if (data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - minValue) / range) * height * progress;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      if (selectedPoint?.index === index) {
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [data, width, height, colors, selectedPoint, theme.text]);

  const draw = useCallback((progress: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx);

    // Draw chart based on type
    switch (type) {
      case 'line':
        drawLineChart(ctx, progress);
        break;
      case 'bar':
        drawBarChart(ctx, progress);
        break;
      case 'pie':
        drawPieChart(ctx, progress);
        break;
      case 'area':
        drawAreaChart(ctx, progress);
        break;
      case 'scatter':
        drawScatterChart(ctx, progress);
        break;
    }

    // Draw title
    if (title) {
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, 20);
    }

    // Draw legend
    if (showLegend && type !== 'pie') {
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      
      data.forEach((point, index) => {
        const legendX = 10;
        const legendY = height - 20 - (data.length - index - 1) * 20;
        
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(legendX, legendY - 8, 12, 12);
        
        ctx.fillStyle = theme.text;
        ctx.fillText(point.label, legendX + 20, legendY);
      });
    }
  }, [width, height, type, title, showLegend, drawGrid, drawLineChart, drawBarChart, drawPieChart, drawAreaChart, drawScatterChart, data, colors, theme.text]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onDataPointClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Simple hit detection (can be improved)
    const stepX = width / (data.length - 1 || 1);
    const clickedIndex = Math.round(x / stepX);
    
    if (clickedIndex >= 0 && clickedIndex < data.length) {
      setSelectedPoint({ data: data[clickedIndex], index: clickedIndex });
      onDataPointClick(data[clickedIndex], clickedIndex);
    }
  }, [interactive, onDataPointClick, data, width]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Simple hover detection
    const stepX = width / (data.length - 1 || 1);
    const hoveredIndex = Math.round(x / stepX);
    
    if (hoveredIndex >= 0 && hoveredIndex < data.length) {
      setHoveredPoint({ x, y, data: data[hoveredIndex], index: hoveredIndex });
    } else {
      setHoveredPoint(null);
    }
  }, [interactive, data, width]);

  // Animation
  useEffect(() => {
    if (animated && animationProgress < 1) {
      const animate = () => {
        setAnimationProgress(prev => {
          const next = Math.min(prev + 0.02, 1);
          if (next < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
          return next;
        });
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [animated]);

  // Redraw when data or progress changes
  useEffect(() => {
    draw(animationProgress);
  }, [draw, animationProgress]);

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      />
      
      {hoveredPoint && interactive && (
        <div
          className="absolute bg-gray-900 text-white p-2 rounded shadow-lg pointer-events-none z-10"
          style={{
            left: hoveredPoint.x,
            top: hoveredPoint.y - 40,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-sm font-semibold">{hoveredPoint.data.label}</div>
          <div className="text-xs">{hoveredPoint.data.value.toLocaleString()}</div>
        </div>
      )}
      
      {selectedPoint && (
        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 p-2 rounded text-sm">
          Selected: {selectedPoint.data.label} ({selectedPoint.data.value})
        </div>
      )}
    </div>
  );
}
