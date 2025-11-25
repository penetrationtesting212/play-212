/**
 * AI Analysis Controller
 * Proxies requests to Python FastAPI AI Analysis Service
 */

import { Request, Response } from 'express';
import { aiAnalysisProxyService } from '../services/ai-analysis-proxy.service';

/**
 * POST /api/ai-analysis/generate-test
 * Generate test from natural language
 */
export const generateTest = async (req: Request, res: Response) => {
  try {
    const { description, language, framework, context } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: description'
      });
    }

    const result = await aiAnalysisProxyService.generateTest({
      description,
      language,
      framework,
      context
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/analyze-test
 * Analyze test code
 */
export const analyzeTest = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code'
      });
    }

    const result = await aiAnalysisProxyService.analyzeTest({
      code,
      language
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/suggest-locators
 * Suggest semantic locators
 */
export const suggestLocators = async (req: Request, res: Response) => {
  try {
    const { element_context, page_url, screenshot } = req.body;

    if (!element_context || !page_url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: element_context, page_url'
      });
    }

    const result = await aiAnalysisProxyService.suggestLocators({
      element_context,
      page_url,
      screenshot
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/suggest-assertions
 * Suggest assertions
 */
export const suggestAssertions = async (req: Request, res: Response) => {
  try {
    const { code, page_state, action } = req.body;

    if (!code || !page_state || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, page_state, action'
      });
    }

    const result = await aiAnalysisProxyService.suggestAssertions({
      code,
      page_state,
      action
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/repair-test
 * Repair failing test
 */
export const repairTest = async (req: Request, res: Response) => {
  try {
    const { failing_code, error_message, screenshot, context } = req.body;

    if (!failing_code || !error_message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: failing_code, error_message'
      });
    }

    const result = await aiAnalysisProxyService.repairTest({
      failing_code,
      error_message,
      screenshot,
      context
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/review-code
 * Review code
 */
export const reviewCode = async (req: Request, res: Response) => {
  try {
    const { code, language, focus_areas } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code'
      });
    }

    const result = await aiAnalysisProxyService.reviewCode({
      code,
      language,
      focus_areas
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/expand-scenarios
 * Expand test scenarios
 */
export const expandScenarios = async (req: Request, res: Response) => {
  try {
    const { base_scenario, coverage_level, existing_tests } = req.body;

    if (!base_scenario) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: base_scenario'
      });
    }

    const result = await aiAnalysisProxyService.expandScenarios({
      base_scenario,
      coverage_level,
      existing_tests
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/visual-regression
 * Analyze visual regression
 */
export const analyzeVisualRegression = async (req: Request, res: Response) => {
  try {
    const { before_screenshot, after_screenshot, tolerance } = req.body;

    if (!before_screenshot || !after_screenshot) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: before_screenshot, after_screenshot'
      });
    }

    const result = await aiAnalysisProxyService.analyzeVisualRegression({
      before_screenshot,
      after_screenshot,
      tolerance
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/predict-failures
 * Predict test failures
 */
export const predictFailures = async (req: Request, res: Response) => {
  try {
    const result = await aiAnalysisProxyService.predictFailures(req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * GET /api/ai-analysis/health
 * Check AI Analysis service health
 */
export const getHealth = async (_req: Request, res: Response) => {
  try {
    const health = await aiAnalysisProxyService.getHealth();
    return res.json({
      success: true,
      data: health
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/xpath-analyze
 * Deep XPath analysis with AI
 */
export const analyzeXPath = async (req: Request, res: Response) => {
  try {
    const { xpath, page_context } = req.body;

    if (!xpath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: xpath'
      });
    }

    const result = await aiAnalysisProxyService.analyzeXPath({
      xpath,
      page_context
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/playwright-metrics
 * Get comprehensive Playwright metrics
 */
export const getPlaywrightMetrics = async (req: Request, res: Response) => {
  try {
    const { code, test_results, execution_history } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code'
      });
    }

    const result = await aiAnalysisProxyService.getPlaywrightMetrics({
      code,
      test_results,
      execution_history
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/locator-health
 * Analyze locator health
 */
export const analyzeLocatorHealth = async (req: Request, res: Response) => {
  try {
    const { locators, test_history } = req.body;

    if (!locators || !Array.isArray(locators)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: locators (array)'
      });
    }

    const result = await aiAnalysisProxyService.analyzeLocatorHealth({
      locators,
      test_history
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

/**
 * POST /api/ai-analysis/optimize
 * Get Playwright optimization suggestions
 */
export const optimizePlaywright = async (req: Request, res: Response) => {
  try {
    const { code, performance_data } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code'
      });
    }

    const result = await aiAnalysisProxyService.optimizePlaywright({
      code,
      performance_data
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};
