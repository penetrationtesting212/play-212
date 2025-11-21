/**
 * Context-Aware Locator Generation Service
 * Generates intelligent locators based on element context, semantics, and page structure
 */

interface ElementContext {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
  parent?: ElementContext;
  siblings?: ElementContext[];
  children?: ElementContext[];
  position: { index: number; total: number };
  formContext?: FormContext;
  tableContext?: TableContext;
  modalContext?: ModalContext;
  shadowDom?: boolean;
}

interface FormContext {
  formId?: string;
  formName?: string;
  fieldsetLegend?: string;
  label?: string;
  labelFor?: string;
  inputType?: string;
  placeholder?: string;
}

interface TableContext {
  tableId?: string;
  rowIndex: number;
  columnIndex: number;
  headerText?: string;
  cellType: 'th' | 'td';
}

interface ModalContext {
  isModal: boolean;
  modalId?: string;
  dialogRole?: boolean;
  backdrop?: boolean;
}

interface LocatorSuggestion {
  locator: string;
  type: 'css' | 'xpath' | 'playwright' | 'aria' | 'semantic';
  confidence: number;
  reasoning: string;
  strategy: string;
  stability: 'high' | 'medium' | 'low';
}

interface ContextAnalysis {
  isInForm: boolean;
  isInTable: boolean;
  isInModal: boolean;
  isInShadowDom: boolean;
  hasStableParent: boolean;
  semanticRole?: string;
  accessibility: {
    hasAriaLabel: boolean;
    hasRole: boolean;
    hasAltText: boolean;
  };
}

export class ContextAwareLocatorService {
  /**
   * Generate context-aware locators for an element
   */
  generateLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];
    const analysis = this.analyzeContext(context);

    // Strategy 1: Semantic/ARIA locators (highest priority)
    suggestions.push(...this.generateSemanticLocators(context, analysis));

    // Strategy 2: Form context locators
    if (analysis.isInForm && context.formContext) {
      suggestions.push(...this.generateFormLocators(context));
    }

    // Strategy 3: Table context locators
    if (analysis.isInTable && context.tableContext) {
      suggestions.push(...this.generateTableLocators(context));
    }

    // Strategy 4: Modal context locators
    if (analysis.isInModal && context.modalContext) {
      suggestions.push(...this.generateModalLocators(context));
    }

    // Strategy 5: Relative locators (position relative to stable landmarks)
    suggestions.push(...this.generateRelativeLocators(context));

    // Strategy 6: Composite locators (combine multiple weak locators)
    suggestions.push(...this.generateCompositeLocators(context));

    // Strategy 7: Shadow DOM aware locators
    if (analysis.isInShadowDom) {
      suggestions.push(...this.generateShadowDomLocators(context));
    }

    // Strategy 8: Data attribute locators
    suggestions.push(...this.generateDataAttributeLocators(context));

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze element context
   */
  private analyzeContext(context: ElementContext): ContextAnalysis {
    return {
      isInForm: !!context.formContext,
      isInTable: !!context.tableContext,
      isInModal: !!context.modalContext,
      isInShadowDom: !!context.shadowDom,
      hasStableParent: this.hasStableParent(context),
      semanticRole: context.attributes['role'],
      accessibility: {
        hasAriaLabel: !!(context.attributes['aria-label'] || context.attributes['aria-labelledby']),
        hasRole: !!context.attributes['role'],
        hasAltText: !!context.attributes['alt']
      }
    };
  }

  /**
   * Generate semantic/ARIA locators
   */
  private generateSemanticLocators(context: ElementContext, _analysis: ContextAnalysis): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];

    // ARIA label
    if (context.attributes['aria-label']) {
      suggestions.push({
        locator: `getByLabel('${context.attributes['aria-label']}')`,
        type: 'playwright',
        confidence: 0.95,
        reasoning: 'ARIA label is explicitly set for accessibility and is semantically meaningful',
        strategy: 'aria-label',
        stability: 'high'
      });

      suggestions.push({
        locator: `[aria-label="${context.attributes['aria-label']}"]`,
        type: 'css',
        confidence: 0.93,
        reasoning: 'CSS selector using ARIA label attribute',
        strategy: 'aria-label-css',
        stability: 'high'
      });
    }

    // Role-based
    if (context.attributes['role']) {
      const role = context.attributes['role'];
      const name = context.text || context.attributes['aria-label'];
      
      if (name) {
        suggestions.push({
          locator: `getByRole('${role}', { name: '${name}' })`,
          type: 'playwright',
          confidence: 0.94,
          reasoning: 'Role + accessible name combination provides semantic and stable selector',
          strategy: 'role-with-name',
          stability: 'high'
        });
      } else {
        suggestions.push({
          locator: `getByRole('${role}')`,
          type: 'playwright',
          confidence: 0.85,
          reasoning: 'Role-based selector is semantic but may match multiple elements',
          strategy: 'role-only',
          stability: 'medium'
        });
      }
    }

    // Text content
    if (context.text && context.text.trim().length > 0) {
      suggestions.push({
        locator: `getByText('${context.text}')`,
        type: 'playwright',
        confidence: 0.88,
        reasoning: 'Text content is user-visible and meaningful',
        strategy: 'text-content',
        stability: 'medium'
      });
    }

    // Alt text for images
    if (context.tag === 'img' && context.attributes['alt']) {
      suggestions.push({
        locator: `getByAltText('${context.attributes['alt']}')`,
        type: 'playwright',
        confidence: 0.92,
        reasoning: 'Alt text is accessibility-required and stable',
        strategy: 'alt-text',
        stability: 'high'
      });
    }

    return suggestions;
  }

  /**
   * Generate form-context locators
   */
  private generateFormLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];
    const form = context.formContext!;

    // Label-based
    if (form.label) {
      suggestions.push({
        locator: `getByLabel('${form.label}')`,
        type: 'playwright',
        confidence: 0.93,
        reasoning: 'Form label provides clear semantic meaning for input field',
        strategy: 'form-label',
        stability: 'high'
      });
    }

    // Placeholder-based
    if (form.placeholder) {
      suggestions.push({
        locator: `getByPlaceholder('${form.placeholder}')`,
        type: 'playwright',
        confidence: 0.87,
        reasoning: 'Placeholder text is user-visible and contextually meaningful',
        strategy: 'form-placeholder',
        stability: 'medium'
      });
    }

    // Name attribute
    if (context.attributes['name']) {
      suggestions.push({
        locator: `input[name="${context.attributes['name']}"]`,
        type: 'css',
        confidence: 0.90,
        reasoning: 'Name attribute is typically stable for form submission',
        strategy: 'form-name',
        stability: 'high'
      });
    }

    // Fieldset context
    if (form.fieldsetLegend) {
      suggestions.push({
        locator: `fieldset:has-text("${form.fieldsetLegend}") >> ${context.tag}[name="${context.attributes['name'] || ''}"]`,
        type: 'playwright',
        confidence: 0.89,
        reasoning: 'Fieldset provides form section context',
        strategy: 'fieldset-context',
        stability: 'high'
      });
    }

    return suggestions;
  }

  /**
   * Generate table-context locators
   */
  private generateTableLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];
    const table = context.tableContext!;

    // Header-based (for data cells)
    if (table.headerText && table.cellType === 'td') {
      suggestions.push({
        locator: `table >> tr:nth-child(${table.rowIndex + 1}) >> td:nth-child(${table.columnIndex + 1})`,
        type: 'css',
        confidence: 0.82,
        reasoning: 'Table cell position relative to row and column',
        strategy: 'table-position',
        stability: 'medium'
      });

      suggestions.push({
        locator: `//table//tr[${table.rowIndex + 1}]/td[${table.columnIndex + 1}]`,
        type: 'xpath',
        confidence: 0.80,
        reasoning: 'XPath-based table cell selection',
        strategy: 'table-xpath',
        stability: 'medium'
      });
    }

    // Table ID context
    if (table.tableId) {
      suggestions.push({
        locator: `#${table.tableId} >> tr:nth-child(${table.rowIndex + 1}) >> ${table.cellType}:nth-child(${table.columnIndex + 1})`,
        type: 'css',
        confidence: 0.85,
        reasoning: 'Table ID provides stable anchor point',
        strategy: 'table-id-context',
        stability: 'high'
      });
    }

    return suggestions;
  }

  /**
   * Generate modal/dialog context locators
   */
  private generateModalLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];
    const modal = context.modalContext!;

    if (modal.dialogRole) {
      suggestions.push({
        locator: `[role="dialog"] >> ${this.generateSimpleSelector(context)}`,
        type: 'css',
        confidence: 0.88,
        reasoning: 'Dialog role isolates modal context from main page',
        strategy: 'dialog-isolation',
        stability: 'high'
      });
    }

    if (modal.modalId) {
      suggestions.push({
        locator: `#${modal.modalId} >> ${this.generateSimpleSelector(context)}`,
        type: 'css',
        confidence: 0.90,
        reasoning: 'Modal ID provides stable container reference',
        strategy: 'modal-id-context',
        stability: 'high'
      });
    }

    return suggestions;
  }

  /**
   * Generate relative locators (positioned relative to stable landmarks)
   */
  private generateRelativeLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];

    // Near stable parent
    if (context.parent && this.hasStableIdentifier(context.parent)) {
      const parentSelector = this.getStableSelector(context.parent);
      
      suggestions.push({
        locator: `${parentSelector} >> ${context.tag}`,
        type: 'playwright',
        confidence: 0.84,
        reasoning: 'Element positioned relative to stable parent',
        strategy: 'relative-to-parent',
        stability: 'medium'
      });
    }

    // Near sibling with text
    if (context.siblings && context.siblings.length > 0) {
      const stableSibling = context.siblings.find(s => s.text || this.hasStableIdentifier(s));
      
      if (stableSibling) {
        suggestions.push({
          locator: `${context.tag}:near(${this.generateSimpleSelector(stableSibling)})`,
          type: 'playwright',
          confidence: 0.81,
          reasoning: 'Element positioned near identifiable sibling',
          strategy: 'relative-to-sibling',
          stability: 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate composite locators (combine multiple attributes)
   */
  private generateCompositeLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];

    // Combine tag + class + text
    if (context.attributes['class'] && context.text) {
      const classes = context.attributes['class'].split(' ').filter(c => !this.isDynamicClass(c));
      
      if (classes.length > 0) {
        suggestions.push({
          locator: `${context.tag}.${classes[0]}:has-text("${context.text}")`,
          type: 'playwright',
          confidence: 0.86,
          reasoning: 'Composite selector combining tag, class, and text',
          strategy: 'composite-tag-class-text',
          stability: 'medium'
        });
      }
    }

    // Combine multiple attributes
    const stableAttrs = this.getStableAttributes(context);
    if (stableAttrs.length >= 2) {
      const attrSelector = stableAttrs.map(([key, val]) => `[${key}="${val}"]`).join('');
      
      suggestions.push({
        locator: `${context.tag}${attrSelector}`,
        type: 'css',
        confidence: 0.83,
        reasoning: 'Multiple stable attributes increase uniqueness',
        strategy: 'composite-attributes',
        stability: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Generate Shadow DOM aware locators
   */
  private generateShadowDomLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];

    // Shadow DOM piercing selector
    suggestions.push({
      locator: `${context.tag} >>> ${this.generateSimpleSelector(context)}`,
      type: 'css',
      confidence: 0.79,
      reasoning: 'Shadow DOM piercing combinator to access shadow tree',
      strategy: 'shadow-pierce',
      stability: 'medium'
    });

    return suggestions;
  }

  /**
   * Generate data attribute locators
   */
  private generateDataAttributeLocators(context: ElementContext): LocatorSuggestion[] {
    const suggestions: LocatorSuggestion[] = [];

    // Test ID (highest priority data attribute)
    if (context.attributes['data-testid'] || context.attributes['data-test-id']) {
      const testId = context.attributes['data-testid'] || context.attributes['data-test-id'];
      
      suggestions.push({
        locator: `getByTestId('${testId}')`,
        type: 'playwright',
        confidence: 0.97,
        reasoning: 'Test ID is explicitly designed for testing and highly stable',
        strategy: 'data-testid',
        stability: 'high'
      });
    }

    // Other data attributes
    const dataAttrs = Object.keys(context.attributes)
      .filter(key => key.startsWith('data-') && !key.includes('testid'))
      .map(key => ({ key, value: context.attributes[key] }));

    for (const attr of dataAttrs) {
      suggestions.push({
        locator: `[${attr.key}="${attr.value}"]`,
        type: 'css',
        confidence: 0.85,
        reasoning: `Data attribute ${attr.key} provides semantic meaning`,
        strategy: 'data-attribute',
        stability: 'high'
      });
    }

    return suggestions;
  }

  // Helper methods

  private hasStableParent(context: ElementContext): boolean {
    if (!context.parent) return false;
    return this.hasStableIdentifier(context.parent);
  }

  private hasStableIdentifier(element: ElementContext): boolean {
    return !!(
      element.attributes['id'] && !this.isDynamicId(element.attributes['id']) ||
      element.attributes['data-testid'] ||
      element.attributes['name'] ||
      element.attributes['aria-label']
    );
  }

  private isDynamicId(id: string): boolean {
    // Check for dynamic patterns: timestamps, UUIDs, random numbers
    return /\d{6,}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}|random|uid|timestamp/i.test(id);
  }

  private isDynamicClass(className: string): boolean {
    // Check for CSS-in-JS, hashed classes
    return /^(css|sc|jss|emotion)-[a-z0-9]+$/i.test(className);
  }

  private getStableSelector(element: ElementContext): string {
    if (element.attributes['data-testid']) {
      return `[data-testid="${element.attributes['data-testid']}"]`;
    }
    if (element.attributes['id'] && !this.isDynamicId(element.attributes['id'])) {
      return `#${element.attributes['id']}`;
    }
    if (element.attributes['name']) {
      return `[name="${element.attributes['name']}"]`;
    }
    return element.tag;
  }

  private getStableAttributes(context: ElementContext): [string, string][] {
    const stable: [string, string][] = [];
    
    for (const [key, value] of Object.entries(context.attributes)) {
      if (key === 'id' && this.isDynamicId(value)) continue;
      if (key === 'class' && this.isDynamicClass(value)) continue;
      if (key.startsWith('data-') || key.startsWith('aria-') || key === 'name' || key === 'type') {
        stable.push([key, value]);
      }
    }

    return stable;
  }

  private generateSimpleSelector(element: ElementContext): string {
    if (element.attributes['data-testid']) {
      return `[data-testid="${element.attributes['data-testid']}"]`;
    }
    if (element.attributes['id'] && !this.isDynamicId(element.attributes['id'])) {
      return `#${element.attributes['id']}`;
    }
    if (element.text) {
      return `${element.tag}:has-text("${element.text}")`;
    }
    return element.tag;
  }
}

// Singleton instance
export const contextAwareLocatorService = new ContextAwareLocatorService();
