import React from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();
  private timers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End timing and record the duration
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    // Store the metric
    this.recordMetric(name, {
      duration,
      timestamp: new Date().toISOString(),
      type: 'timer'
    });

    return duration;
  }

  // Record a custom metric
  recordMetric(name: string, value: any): void {
    const existing = this.metrics.get(name) || [];
    existing.push({
      ...value,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last 100 entries per metric
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.metrics.set(name, existing);
  }

  // Get metrics for a specific name
  getMetrics(name: string): any[] {
    return this.metrics.get(name) || [];
  }

  // Get all metrics
  getAllMetrics(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Get performance summary
  getSummary(): any {
    const summary: any = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    this.metrics.forEach((values, name) => {
      if (values.length === 0) return;

      const durations = values
        .filter((v: any) => v.type === 'timer' && typeof v.duration === 'number')
        .map((v: any) => v.duration);

      if (durations.length > 0) {
        summary.metrics[name] = {
          count: durations.length,
          avg: durations.reduce((a: number, b: number) => a + b, 0) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
          last: durations[durations.length - 1]
        };
      }
    });

    return summary;
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Send metrics to backend (if needed)
  async sendMetrics(): Promise<void> {
    try {
      const metrics = this.getAllMetrics();
      
      // Only send if there are metrics and we're not in development
      if (Object.keys(metrics).length === 0 || process.env.NODE_ENV === 'development') {
        return;
      }

      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      // Clear metrics after sending
      this.clear();
    } catch (error) {
      console.warn('Failed to send metrics:', error);
    }
  }
}

// Hook for React components
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();

  const startTimer = (name: string) => monitor.startTimer(name);
  const endTimer = (name: string) => monitor.endTimer(name);
  const recordMetric = (name: string, value: any) => monitor.recordMetric(name, value);

  return { startTimer, endTimer, recordMetric };
};

// Higher-order component for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      monitor.startTimer(`component-${componentName}-mount`);
      
      return () => {
        monitor.endTimer(`component-${componentName}-mount`);
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
};

// Utility functions for common performance tracking
export const trackApiCall = async (name: string, apiCall: () => Promise<any>) => {
  const monitor = PerformanceMonitor.getInstance();
  monitor.startTimer(`api-${name}`);
  
  try {
    const result = await apiCall();
    monitor.endTimer(`api-${name}`);
    monitor.recordMetric(`api-${name}-success`, { success: true });
    return result;
  } catch (error) {
    monitor.endTimer(`api-${name}`);
    monitor.recordMetric(`api-${name}-error`, { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

export const trackUserAction = (action: string, metadata?: any) => {
  const monitor = PerformanceMonitor.getInstance();
  monitor.recordMetric(`user-action-${action}`, {
    action,
    metadata,
    type: 'user-action'
  });
};

// Web Vitals tracking (if available)
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  const monitor = PerformanceMonitor.getInstance();

  // Track page load time
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    monitor.recordMetric('page-load-time', {
      duration: loadTime,
      type: 'web-vital'
    });
  });

  // Track largest contentful paint (if supported)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            monitor.recordMetric('largest-contentful-paint', {
              duration: entry.startTime,
              type: 'web-vital'
            });
          }
        });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  trackWebVitals();
  
  // Send metrics periodically
  setInterval(() => {
    PerformanceMonitor.getInstance().sendMetrics();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Send metrics before page unload
  window.addEventListener('beforeunload', () => {
    PerformanceMonitor.getInstance().sendMetrics();
  });
}; 