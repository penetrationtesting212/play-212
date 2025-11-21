/**
 * AI Enhancement Service Tests
 * Tests for Visual AI, Context-Aware Locators, and XPath Analysis
 */

import { visualAIService } from '../src/services/visual-ai.service';
import { contextAwareLocatorService } from '../src/services/context-aware-locator.service';
import { xpathAnalysisService } from '../src/services/xpath-analysis.service';

describe('Visual AI Service', () => {
  describe('createVisualFingerprint', () => {
    it('should create a visual fingerprint for an element', () => {
      const fingerprint = visualAIService.createVisualFingerprint({
        id: 'test-element-1',
        position: { x: 100, y: 200 },
        size: { width: 150, height: 50 },
        styles: { color: 'blue', fontSize: '16px' },
        text: 'Submit Button'
      });

      expect(fingerprint).toBeDefined();
      expect(fingerprint.elementId).toBe('test-element-1');
      expect(fingerprint.position).toEqual({ x: 100, y: 200 });
      expect(fingerprint.visualHash).toBeDefined();
    });
  });

  describe('compareVisualFingerprints', () => {
    it('should detect identical elements', () => {
      const fp1 = visualAIService.createVisualFingerprint({
        id: 'elem-1',
        position: { x: 100, y: 200 },
        size: { width: 150, height: 50 },
        styles: { color: 'blue' },
        text: 'Button'
      });

      const fp2 = visualAIService.createVisualFingerprint({
        id: 'elem-2',
        position: { x: 100, y: 200 },
        size: { width: 150, height: 50 },
        styles: { color: 'blue' },
        text: 'Button'
      });

      const comparison = visualAIService.compareVisualFingerprints(fp1, fp2);

      expect(comparison.similarity).toBeGreaterThan(0.95);
      expect(comparison.isMatch).toBe(true);
    });

    it('should detect position changes', () => {
      const fp1 = visualAIService.createVisualFingerprint({
        id: 'elem-1',
        position: { x: 100, y: 200 },
        size: { width: 150, height: 50 },
        styles: { color: 'blue' },
        text: 'Button'
      });

      const fp2 = visualAIService.createVisualFingerprint({
        id: 'elem-2',
        position: { x: 500, y: 600 },
        size: { width: 150, height: 50 },
        styles: { color: 'blue' },
        text: 'Button'
      });

      const comparison = visualAIService.compareVisualFingerprints(fp1, fp2);

      expect(comparison.differences).toContain(expect.stringContaining('Position changed'));
    });
  });
});

describe('Context-Aware Locator Service', () => {
  describe('generateLocators', () => {
    it('should generate semantic locators for button with aria-label', () => {
      const context = {
        tag: 'button',
        attributes: {
          'aria-label': 'Submit form',
          'class': 'btn btn-primary'
        },
        text: 'Submit',
        position: { index: 0, total: 1 }
      };

      const suggestions = contextAwareLocatorService.generateLocators(context);

      expect(suggestions.length).toBeGreaterThan(0);
      const ariaLabelSuggestion = suggestions.find(s => s.strategy === 'aria-label');
      expect(ariaLabelSuggestion).toBeDefined();
      expect(ariaLabelSuggestion?.confidence).toBeGreaterThan(0.9);
    });

    it('should generate form context locators for input with label', () => {
      const context = {
        tag: 'input',
        attributes: {
          name: 'email',
          type: 'email',
          placeholder: 'Enter email'
        },
        formContext: {
          label: 'Email Address',
          placeholder: 'Enter email'
        },
        position: { index: 0, total: 1 }
      };

      const suggestions = contextAwareLocatorService.generateLocators(context);

      const labelSuggestion = suggestions.find(s => s.strategy === 'form-label');
      expect(labelSuggestion).toBeDefined();
      expect(labelSuggestion?.locator).toContain('getByLabel');
    });

    it('should generate table context locators', () => {
      const context = {
        tag: 'td',
        attributes: {},
        tableContext: {
          tableId: 'users-table',
          rowIndex: 2,
          columnIndex: 1,
          cellType: 'td' as 'td'
        },
        position: { index: 0, total: 1 }
      };

      const suggestions = contextAwareLocatorService.generateLocators(context);

      const tableSuggestion = suggestions.find(s => s.strategy === 'table-id-context');
      expect(tableSuggestion).toBeDefined();
      expect(tableSuggestion?.locator).toContain('users-table');
    });

    it('should generate data-testid locators with highest priority', () => {
      const context = {
        tag: 'button',
        attributes: {
          'data-testid': 'submit-btn',
          'class': 'btn dynamic-class-123',
          'id': 'btn-456'
        },
        text: 'Submit',
        position: { index: 0, total: 1 }
      };

      const suggestions = contextAwareLocatorService.generateLocators(context);

      expect(suggestions[0].strategy).toBe('data-testid');
      expect(suggestions[0].confidence).toBeGreaterThan(0.95);
    });
  });
});

describe('XPath Analysis Service', () => {
  describe('isXPathExpression', () => {
    it('should detect absolute XPath', () => {
      const isXPath = xpathAnalysisService.isXPathExpression('/html/body/div/button');
      expect(isXPath).toBe(true);
    });

    it('should detect relative XPath', () => {
      const isXPath = xpathAnalysisService.isXPathExpression('//button[@id="submit"]');
      expect(isXPath).toBe(true);
    });

    it('should detect XPath with predicates', () => {
      const isXPath = xpathAnalysisService.isXPathExpression('//input[@type="text"]');
      expect(isXPath).toBe(true);
    });

    it('should not detect CSS selectors as XPath', () => {
      const isXPath = xpathAnalysisService.isXPathExpression('#submit-button');
      expect(isXPath).toBe(false);
    });
  });

  describe('detectXPathType', () => {
    it('should detect absolute XPath', () => {
      const type = xpathAnalysisService.analyzeXPath('/html/body/div/button').type;
      expect(type).toBe('absolute');
    });

    it('should detect relative XPath', () => {
      const type = xpathAnalysisService.analyzeXPath('//button[@id="submit"]').type;
      expect(type).toBe('relative');
    });
  });

  describe('calculateComplexity', () => {
    it('should rate simple XPath as low complexity', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//button[@id="submit"]');
      expect(analysis.complexity).toBeLessThan(30);
    });

    it('should rate complex XPath as high complexity', () => {
      const xpath = '/html/body/div[1]/div[2]/form/fieldset[3]/div[5]/input[@type="text"][@class="form-control"]';
      const analysis = xpathAnalysisService.analyzeXPath(xpath);
      expect(analysis.complexity).toBeGreaterThan(60);
    });
  });

  describe('findIssues', () => {
    it('should find absolute path issue', () => {
      const analysis = xpathAnalysisService.analyzeXPath('/html/body/div/button');
      const absoluteIssue = analysis.issues.find(i => i.type === 'absolute-path');
      expect(absoluteIssue).toBeDefined();
      expect(absoluteIssue?.severity).toBe('high');
    });

    it('should find index-based selection issue', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//div[1]/span[2]/button[3]');
      const indexIssue = analysis.issues.find(i => i.type === 'index-based');
      expect(indexIssue).toBeDefined();
    });

    it('should find dynamic ID issue', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//button[@id="btn-123456789"]');
      const dynamicIdIssue = analysis.issues.find(i => i.type === 'dynamic-id');
      expect(dynamicIdIssue).toBeDefined();
    });
  });

  describe('generateConversionSuggestions', () => {
    it('should suggest Playwright getByTestId for data-testid', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//button[@data-testid="submit-btn"]');
      const testIdSuggestion = analysis.suggestions.find(s => s.type === 'playwright');
      expect(testIdSuggestion).toBeDefined();
      expect(testIdSuggestion?.locator).toContain('getByTestId');
      expect(testIdSuggestion?.confidence).toBeGreaterThan(0.95);
    });

    it('should suggest Playwright getByLabel for aria-label', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//input[@aria-label="Email"]');
      const ariaLabelSuggestion = analysis.suggestions.find(s => s.locator.includes('getByLabel'));
      expect(ariaLabelSuggestion).toBeDefined();
    });

    it('should suggest Playwright getByRole for role attribute', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//button[@role="button"]');
      const roleSuggestion = analysis.suggestions.find(s => s.locator.includes('getByRole'));
      expect(roleSuggestion).toBeDefined();
    });

    it('should suggest CSS selector for simple ID', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//div[@id="main-content"]');
      const cssSuggestion = analysis.suggestions.find(s => s.type === 'css');
      expect(cssSuggestion).toBeDefined();
      expect(cssSuggestion?.locator).toBe('#main-content');
    });

    it('should suggest relative XPath for absolute paths', () => {
      const analysis = xpathAnalysisService.analyzeXPath('/html/body/div[@id="app"]');
      const relativeXPathSuggestion = analysis.suggestions.find(s => s.type === 'relative-xpath');
      expect(relativeXPathSuggestion).toBeDefined();
      expect(relativeXPathSuggestion?.locator).not.toContain('/html/body');
    });
  });

  describe('assessStability', () => {
    it('should rate data-testid XPath as high stability', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//button[@data-testid="submit"]');
      expect(analysis.stability).toBe('high');
    });

    it('should rate absolute XPath as low stability', () => {
      const analysis = xpathAnalysisService.analyzeXPath('/html/body/div[1]/button[2]');
      expect(analysis.stability).toBe('low');
    });

    it('should rate index-based XPath as low stability', () => {
      const analysis = xpathAnalysisService.analyzeXPath('//div[1]/div[2]/div[3]');
      expect(analysis.stability).toBe('low');
    });
  });
});

describe('Integration Tests', () => {
  it('should analyze complex scenario with all services', async () => {
    // XPath analysis
    const xpath = '//form[@id="login-form"]/input[@type="email"]';
    const xpathAnalysis = xpathAnalysisService.analyzeXPath(xpath);
    
    expect(xpathAnalysis.isXPath).toBe(true);
    expect(xpathAnalysis.suggestions.length).toBeGreaterThan(0);

    // Context-aware locators
    const elementContext = {
      tag: 'input',
      attributes: {
        type: 'email',
        name: 'email',
        'aria-label': 'Email address'
      },
      formContext: {
        formId: 'login-form',
        label: 'Email'
      },
      position: { index: 0, total: 2 }
    };

    const locators = contextAwareLocatorService.generateLocators(elementContext);
    expect(locators[0].confidence).toBeGreaterThan(0.85);

    // Visual fingerprint
    const fingerprint = visualAIService.createVisualFingerprint({
      id: 'email-input',
      position: { x: 100, y: 150 },
      size: { width: 200, height: 30 },
      styles: { border: '1px solid #ccc' },
      text: ''
    });

    expect(fingerprint.visualHash).toBeDefined();
  });
});
