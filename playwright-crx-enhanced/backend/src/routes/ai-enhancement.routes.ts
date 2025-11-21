/**
 * AI Enhancement Routes
 * Routes for Visual AI, Context-Aware Locators, and XPath Analysis
 */

import { Router } from 'express';
import * as aiEnhancementController from '../controllers/ai-enhancement.controller';

const router = Router();

// Visual AI Endpoints
router.post('/visual-fingerprint', aiEnhancementController.createVisualFingerprint);
router.post('/visual-compare', aiEnhancementController.compareVisualFingerprints);
router.post('/screenshot-analyze', aiEnhancementController.analyzeScreenshot);
router.post('/visual-similarity', aiEnhancementController.findByVisualSimilarity);
router.post('/layout-changes', aiEnhancementController.detectLayoutChanges);

// Context-Aware Locator Endpoints
router.post('/context-aware-locators', aiEnhancementController.generateContextAwareLocators);

// XPath Analysis Endpoints
router.post('/xpath-analyze', aiEnhancementController.analyzeXPath);
router.post('/xpath-batch-analyze', aiEnhancementController.batchAnalyzeXPath);

// Comprehensive Analysis
router.post('/comprehensive-analyze', aiEnhancementController.comprehensiveAnalyze);

// Stats
router.get('/stats', aiEnhancementController.getEnhancementStats);

export default router;
