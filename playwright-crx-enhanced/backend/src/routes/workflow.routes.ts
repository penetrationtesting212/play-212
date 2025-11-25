/**
 * Script Workflow Routes
 * RESTful API endpoints for managing script workflow states
 */

import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/workflow/:scriptId/status
 * @desc    Get current workflow status and metadata for a script
 * @access  Private
 */
router.get('/:scriptId/status', (req, res) => workflowController.getWorkflowStatus(req, res));

/**
 * @route   POST /api/workflow/:scriptId/transition
 * @desc    Transition script to a new workflow state
 * @access  Private
 * @body    { targetStatus, action?, comment? }
 */
router.post('/:scriptId/transition', (req, res) => workflowController.transitionStatus(req, res));

/**
 * @route   POST /api/workflow/batch-update
 * @desc    Batch update workflow status for multiple scripts
 * @access  Private
 * @body    { scriptIds: string[], targetStatus: string }
 */
router.post('/batch-update', (req, res) => workflowController.batchUpdateStatus(req, res));

/**
 * @route   GET /api/workflow/status/:status/scripts
 * @desc    Get all scripts with a specific workflow status
 * @access  Private
 */
router.get('/status/:status/scripts', (req, res) => workflowController.getScriptsByStatus(req, res));

/**
 * @route   GET /api/workflow/stats
 * @desc    Get workflow statistics (counts by status)
 * @access  Private
 */
router.get('/stats', (req, res) => workflowController.getWorkflowStats(req, res));

export default router;
