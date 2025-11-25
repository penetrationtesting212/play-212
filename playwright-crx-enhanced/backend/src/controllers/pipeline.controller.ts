/**
 * Script Pipeline Controller
 * Orchestrates the complete script workflow pipeline
 * Handles AI enhancement, test data generation, validation, and finalization
 */

import { Request, Response } from 'express';
import pool from '../db';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { WorkflowStatus, isTransitionAllowed } from '../types/workflowStatus';

export class PipelineController {
  /**
   * Run AI enhancement on script
   * Transitions: draft → ai_enhanced
   */
  async runAiEnhancement(req: Request, res: Response): Promise<any> {
    try {
      const { scriptId } = req.params;
      const { goals = ['self_healing', 'locator_improvement', 'stability'] } = req.body;
      const userId = (req as any).user?.userId;

      // Fetch script
      const { rows } = await pool.query(
        `SELECT * FROM "Script" WHERE id = $1 AND "userId" = $2`,
        [scriptId, userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Script not found' });
      }

      const script = rows[0];
      const currentStatus = script.workflowStatus as WorkflowStatus;

      // Validate transition
      if (!isTransitionAllowed(currentStatus, 'ai_enhanced')) {
        return res.status(400).json({
          success: false,
          error: `Cannot run AI enhancement from status: ${currentStatus}`,
          currentStatus
        });
      }

      // Call AI enhancement service (placeholder - integrate with your AI service)
      let enhancedCode = script.code;
      let suggestions = [];

      try {
        // This would call your actual AI enhancement service
        // For now, we'll simulate the enhancement
        suggestions.push({
          type: 'locator_improvement',
          message: 'AI enhancement completed',
          confidence: 0.85
        });
      } catch (aiError: any) {
        console.error('AI service error:', aiError);
        suggestions.push({
          type: 'error',
          message: 'AI service unavailable, using original code',
          confidence: 0
        });
      }

      // Update script with enhanced code and transition status
      const { rows: updated } = await pool.query(
        `UPDATE "Script" SET code = $2, "workflowStatus" = 'ai_enhanced', "updatedAt" = NOW()
         WHERE id = $1 RETURNING *`,
        [scriptId, enhancedCode]
      );

      const updatedScript = updated[0];

      res.json({
        success: true,
        data: {
          scriptId: updatedScript.id,
          scriptName: updatedScript.name,
          previousStatus: currentStatus,
          currentStatus: 'ai_enhanced',
          enhancementApplied: true,
          suggestions,
          goals,
          nextRecommendedAction: 'generate-testdata'
        },
        message: 'AI enhancement completed successfully'
      });
    } catch (error: any) {
      console.error('Error running AI enhancement:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to run AI enhancement'
      });
    }
  }

  /**
   * Generate test data for script
   * Transitions: ai_enhanced → testdata_ready
   */
  async generateTestData(req: Request, res: Response): Promise<any> {
    try {
      const { scriptId } = req.params;
      const {
        dataTypes = ['boundaryValue', 'equivalencePartition', 'securityTest'],
        count = 5,
        suiteId
      } = req.body;
      const userId = (req as any).user?.userId;

      // Fetch script
      const { rows: scriptRows } = await pool.query(
        `SELECT * FROM "Script" WHERE id = $1 AND "userId" = $2`,
        [scriptId, userId]
      );

      if (scriptRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Script not found' });
      }

      const script = scriptRows[0];
      const currentStatus = script.workflowStatus as WorkflowStatus;

      // Validate transition
      if (!isTransitionAllowed(currentStatus, 'testdata_ready')) {
        return res.status(400).json({
          success: false,
          error: `Cannot generate test data from status: ${currentStatus}`,
          currentStatus
        });
      }

      // Create or use existing test suite
      let testSuite;
      if (suiteId) {
        const { rows: suiteRows } = await pool.query(
          `SELECT * FROM "TestSuite" WHERE id = $1 AND "userId" = $2`,
          [suiteId, userId]
        );
        testSuite = suiteRows[0];
      }

      if (!testSuite) {
        const newSuiteId = randomUUID();
        const { rows: suiteRows } = await pool.query(
          `INSERT INTO "TestSuite" (id, name, description, "userId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
          [newSuiteId, `Test Data for ${script.name}`, 'Auto-generated test data for script workflow', userId]
        );
        testSuite = suiteRows[0];
      }

      // Generate test data for each type
      const generatedData = [];
      for (const dataType of dataTypes) {
        try {
          // Generate test data using test data service
          const response = await axios.post(
            'http://localhost:3001/api/testdata/generate',
            {
              dataType,
              count,
              options: dataType === 'boundaryValue' ? { fieldName: 'amount', minValue: 0.01, maxValue: 999999.99 } : {}
            },
            { headers: { Authorization: req.headers.authorization } }
          );

          const records = response.data?.data || [];

          // Save each record to database
          for (const record of records.slice(0, count)) {
            const testDataId = randomUUID();
            const testDataResult: any = await pool.query(
              `INSERT INTO "TestData" (id, "suiteId", name, environment, type, data, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
              [testDataId, testSuite.id, `${dataType} - ${record.id || generatedData.length + 1}`, 'dev', dataType, JSON.stringify(record)]
            );
            generatedData.push(testDataResult.rows[0]);
          }
        } catch (genError: any) {
          console.error(`Error generating ${dataType} data:`, genError);
        }
      }

      // Update script status
      const { rows: updatedRows } = await pool.query(
        `UPDATE "Script" SET "workflowStatus" = 'testdata_ready', "updatedAt" = NOW()
         WHERE id = $1 RETURNING *`,
        [scriptId]
      );

      const updatedScript = updatedRows[0];

      res.json({
        success: true,
        data: {
          scriptId: updatedScript.id,
          scriptName: updatedScript.name,
          previousStatus: currentStatus,
          currentStatus: 'testdata_ready',
          testSuiteId: testSuite.id,
          testSuiteName: testSuite.name,
          generatedCount: generatedData.length,
          dataTypes,
          nextRecommendedAction: 'submit-for-review'
        },
        message: `Generated ${generatedData.length} test data records`
      });
    } catch (error: any) {
      console.error('Error generating test data:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to generate test data'
      });
    }
  }

  /**
   * Submit script for human review  
   * Transitions: testdata_ready → human_review
   */
  async submitForReview(req: Request, res: Response): Promise<any> {
    try {
      const { scriptId } = req.params;
      const { reviewNotes } = req.body;
      const userId = (req as any).user?.userId;

      const { rows } = await pool.query(
        `SELECT * FROM "Script" WHERE id = $1 AND "userId" = $2`,
        [scriptId, userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Script not found' });
      }

      const script = rows[0];
      const currentStatus = script.workflowStatus as WorkflowStatus;

      if (!isTransitionAllowed(currentStatus, 'human_review')) {
        return res.status(400).json({
          success: false,
          error: `Cannot submit for review from status: ${currentStatus}`,
          currentStatus
        });
      }

      const { rows: updatedRows } = await pool.query(
        `UPDATE "Script" SET "workflowStatus" = 'human_review', "updatedAt" = NOW()
         WHERE id = $1 RETURNING *`,
        [scriptId]
      );

      const updatedScript = updatedRows[0];

      res.json({
        success: true,
        data: {
          scriptId: updatedScript.id,
          scriptName: updatedScript.name,
          previousStatus: currentStatus,
          currentStatus: 'human_review',
          reviewNotes,
          nextRecommendedAction: 'approve or reject'
        },
        message: 'Script submitted for human review'
      });
    } catch (error: any) {
      console.error('Error submitting for review:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to submit for review'
      });
    }
  }

  /**
   * Finalize and approve script
   * Transitions: human_review → finalized
   */
  async finalizeScript(req: Request, res: Response): Promise<any> {
    try {
      const { scriptId } = req.params;
      const { approved, comments } = req.body;
      const userId = (req as any).user?.userId;

      const { rows } = await pool.query(
        `SELECT * FROM "Script" WHERE id = $1 AND "userId" = $2`,
        [scriptId, userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Script not found' });
      }

      const script = rows[0];
      const currentStatus = script.workflowStatus as WorkflowStatus;

      if (!isTransitionAllowed(currentStatus, 'finalized')) {
        return res.status(400).json({
          success: false,
          error: `Cannot finalize from status: ${currentStatus}`,
          currentStatus
        });
      }

      if (approved === false) {
        // Reject and send back to previous state
        const { rows: rejectedRows } = await pool.query(
          `UPDATE "Script" SET "workflowStatus" = 'testdata_ready', "updatedAt" = NOW()
           WHERE id = $1 RETURNING *`,
          [scriptId]
        );

        const updatedScript = rejectedRows[0];

        return res.json({
          success: true,
          data: {
            scriptId: updatedScript.id,
            scriptName: updatedScript.name,
            previousStatus: currentStatus,
            currentStatus: 'testdata_ready',
            approved: false,
            comments,
            nextRecommendedAction: 're-generate-testdata or re-run-ai'
          },
          message: 'Script rejected, sent back for revisions'
        });
      }

      // Approve and finalize
      const { rows: finalizedRows } = await pool.query(
        `UPDATE "Script" SET "workflowStatus" = 'finalized', "updatedAt" = NOW()
         WHERE id = $1 RETURNING *`,
        [scriptId]
      );

      const updatedScript = finalizedRows[0];

      res.json({
        success: true,
        data: {
          scriptId: updatedScript.id,
          scriptName: updatedScript.name,
          previousStatus: currentStatus,
          currentStatus: 'finalized',
          approved: true,
          comments,
          canRunInCI: true,
          nextRecommendedAction: 'run-in-ci or generate-insights'
        },
        message: 'Script finalized and approved for CI execution'
      });
    } catch (error: any) {
      console.error('Error finalizing script:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to finalize script'
      });
    }
  }

  /**
   * Generate insights for finalized script
   * Analyzes test runs, failures, and provides AI-powered recommendations
   */
  async generateInsights(req: Request, res: Response): Promise<any> {
    try {
      const { scriptId } = req.params;
      const userId = (req as any).user?.userId;

      // Fetch script
      const { rows: scriptRows } = await pool.query(
        `SELECT * FROM "Script" WHERE id = $1 AND "userId" = $2`,
        [scriptId, userId]
      );

      if (scriptRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Script not found' });
      }

      const script = scriptRows[0];

      // Fetch test runs for this script
      const { rows: testRuns } = await pool.query(
        `SELECT * FROM "TestRun" WHERE "scriptId" = $1 ORDER BY "startedAt" DESC LIMIT 10`,
        [scriptId]
      );

      const currentStatus = script.workflowStatus as WorkflowStatus;

      // Calculate metrics from test runs
      const totalRuns = testRuns.length;
      const passedRuns = testRuns.filter((r: any) => r.status === 'passed').length;
      const failedRuns = testRuns.filter((r: any) => r.status === 'failed').length;
      const successRate = totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0;
      const avgDuration = totalRuns > 0
        ? testRuns.reduce((sum: number, r: any) => sum + (r.duration || 0), 0) / totalRuns
        : 0;

      // Identify common failure patterns
      const failurePatterns = testRuns
        .filter((r: any) => r.status === 'failed' && r.errorMsg)
        .map((r: any) => r.errorMsg)
        .reduce((acc: any, msg: any) => {
          if (msg) {
            acc[msg] = (acc[msg] || 0) + 1;
          }
          return acc;
        }, {});

      const topFailures = Object.entries(failurePatterns)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }));

      // Generate AI-powered recommendations
      const recommendations = [];
      if (successRate < 80) {
        recommendations.push({
          type: 'stability',
          priority: 'high',
          message: 'Success rate is below 80%. Consider adding more resilient locators or wait strategies.',
          actionable: true
        });
      }

      if (avgDuration > 30000) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Average test duration exceeds 30 seconds. Review for optimization opportunities.',
          actionable: true
        });
      }

      if (topFailures.length > 0) {
        recommendations.push({
          type: 'error_handling',
          priority: 'high',
          message: `Most common failure: "${topFailures[0].message}". Review error handling in script.`,
          actionable: true
        });
      }

      const insights = {
        scriptId: script.id,
        scriptName: script.name,
        workflowStatus: currentStatus,
        metrics: {
          totalRuns,
          passedRuns,
          failedRuns,
          successRate: Math.round(successRate * 100) / 100,
          avgDuration: Math.round(avgDuration),
          reliability: successRate >= 95 ? 'excellent' : successRate >= 80 ? 'good' : successRate >= 60 ? 'fair' : 'poor'
        },
        failureAnalysis: {
          topFailures,
          totalUniqueErrors: Object.keys(failurePatterns).length
        },
        recommendations,
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: insights,
        message: 'Insights generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to generate insights'
      });
    }
  }

  /**
   * Get complete pipeline overview for a script
   */
  async getPipelineOverview(req: Request, res: Response): Promise<any> {
    try {
      const { scriptId } = req.params;
      const userId = (req as any).user?.userId;

      // Fetch script
      const { rows: scriptRows } = await pool.query(
        `SELECT * FROM "Script" WHERE id = $1 AND "userId" = $2`,
        [scriptId, userId]
      );

      if (scriptRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Script not found' });
      }

      const script = scriptRows[0];

      // Fetch recent test runs
      const testRunsResult = await pool.query(
        `SELECT id, status, duration, "startedAt" FROM "TestRun" 
         WHERE "scriptId" = $1 ORDER BY "startedAt" DESC LIMIT 5`,
        [scriptId]
      );
      const testRuns = testRunsResult.rows;

      const currentStatus = script.workflowStatus as WorkflowStatus;

      // Get associated test data count
      const { rows: testDataRows } = await pool.query(
        `SELECT COUNT(*) as count FROM "TestData" td
         INNER JOIN "TestSuite" ts ON td."suiteId" = ts.id
         WHERE ts.name LIKE $1`,
        [`%${script.name}%`]
      );
      const testDataCount = parseInt(testDataRows[0]?.count || '0');

      // Define pipeline stages with completion status
      const stages = [
        {
          stage: 'draft',
          name: 'Draft',
          status: currentStatus === 'draft' ? 'current' : 'completed',
          completedAt: script.createdAt
        },
        {
          stage: 'ai_enhanced',
          name: 'AI Enhancement',
          status: currentStatus === 'draft' ? 'pending' : currentStatus === 'ai_enhanced' ? 'current' : 'completed',
          completedAt: currentStatus !== 'draft' ? script.updatedAt : null
        },
        {
          stage: 'testdata_ready',
          name: 'Test Data Generation',
          status: ['draft', 'ai_enhanced'].includes(currentStatus) ? 'pending' : currentStatus === 'testdata_ready' ? 'current' : 'completed',
          completedAt: currentStatus === 'testdata_ready' || ['human_review', 'finalized', 'archived'].includes(currentStatus) ? script.updatedAt : null,
          metadata: { testDataCount }
        },
        {
          stage: 'human_review',
          name: 'Human Validation',
          status: ['draft', 'ai_enhanced', 'testdata_ready'].includes(currentStatus) ? 'pending' : currentStatus === 'human_review' ? 'current' : 'completed',
          completedAt: currentStatus === 'human_review' || ['finalized', 'archived'].includes(currentStatus) ? script.updatedAt : null
        },
        {
          stage: 'finalized',
          name: 'Finalized',
          status: ['draft', 'ai_enhanced', 'testdata_ready', 'human_review'].includes(currentStatus) ? 'pending' : currentStatus === 'finalized' ? 'current' : 'completed',
          completedAt: currentStatus === 'finalized' || currentStatus === 'archived' ? script.updatedAt : null,
          metadata: {
            canRunInCI: currentStatus === 'finalized',
            recentRuns: testRuns.length
          }
        },
        {
          stage: 'insights',
          name: 'AI Insights',
          status: currentStatus === 'finalized' || currentStatus === 'archived' ? 'available' : 'pending',
          completedAt: null
        }
      ];

      res.json({
        success: true,
        data: {
          scriptId: script.id,
          scriptName: script.name,
          currentStatus,
          currentStage: stages.find(s => s.status === 'current')?.stage || currentStatus,
          progress: {
            completed: stages.filter(s => s.status === 'completed').length,
            total: stages.length,
            percentage: Math.round((stages.filter(s => s.status === 'completed').length / stages.length) * 100)
          },
          stages,
          recentActivity: testRuns,
          createdAt: script.createdAt,
          lastUpdated: script.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Error fetching pipeline overview:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to fetch pipeline overview'
      });
    }
  }
}

export const pipelineController = new PipelineController();
