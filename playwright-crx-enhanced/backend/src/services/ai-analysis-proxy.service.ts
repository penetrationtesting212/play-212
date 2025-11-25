/**
 * AI Analysis Proxy Service
 * Connects to Python FastAPI AI Analysis Service
 */

import axios, { AxiosInstance } from 'axios';

interface AIAnalysisConfig {
  baseURL: string;
  timeout: number;
}

export class AIAnalysisProxyService {
  private client: AxiosInstance;
  private isConnected: boolean = false;

  constructor(config?: Partial<AIAnalysisConfig>) {
    const defaultConfig: AIAnalysisConfig = {
      baseURL: process.env.AI_ANALYSIS_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.client = axios.create({
      baseURL: finalConfig.baseURL,
      timeout: finalConfig.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.checkConnection();
  }

  /**
   * Check if AI Analysis service is available
   */
  private async checkConnection(): Promise<void> {
    try {
      const response = await this.client.get('/health');
      this.isConnected = response.data.status === 'healthy';
      console.log('✅ AI Analysis Service connected:', response.data);
    } catch (error) {
      this.isConnected = false;
      console.warn('⚠️  AI Analysis Service not available. Service will return fallback responses.');
    }
  }

  /**
   * Generate test from natural language description
   */
  async generateTest(params: {
    description: string;
    language?: string;
    framework?: string;
    context?: any;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/generate-test', {
        description: params.description,
        language: params.language || 'typescript',
        framework: params.framework || 'playwright',
        context: params.context
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis generate-test error:', error);
      throw new Error('Failed to generate test from AI Analysis service');
    }
  }

  /**
   * Analyze test code
   */
  async analyzeTest(params: {
    code: string;
    language?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/analyze-test', {
        code: params.code,
        language: params.language || 'typescript'
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis analyze-test error:', error);
      throw new Error('Failed to analyze test');
    }
  }

  /**
   * Suggest semantic locators
   */
  async suggestLocators(params: {
    element_context: any;
    page_url: string;
    screenshot?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/suggest-locators', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis suggest-locators error:', error);
      throw new Error('Failed to suggest locators');
    }
  }

  /**
   * Suggest assertions
   */
  async suggestAssertions(params: {
    code: string;
    page_state: any;
    action: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/suggest-assertions', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis suggest-assertions error:', error);
      throw new Error('Failed to suggest assertions');
    }
  }

  /**
   * Repair failing test
   */
  async repairTest(params: {
    failing_code: string;
    error_message: string;
    screenshot?: string;
    context?: any;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/repair-test', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis repair-test error:', error);
      throw new Error('Failed to repair test');
    }
  }

  /**
   * Review code
   */
  async reviewCode(params: {
    code: string;
    language?: string;
    focus_areas?: string[];
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/review-code', {
        code: params.code,
        language: params.language || 'typescript',
        focus_areas: params.focus_areas
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis review-code error:', error);
      throw new Error('Failed to review code');
    }
  }

  /**
   * Expand test scenarios
   */
  async expandScenarios(params: {
    base_scenario: string;
    coverage_level?: string;
    existing_tests?: string[];
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/expand-scenarios', {
        base_scenario: params.base_scenario,
        coverage_level: params.coverage_level || 'comprehensive',
        existing_tests: params.existing_tests
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis expand-scenarios error:', error);
      throw new Error('Failed to expand scenarios');
    }
  }

  /**
   * Analyze visual regression
   */
  async analyzeVisualRegression(params: {
    before_screenshot: string;
    after_screenshot: string;
    tolerance?: number;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/visual-regression', {
        before_screenshot: params.before_screenshot,
        after_screenshot: params.after_screenshot,
        tolerance: params.tolerance || 0.95
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis visual-regression error:', error);
      throw new Error('Failed to analyze visual regression');
    }
  }

  /**
   * Predict test failures
   */
  async predictFailures(params: any): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/predict-failures', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis predict-failures error:', error);
      throw new Error('Failed to predict failures');
    }
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      this.isConnected = response.data.status === 'healthy';
      return response.data;
    } catch (error) {
      this.isConnected = false;
      return {
        status: 'unavailable',
        service: 'ai-analysis',
        error: 'Service not reachable'
      };
    }
  }

  /**
   * Deep XPath analysis with AI recommendations
   */
  async analyzeXPath(params: {
    xpath: string;
    page_context?: any;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/xpath-deep-analysis', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis xpath error:', error);
      throw new Error('Failed to analyze XPath');
    }
  }

  /**
   * Get comprehensive Playwright metrics
   */
  async getPlaywrightMetrics(params: {
    code: string;
    test_results?: any;
    execution_history?: any[];
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/playwright-metrics', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis metrics error:', error);
      throw new Error('Failed to get Playwright metrics');
    }
  }

  /**
   * Analyze locator health and stability
   */
  async analyzeLocatorHealth(params: {
    locators: string[];
    test_history?: any[];
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/locator-health', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis locator-health error:', error);
      throw new Error('Failed to analyze locator health');
    }
  }

  /**
   * Get Playwright optimization suggestions
   */
  async optimizePlaywright(params: {
    code: string;
    performance_data?: any;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai-analysis/optimize-playwright', params);
      return response.data;
    } catch (error) {
      console.error('AI Analysis optimize error:', error);
      throw new Error('Failed to optimize Playwright code');
    }
  }

  /**
   * Check if service is connected
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const aiAnalysisProxyService = new AIAnalysisProxyService();
