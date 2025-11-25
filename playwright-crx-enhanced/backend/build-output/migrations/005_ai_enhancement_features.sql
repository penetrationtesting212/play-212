-- =====================================================
-- AI Enhancement Features Migration
-- Description: Tables for Visual AI, Context-Aware Locators, and XPath Analysis
-- Created: 2025
-- =====================================================

-- =====================================================
-- TABLE: VisualFingerprint
-- Stores visual fingerprints for elements
-- =====================================================
CREATE TABLE IF NOT EXISTS "VisualFingerprint" (
    id VARCHAR(200) PRIMARY KEY,
    "elementId" VARCHAR(200) NOT NULL,
    "scriptId" VARCHAR(200),
    "testRunId" VARCHAR(200),
    "visualHash" VARCHAR(500) NOT NULL,
    position JSONB NOT NULL,
    size JSONB NOT NULL,
    "computedStyles" JSONB,
    "textContent" TEXT,
    screenshot TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "VisualFingerprint_scriptId_fkey" FOREIGN KEY ("scriptId") 
        REFERENCES "Script"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisualFingerprint_testRunId_fkey" FOREIGN KEY ("testRunId") 
        REFERENCES "TestRun"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VisualFingerprint_elementId_idx" ON "VisualFingerprint"("elementId");
CREATE INDEX "VisualFingerprint_scriptId_idx" ON "VisualFingerprint"("scriptId");
CREATE INDEX "VisualFingerprint_testRunId_idx" ON "VisualFingerprint"("testRunId");
CREATE INDEX "VisualFingerprint_visualHash_idx" ON "VisualFingerprint"("visualHash");

-- =====================================================
-- TABLE: VisualComparison
-- Stores visual comparison results
-- =====================================================
CREATE TABLE IF NOT EXISTS "VisualComparison" (
    id VARCHAR(200) PRIMARY KEY,
    "fingerprint1Id" VARCHAR(200) NOT NULL,
    "fingerprint2Id" VARCHAR(200) NOT NULL,
    similarity DECIMAL(5,4) NOT NULL,
    "isMatch" BOOLEAN NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    differences JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "VisualComparison_fingerprint1Id_fkey" FOREIGN KEY ("fingerprint1Id") 
        REFERENCES "VisualFingerprint"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisualComparison_fingerprint2Id_fkey" FOREIGN KEY ("fingerprint2Id") 
        REFERENCES "VisualFingerprint"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VisualComparison_fingerprint1Id_idx" ON "VisualComparison"("fingerprint1Id");
CREATE INDEX "VisualComparison_fingerprint2Id_idx" ON "VisualComparison"("fingerprint2Id");
CREATE INDEX "VisualComparison_similarity_idx" ON "VisualComparison"(similarity);

-- =====================================================
-- TABLE: ScreenshotAnalysis
-- Stores screenshot analysis results
-- =====================================================
CREATE TABLE IF NOT EXISTS "ScreenshotAnalysis" (
    id VARCHAR(200) PRIMARY KEY,
    "testRunId" VARCHAR(200),
    screenshot TEXT NOT NULL,
    elements JSONB,
    "layoutStructure" JSONB,
    "colorScheme" JSONB,
    accessibility JSONB,
    "analysisTimestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "ScreenshotAnalysis_testRunId_fkey" FOREIGN KEY ("testRunId") 
        REFERENCES "TestRun"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ScreenshotAnalysis_testRunId_idx" ON "ScreenshotAnalysis"("testRunId");

-- =====================================================
-- TABLE: LayoutChange
-- Stores detected layout changes
-- =====================================================
CREATE TABLE IF NOT EXISTS "LayoutChange" (
    id VARCHAR(200) PRIMARY KEY,
    "testRunId" VARCHAR(200),
    "beforeScreenshot" TEXT NOT NULL,
    "afterScreenshot" TEXT NOT NULL,
    "hasChanges" BOOLEAN NOT NULL,
    "changePercentage" DECIMAL(5,2),
    "affectedRegions" JSONB,
    "detectedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "LayoutChange_testRunId_fkey" FOREIGN KEY ("testRunId") 
        REFERENCES "TestRun"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LayoutChange_testRunId_idx" ON "LayoutChange"("testRunId");
CREATE INDEX "LayoutChange_hasChanges_idx" ON "LayoutChange"("hasChanges");

-- =====================================================
-- TABLE: ContextAwareLocator
-- Stores context-aware locator suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS "ContextAwareLocator" (
    id VARCHAR(200) PRIMARY KEY,
    "scriptId" VARCHAR(200),
    "elementContext" JSONB NOT NULL,
    suggestions JSONB NOT NULL,
    "bestSuggestion" JSONB,
    "suggestionsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "appliedAt" TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    CONSTRAINT "ContextAwareLocator_scriptId_fkey" FOREIGN KEY ("scriptId") 
        REFERENCES "Script"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContextAwareLocator_scriptId_idx" ON "ContextAwareLocator"("scriptId");
CREATE INDEX "ContextAwareLocator_status_idx" ON "ContextAwareLocator"(status);

-- =====================================================
-- TABLE: XPathAnalysis
-- Stores XPath analysis and conversion suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS "XPathAnalysis" (
    id VARCHAR(200) PRIMARY KEY,
    "scriptId" VARCHAR(200),
    xpath TEXT NOT NULL,
    "isXPath" BOOLEAN NOT NULL,
    type VARCHAR(50),
    complexity INTEGER,
    stability VARCHAR(50),
    issues JSONB,
    suggestions JSONB,
    "analysisTimestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "conversionApplied" BOOLEAN DEFAULT false,
    "appliedSuggestionId" VARCHAR(200),
    CONSTRAINT "XPathAnalysis_scriptId_fkey" FOREIGN KEY ("scriptId") 
        REFERENCES "Script"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "XPathAnalysis_scriptId_idx" ON "XPathAnalysis"("scriptId");
CREATE INDEX "XPathAnalysis_isXPath_idx" ON "XPathAnalysis"("isXPath");
CREATE INDEX "XPathAnalysis_type_idx" ON "XPathAnalysis"(type);
CREATE INDEX "XPathAnalysis_stability_idx" ON "XPathAnalysis"(stability);

-- =====================================================
-- TABLE: AIEnhancementHistory
-- Tracks all AI enhancement actions
-- =====================================================
CREATE TABLE IF NOT EXISTS "AIEnhancementHistory" (
    id VARCHAR(200) PRIMARY KEY,
    "scriptId" VARCHAR(200),
    "userId" VARCHAR(200),
    "enhancementType" VARCHAR(100) NOT NULL,
    "originalCode" TEXT,
    "enhancedCode" TEXT,
    confidence DECIMAL(5,4),
    "wasApplied" BOOLEAN DEFAULT false,
    metadata JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "appliedAt" TIMESTAMP,
    CONSTRAINT "AIEnhancementHistory_scriptId_fkey" FOREIGN KEY ("scriptId") 
        REFERENCES "Script"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIEnhancementHistory_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AIEnhancementHistory_scriptId_idx" ON "AIEnhancementHistory"("scriptId");
CREATE INDEX "AIEnhancementHistory_userId_idx" ON "AIEnhancementHistory"("userId");
CREATE INDEX "AIEnhancementHistory_enhancementType_idx" ON "AIEnhancementHistory"("enhancementType");
CREATE INDEX "AIEnhancementHistory_createdAt_idx" ON "AIEnhancementHistory"("createdAt");

-- =====================================================
-- TABLE: LocatorStability
-- Tracks locator stability scores over time
-- =====================================================
CREATE TABLE IF NOT EXISTS "LocatorStability" (
    id VARCHAR(200) PRIMARY KEY,
    locator TEXT NOT NULL,
    "locatorType" VARCHAR(50) NOT NULL,
    "scriptId" VARCHAR(200),
    "successCount" INTEGER DEFAULT 0,
    "failureCount" INTEGER DEFAULT 0,
    "stabilityScore" DECIMAL(5,4),
    "lastTestedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "LocatorStability_scriptId_fkey" FOREIGN KEY ("scriptId") 
        REFERENCES "Script"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LocatorStability_scriptId_idx" ON "LocatorStability"("scriptId");
CREATE INDEX "LocatorStability_locatorType_idx" ON "LocatorStability"("locatorType");
CREATE INDEX "LocatorStability_stabilityScore_idx" ON "LocatorStability"("stabilityScore");

-- =====================================================
-- Verification Query
-- =====================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN (
        'VisualFingerprint',
        'VisualComparison',
        'ScreenshotAnalysis',
        'LayoutChange',
        'ContextAwareLocator',
        'XPathAnalysis',
        'AIEnhancementHistory',
        'LocatorStability'
    )
ORDER BY table_name;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ AI Enhancement Features Migration Complete!';
    RAISE NOTICE '📊 Created 8 new tables for Visual AI, Context-Aware Locators, and XPath Analysis';
    RAISE NOTICE '🔍 Tables: VisualFingerprint, VisualComparison, ScreenshotAnalysis, LayoutChange';
    RAISE NOTICE '🎯 Tables: ContextAwareLocator, XPathAnalysis, AIEnhancementHistory, LocatorStability';
END $$;
