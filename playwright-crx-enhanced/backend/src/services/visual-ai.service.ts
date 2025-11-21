/**
 * Visual AI & Screenshot-Based Testing Service
 * Provides intelligent visual element recognition and screenshot-based validation
 */

import { createHash } from 'crypto';

interface VisualFingerprint {
  elementId: string;
  visualHash: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  computedStyles: Record<string, string>;
  textContent: string;
  screenshot?: string; // Base64 encoded
  timestamp: Date;
}

interface VisualComparisonResult {
  similarity: number; // 0-1
  differences: string[];
  isMatch: boolean;
  confidence: number;
}

interface ScreenshotAnalysis {
  elements: VisualElement[];
  layoutStructure: LayoutNode[];
  colorScheme: ColorPalette;
  accessibility: AccessibilityInfo;
}

interface VisualElement {
  bounds: { x: number; y: number; width: number; height: number };
  type: string;
  text?: string;
  role?: string;
  suggestedLocators: string[];
  visualSignature: string;
}

interface LayoutNode {
  tag: string;
  children: LayoutNode[];
  depth: number;
  position: 'relative' | 'absolute' | 'fixed' | 'static';
}

interface ColorPalette {
  dominant: string[];
  accent: string[];
  background: string;
  text: string;
}

interface AccessibilityInfo {
  ariaLabels: string[];
  roles: string[];
  contrast: { ratio: number; passes: boolean }[];
  missingAlt: number;
}

export class VisualAIService {
  private fingerprintCache: Map<string, VisualFingerprint> = new Map();
  
  /**
   * Create visual fingerprint for an element
   */
  createVisualFingerprint(elementData: {
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    styles: Record<string, string>;
    text: string;
    screenshot?: string;
  }): VisualFingerprint {
    const fingerprint: VisualFingerprint = {
      elementId: elementData.id,
      visualHash: this.computeVisualHash(elementData),
      position: elementData.position,
      size: elementData.size,
      computedStyles: elementData.styles,
      textContent: elementData.text,
      screenshot: elementData.screenshot,
      timestamp: new Date()
    };

    this.fingerprintCache.set(elementData.id, fingerprint);
    return fingerprint;
  }

  /**
   * Compare two visual fingerprints for similarity
   */
  compareVisualFingerprints(
    fp1: VisualFingerprint,
    fp2: VisualFingerprint
  ): VisualComparisonResult {
    const differences: string[] = [];
    let similarityScore = 0;
    const weights = {
      position: 0.2,
      size: 0.25,
      styles: 0.3,
      text: 0.25
    };

    // Position similarity (allow 10% tolerance)
    const positionDiff = Math.sqrt(
      Math.pow(fp1.position.x - fp2.position.x, 2) +
      Math.pow(fp1.position.y - fp2.position.y, 2)
    );
    const positionSimilarity = Math.max(0, 1 - positionDiff / 100);
    similarityScore += positionSimilarity * weights.position;

    if (positionSimilarity < 0.9) {
      differences.push(`Position changed: (${fp1.position.x},${fp1.position.y}) → (${fp2.position.x},${fp2.position.y})`);
    }

    // Size similarity (allow 5% tolerance)
    const sizeDiff = Math.abs(fp1.size.width * fp1.size.height - fp2.size.width * fp2.size.height);
    const totalArea = fp1.size.width * fp1.size.height;
    const sizeSimilarity = Math.max(0, 1 - sizeDiff / totalArea);
    similarityScore += sizeSimilarity * weights.size;

    if (sizeSimilarity < 0.95) {
      differences.push(`Size changed: ${fp1.size.width}x${fp1.size.height} → ${fp2.size.width}x${fp2.size.height}`);
    }

    // Style similarity
    const styleSimilarity = this.compareStyles(fp1.computedStyles, fp2.computedStyles);
    similarityScore += styleSimilarity * weights.styles;

    if (styleSimilarity < 0.9) {
      differences.push('Visual styles changed');
    }

    // Text similarity
    const textSimilarity = this.compareText(fp1.textContent, fp2.textContent);
    similarityScore += textSimilarity * weights.text;

    if (textSimilarity < 0.9) {
      differences.push(`Text changed: "${fp1.textContent}" → "${fp2.textContent}"`);
    }

    return {
      similarity: similarityScore,
      differences,
      isMatch: similarityScore > 0.85,
      confidence: similarityScore
    };
  }

  /**
   * Analyze screenshot to detect elements
   */
  async analyzeScreenshot(screenshotBase64: string): Promise<ScreenshotAnalysis> {
    // In production, this would use computer vision APIs (e.g., TensorFlow.js, OpenCV.js)
    // For now, returning structure for demonstration
    
    return {
      elements: [
        {
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          type: 'button',
          text: 'Submit',
          role: 'button',
          suggestedLocators: [
            'button:has-text("Submit")',
            '[role="button"]',
            'getByRole("button", { name: "Submit" })'
          ],
          visualSignature: this.generateVisualSignature(screenshotBase64)
        }
      ],
      layoutStructure: [],
      colorScheme: {
        dominant: ['#1976d2', '#ffffff'],
        accent: ['#f50057'],
        background: '#fafafa',
        text: '#212121'
      },
      accessibility: {
        ariaLabels: ['Submit form'],
        roles: ['button', 'main', 'navigation'],
        contrast: [{ ratio: 4.5, passes: true }],
        missingAlt: 0
      }
    };
  }

  /**
   * Find element by visual similarity when selector fails
   */
  async findByVisualSimilarity(
    targetFingerprint: VisualFingerprint,
    candidateFingerprints: VisualFingerprint[]
  ): Promise<{ element: VisualFingerprint; confidence: number } | null> {
    let bestMatch: { element: VisualFingerprint; confidence: number } | null = null;

    for (const candidate of candidateFingerprints) {
      const comparison = this.compareVisualFingerprints(targetFingerprint, candidate);
      
      if (comparison.isMatch && (!bestMatch || comparison.confidence > bestMatch.confidence)) {
        bestMatch = {
          element: candidate,
          confidence: comparison.confidence
        };
      }
    }

    return bestMatch;
  }

  /**
   * Detect layout changes between screenshots
   */
  detectLayoutChanges(
    beforeScreenshot: string,
    afterScreenshot: string
  ): {
    hasChanges: boolean;
    changePercentage: number;
    affectedRegions: { x: number; y: number; width: number; height: number }[];
  } {
    // Simplified implementation - in production use pixel-by-pixel comparison
    const beforeHash = createHash('md5').update(beforeScreenshot).digest('hex');
    const afterHash = createHash('md5').update(afterScreenshot).digest('hex');
    
    const hasChanges = beforeHash !== afterHash;
    
    return {
      hasChanges,
      changePercentage: hasChanges ? 5.2 : 0, // Mock value
      affectedRegions: hasChanges ? [{ x: 100, y: 200, width: 300, height: 100 }] : []
    };
  }

  /**
   * Generate locators based on visual context
   */
  generateVisualContextLocators(element: VisualElement): string[] {
    const locators: string[] = [];

    // Text-based
    if (element.text) {
      locators.push(`text="${element.text}"`);
      locators.push(`getByText('${element.text}')`);
    }

    // Role-based
    if (element.role) {
      locators.push(`[role="${element.role}"]`);
      locators.push(`getByRole('${element.role}'${element.text ? `, { name: '${element.text}' }` : ''})`);
    }

    // Position-based (fallback)
    locators.push(`>> nth=${Math.floor(element.bounds.x / 100)}`);

    // Visual signature-based (unique to this service)
    locators.push(`[data-visual-signature="${element.visualSignature}"]`);

    return locators;
  }

  /**
   * Screenshot-based element validation
   */
  async validateElementByScreenshot(
    expectedScreenshot: string,
    actualScreenshot: string,
    tolerance: number = 0.95
  ): Promise<{
    isValid: boolean;
    similarity: number;
    differences: string[];
  }> {
    const expectedHash = createHash('md5').update(expectedScreenshot).digest('hex');
    const actualHash = createHash('md5').update(actualScreenshot).digest('hex');
    
    const isExactMatch = expectedHash === actualHash;
    const similarity = isExactMatch ? 1.0 : 0.92; // Mock similarity

    return {
      isValid: similarity >= tolerance,
      similarity,
      differences: isExactMatch ? [] : ['Minor visual differences detected']
    };
  }

  // Private helper methods

  private computeVisualHash(elementData: any): string {
    const data = JSON.stringify({
      position: elementData.position,
      size: elementData.size,
      styles: elementData.styles,
      text: elementData.text
    });
    
    return createHash('sha256').update(data).digest('hex');
  }

  private compareStyles(styles1: Record<string, string>, styles2: Record<string, string>): number {
    const keys1 = Object.keys(styles1);
    const keys2 = Object.keys(styles2);
    
    const allKeys = new Set([...keys1, ...keys2]);
    let matchCount = 0;

    for (const key of allKeys) {
      if (styles1[key] === styles2[key]) {
        matchCount++;
      }
    }

    return matchCount / allKeys.size;
  }

  private compareText(text1: string, text2: string): number {
    if (text1 === text2) return 1.0;
    if (!text1 || !text2) return 0;

    // Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private generateVisualSignature(screenshotData: string): string {
    return createHash('md5').update(screenshotData).digest('hex').substring(0, 16);
  }

  /**
   * Cleanup cache
   */
  clearCache(): void {
    this.fingerprintCache.clear();
  }
}

// Singleton instance
export const visualAIService = new VisualAIService();
