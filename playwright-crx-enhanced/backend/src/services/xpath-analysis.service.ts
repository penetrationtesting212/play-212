/**
 * XPath Analysis Service
 * Detects, analyzes, and converts XPath expressions (both relative and absolute)
 */

interface XPathAnalysis {
  isXPath: boolean;
  type: 'absolute' | 'relative' | 'mixed' | 'none';
  xpath: string;
  complexity: number;
  stability: 'high' | 'medium' | 'low';
  issues: XPathIssue[];
  suggestions: XPathSuggestion[];
}

interface XPathIssue {
  type: 'absolute-path' | 'index-based' | 'dynamic-id' | 'complex' | 'fragile';
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: string;
}

interface XPathSuggestion {
  type: 'playwright' | 'css' | 'relative-xpath';
  locator: string;
  confidence: number;
  reasoning: string;
  improvement: string;
}

// Reserved for future pattern-based enhancements
// interface XPathPattern {
//   pattern: RegExp;
//   type: 'absolute' | 'relative';
//   description: string;
// }

export class XPathAnalysisService {
  // Reserved for future pattern-based enhancements
  // private xpathPatterns: XPathPattern[] = [
  //   {
  //     pattern: /^\/html\/body/i,
  //     type: 'absolute',
  //     description: 'Absolute XPath starting from document root'
  //   },
  //   {
  //     pattern: /^\/\//,
  //     type: 'relative',
  //     description: 'Relative XPath starting with //'
  //   },
  //   {
  //     pattern: /^\//,
  //     type: 'absolute',
  //     description: 'Absolute XPath starting with single /'
  //   },
  //   {
  //     pattern: /^\.\/ \//,
  //     type: 'relative',
  //     description: 'Relative XPath from current context'
  //   }
  // ];

  /**
   * Analyze XPath expression
   */
  analyzeXPath(expression: string): XPathAnalysis {
    const isXPath = this.isXPathExpression(expression);
    
    if (!isXPath) {
      return {
        isXPath: false,
        type: 'none',
        xpath: expression,
        complexity: 0,
        stability: 'high',
        issues: [],
        suggestions: []
      };
    }

    const type = this.detectXPathType(expression);
    const complexity = this.calculateComplexity(expression);
    const stability = this.assessStability(expression);
    const issues = this.findIssues(expression);
    const suggestions = this.generateConversionSuggestions(expression, type);

    return {
      isXPath: true,
      type,
      xpath: expression,
      complexity,
      stability,
      issues,
      suggestions
    };
  }

  /**
   * Detect if expression is XPath
   */
  isXPathExpression(expression: string): boolean {
    if (!expression) return false;

    const xpathIndicators = [
      /^\/\//,
      /^\//,
      /^\.\/\//,
      /\[@[a-zA-Z]/,
      /\[contains\(/,
      /\[text\(\)/,
      /\/ancestor::/,
      /\/descendant::/,
      /\/following::/,
      /\/preceding::/,
      /\/parent::/,
      /\/child::/
    ];

    return xpathIndicators.some(pattern => pattern.test(expression));
  }

  /**
   * Detect XPath type
   */
  detectXPathType(xpath: string): 'absolute' | 'relative' | 'mixed' {
    if (/^\/(?!\/)/.test(xpath)) {
      return 'absolute';
    }

    if (/^\/\/|^\.\/\//.test(xpath)) {
      return 'relative';
    }

    return 'mixed';
  }

  /**
   * Calculate complexity score
   */
  calculateComplexity(xpath: string): number {
    let score = 0;

    score += Math.min(xpath.length / 2, 20);
    const depth = (xpath.match(/\//g) || []).length;
    score += depth * 3;
    const predicates = (xpath.match(/\[/g) || []).length;
    score += predicates * 5;
    const functions = (xpath.match(/\w+\(/g) || []).length;
    score += functions * 8;
    const indices = (xpath.match(/\[\d+\]/g) || []).length;
    score += indices * 10;
    const axes = (xpath.match(/::/g) || []).length;
    score += axes * 7;

    return Math.min(score, 100);
  }

  /**
   * Assess stability
   */
  assessStability(xpath: string): 'high' | 'medium' | 'low' {
    let stabilityScore = 100;

    if (/^\/(?!\/)/.test(xpath)) stabilityScore -= 30;
    const indexCount = (xpath.match(/\[\d+\]/g) || []).length;
    stabilityScore -= indexCount * 15;
    if (/\[@id=['"].*\d{6,}.*['"]\]/.test(xpath)) stabilityScore -= 20;
    if (/\[@class=['"].*(?:css|sc|jss)-[a-z0-9]+.*['"]\]/.test(xpath)) stabilityScore -= 25;
    if (/text\(\)/.test(xpath)) stabilityScore -= 5;
    if (/@data-testid/.test(xpath)) stabilityScore += 10;

    if (stabilityScore >= 70) return 'high';
    if (stabilityScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Find issues
   */
  findIssues(xpath: string): XPathIssue[] {
    const issues: XPathIssue[] = [];

    if (/^\/html\/body/.test(xpath)) {
      issues.push({
        type: 'absolute-path',
        severity: 'high',
        description: 'Absolute XPath from document root is fragile',
        location: 'path start'
      });
    }

    const indexMatches = xpath.match(/\[\d+\]/g);
    if (indexMatches && indexMatches.length > 0) {
      issues.push({
        type: 'index-based',
        severity: 'high',
        description: `Using numeric indices makes selector fragile`,
        location: 'predicates'
      });
    }

    if (/\[@id=['"].*(?:\d{6,}|uuid|random|timestamp).*['"]\]/.test(xpath)) {
      issues.push({
        type: 'dynamic-id',
        severity: 'high',
        description: 'ID appears dynamically generated',
        location: 'id attribute'
      });
    }

    const complexity = this.calculateComplexity(xpath);
    if (complexity > 60) {
      issues.push({
        type: 'complex',
        severity: 'medium',
        description: `XPath is overly complex (${complexity}/100)`,
        location: 'overall structure'
      });
    }

    return issues;
  }

  /**
   * Generate conversion suggestions
   */
  generateConversionSuggestions(xpath: string, type: 'absolute' | 'relative' | 'mixed'): XPathSuggestion[] {
    const suggestions: XPathSuggestion[] = [];
    const patterns = this.extractPatterns(xpath);

    if (patterns.dataTestId) {
      suggestions.push({
        type: 'playwright',
        locator: `getByTestId('${patterns.dataTestId}')`,
        confidence: 0.97,
        reasoning: 'data-testid found in XPath',
        improvement: 'More readable and stable'
      });
    }

    if (patterns.ariaLabel) {
      suggestions.push({
        type: 'playwright',
        locator: `getByLabel('${patterns.ariaLabel}')`,
        confidence: 0.95,
        reasoning: 'aria-label found',
        improvement: 'Semantic and accessible'
      });
    }

    if (patterns.role) {
      const nameClause = patterns.text ? `, { name: '${patterns.text}' }` : '';
      suggestions.push({
        type: 'playwright',
        locator: `getByRole('${patterns.role}'${nameClause})`,
        confidence: 0.93,
        reasoning: 'Role attribute found',
        improvement: 'Semantic selector'
      });
    }

    if (patterns.text) {
      suggestions.push({
        type: 'playwright',
        locator: `getByText('${patterns.text}')`,
        confidence: 0.88,
        reasoning: 'Text content found',
        improvement: 'User-centric selector'
      });
    }

    if (patterns.id && !this.isDynamicId(patterns.id)) {
      suggestions.push({
        type: 'css',
        locator: `#${patterns.id}`,
        confidence: 0.92,
        reasoning: 'Stable ID found',
        improvement: 'Simpler CSS selector'
      });
    }

    if (type === 'absolute') {
      const relativeXPath = this.convertToRelativeXPath(xpath, patterns);
      if (relativeXPath !== xpath) {
        suggestions.push({
          type: 'relative-xpath',
          locator: relativeXPath,
          confidence: 0.80,
          reasoning: 'Converted to relative XPath',
          improvement: 'More stable than absolute'
        });
      }
    }

    return suggestions;
  }

  /**
   * Extract patterns from XPath
   */
  private extractPatterns(xpath: string): any {
    const patterns: any = {};

    const idMatch = xpath.match(/@id=['"]([^'"]+)['"]/);
    if (idMatch) patterns.id = idMatch[1];

    const classMatch = xpath.match(/@class=['"]([^'"]+)['"]/);
    if (classMatch) patterns.class = classMatch[1].split(' ')[0];

    const testIdMatch = xpath.match(/@data-testid=['"]([^'"]+)['"]/);
    if (testIdMatch) patterns.dataTestId = testIdMatch[1];

    const ariaMatch = xpath.match(/@aria-label=['"]([^'"]+)['"]/);
    if (ariaMatch) patterns.ariaLabel = ariaMatch[1];

    const roleMatch = xpath.match(/@role=['"]([^'"]+)['"]/);
    if (roleMatch) patterns.role = roleMatch[1];

    const textMatch = xpath.match(/text\(\)=['"]([^'"]+)['"]/);
    if (textMatch) patterns.text = textMatch[1];

    const tagMatch = xpath.match(/\/([a-z]+)(?:\[|$)/);
    if (tagMatch) patterns.tag = tagMatch[1];

    return patterns;
  }

  /**
   * Convert to relative XPath
   */
  private convertToRelativeXPath(xpath: string, patterns: any): string {
    if (patterns.dataTestId) {
      return `//*[@data-testid='${patterns.dataTestId}']`;
    }

    if (patterns.id && !this.isDynamicId(patterns.id)) {
      return `//*[@id='${patterns.id}']`;
    }

    if (patterns.text) {
      const tag = patterns.tag || '*';
      return `//${tag}[text()='${patterns.text}']`;
    }

    return xpath.replace(/^\/html\/body/, '//body');
  }

  private isDynamicId(id: string): boolean {
    return /\d{6,}|[a-f0-9]{8}-[a-f0-9]{4}|random|uid|timestamp/i.test(id);
  }

  // Reserved for future CSS-in-JS detection enhancements
  // private isDynamicClass(className: string): boolean {
  //   return /^(css|sc|jss|emotion)-[a-z0-9]+$/i.test(className);
  // }
}

export const xpathAnalysisService = new XPathAnalysisService();
