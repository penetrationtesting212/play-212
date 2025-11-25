/**
 * Script Pipeline Routes
 * RESTful API endpoints for script workflow pipeline orchestration
 */

import { Router } from 'express';
import { pipelineController } from '../controllers/pipeline.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/pipeline/:scriptId/run-ai
 * @desc    Run AI enhancement on script (draft → ai_enhanced)
 * @access  Private
 * @body    { goals?: string[] }
 */
router.post('/:scriptId/run-ai', (req, res) => pipelineController.runAiEnhancement(req, res));

/**
 * @route   POST /api/pipeline/:scriptId/generate-testdata
 * @desc    Generate test data for script (ai_enhanced → testdata_ready)
 * @access  Private
 * @body    { dataTypes?: string[], count?: number, suiteId?: string }
 */
router.post('/:scriptId/generate-testdata', (req, res) => pipelineController.generateTestData(req, res));

/**
 * @route   POST /api/pipeline/:scriptId/submit-review
 * @desc    Submit script for human review (testdata_ready → human_review)
 * @access  Private
 * @body    { reviewNotes?: string }
 */
router.post('/:scriptId/submit-review', (req, res) => pipelineController.submitForReview(req, res));

/**
 * @route   POST /api/pipeline/:scriptId/finalize
 * @desc    Finalize and approve script (human_review → finalized)
 * @access  Private
 * @body    { approved: boolean, comments?: string }
 */
router.post('/:scriptId/finalize', (req, res) => pipelineController.finalizeScript(req, res));

/**
 * @route   GET /api/pipeline/:scriptId/insights
 * @desc    Generate AI insights for script (analysis of test runs and failures)
 * @access  Private
 */
router.get('/:scriptId/insights', (req, res) => pipelineController.generateInsights(req, res));

/**
 * @route   GET /api/pipeline/:scriptId/overview
 * @desc    Get complete pipeline overview and progress for a script
 * @access  Private
 */
router.get('/:scriptId/overview', (req, res) => pipelineController.getPipelineOverview(req, res));

export default router;
