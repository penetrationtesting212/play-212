/**
 * AI Analysis Routes
 * Routes for LLM-powered analysis features
 */

import { Router } from 'express';
import * as aiAnalysisController from '../controllers/ai-analysis.controller';

const router = Router();

// Test Generation
router.post('/generate-test', aiAnalysisController.generateTest);

// Test Analysis
router.post('/analyze-test', aiAnalysisController.analyzeTest);

// Locator Suggestions
router.post('/suggest-locators', aiAnalysisController.suggestLocators);

// Assertion Suggestions
router.post('/suggest-assertions', aiAnalysisController.suggestAssertions);

// Test Repair
router.post('/repair-test', aiAnalysisController.repairTest);

// Code Review
router.post('/review-code', aiAnalysisController.reviewCode);

// Scenario Expansion
router.post('/expand-scenarios', aiAnalysisController.expandScenarios);

// Visual Regression
router.post('/visual-regression', aiAnalysisController.analyzeVisualRegression);

// Failure Prediction
router.post('/predict-failures', aiAnalysisController.predictFailures);

// Playwright-Specific Endpoints
router.post('/xpath-analyze', aiAnalysisController.analyzeXPath);
router.post('/playwright-metrics', aiAnalysisController.getPlaywrightMetrics);
router.post('/locator-health', aiAnalysisController.analyzeLocatorHealth);
router.post('/optimize', aiAnalysisController.optimizePlaywright);

// Health Check
router.get('/health', aiAnalysisController.getHealth);

export default router;
