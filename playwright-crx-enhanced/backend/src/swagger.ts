import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Playwright CRX Enhanced Backend API',
    version: '1.0.0',
    description: 'API documentation for Playwright CRX Enhanced backend',
  },
  servers: [
    { url: 'http://localhost:3001/api' },
    { url: 'http://127.0.0.1:3001/api' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Script: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          language: { type: 'string' },
          code: { type: 'string' },
          browserType: { type: 'string' },
          viewport: {
            type: 'object',
            properties: {
              width: { type: 'number' },
              height: { type: 'number' }
            }
          },
          testIdAttribute: { type: 'string' },
          selfHealingEnabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          projectId: { type: 'string' }
        }
      },
      TestRun: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          scriptId: { type: 'string' },
          status: { type: 'string' },
          duration: { type: 'number' },
          errorMsg: { type: 'string' },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
          environment: { type: 'string' },
          browser: { type: 'string' },
          traceUrl: { type: 'string' },
          videoUrl: { type: 'string' },
          screenshotUrls: { type: 'array', items: { type: 'string' } }
        }
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' }
        }
      }
    }
  },
  tags: [
    { name: 'Auth' },
    { name: 'Scripts' },
    { name: 'TestRuns' },
    { name: 'Extensions' },
    { name: 'TestData' }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    tokens: { $ref: '#/components/schemas/AuthTokens' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email', 'password', 'name']
              }
            }
          }
        },
        responses: { '201': { description: 'User registered' } }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { refreshToken: { type: 'string' } },
                required: ['refreshToken']
              }
            }
          }
        },
        responses: { '200': { description: 'Token refreshed' } }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Logged out' } }
      }
    },

    '/scripts': {
      get: {
        tags: ['Scripts'],
        summary: 'Get scripts',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of scripts',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Script' } } } }
          }
        }
      },
      post: {
        tags: ['Scripts'],
        summary: 'Create script',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  language: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['name', 'code']
              }
            }
          }
        },
        responses: { '201': { description: 'Script created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Script' } } } } }
      }
    },
    '/scripts/{id}': {
      get: {
        tags: ['Scripts'],
        summary: 'Get script by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Script', content: { 'application/json': { schema: { $ref: '#/components/schemas/Script' } } } } }
      },
      put: {
        tags: ['Scripts'],
        summary: 'Update script',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  language: { type: 'string' },
                  description: { type: 'string' },
                  browserType: { type: 'string' },
                  viewport: { type: 'object' },
                  testIdAttribute: { type: 'string' },
                  selfHealingEnabled: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Script updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Script' } } } } }
      },
      delete: {
        tags: ['Scripts'],
        summary: 'Delete script',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Script deleted' } }
      }
    },

    '/test-runs': {
      get: {
        tags: ['TestRuns'],
        summary: 'Get test runs',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of test runs',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TestRun' } } } }
          }
        }
      }
    },
    '/test-runs/active': {
      get: {
        tags: ['TestRuns'],
        summary: 'Get active test runs',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Active test runs' } }
      }
    },
    '/test-runs/{id}': {
      get: {
        tags: ['TestRuns'],
        summary: 'Get test run by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Test run', content: { 'application/json': { schema: { $ref: '#/components/schemas/TestRun' } } } } }
      }
    },
    '/test-runs/start': {
      post: {
        tags: ['TestRuns'],
        summary: 'Start a test run',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { scriptId: { type: 'string' }, environment: { type: 'string' }, browser: { type: 'string' } }, required: ['scriptId'] } } }
        },
        responses: { '201': { description: 'Test run started' } }
      }
    },
    '/test-runs/{testRunId}/stop': {
      post: {
        tags: ['TestRuns'],
        summary: 'Stop a test run',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'testRunId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Test run stopped' } }
      }
    },
    '/test-runs/report': {
      post: {
        tags: ['TestRuns'],
        summary: 'Report a completed test run',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { testName: { type: 'string' }, status: { type: 'string' } }, required: ['testName', 'status'] } } }
        },
        responses: { '201': { description: 'Test run reported' } }
      }
    },

    '/extensions/ping': {
      get: {
        tags: ['Extensions'],
        summary: 'Ping backend',
        responses: { '200': { description: 'OK' } }
      }
    },

    '/testdata/generate': {
      post: {
        tags: ['TestData'],
        summary: 'Generate test data',
        description: 'Generate various types of test data including boundary values, equivalence partitions, and security test cases',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  dataType: {
                    type: 'string',
                    enum: ['user', 'product', 'order', 'transaction', 'custom', 'boundaryValue', 'equivalencePartition', 'securityTest'],
                    description: 'Type of test data to generate'
                  },
                  count: {
                    type: 'number',
                    description: 'Number of records to generate',
                    example: 10
                  },
                  schema: {
                    type: 'object',
                    description: 'Custom schema for custom data type'
                  },
                  locale: {
                    type: 'string',
                    description: 'Locale for data generation',
                    example: 'en-US'
                  },
                  options: {
                    type: 'object',
                    properties: {
                      includeEdgeCases: { type: 'boolean', description: 'Include edge cases' },
                      includeNullValues: { type: 'boolean', description: 'Include null values' },
                      includeSpecialChars: { type: 'boolean', description: 'Include special characters' },
                      fieldName: { type: 'string', description: 'Field name for boundary/partition testing', example: 'amount' },
                      fieldType: { type: 'string', enum: ['number', 'string', 'date'], description: 'Field type for boundary testing' },
                      minValue: { type: 'number', description: 'Minimum value for boundary testing', example: 0.01 },
                      maxValue: { type: 'number', description: 'Maximum value for boundary testing', example: 999999.99 },
                      partitionType: { type: 'string', enum: ['valid', 'invalid', 'boundary', 'all'], description: 'Partition type for equivalence testing' }
                    }
                  }
                },
                required: ['dataType', 'count']
              },
              examples: {
                'boundaryValue': {
                  summary: 'Boundary Value Analysis',
                  value: {
                    dataType: 'boundaryValue',
                    count: 9,
                    options: {
                      fieldName: 'transferAmount',
                      fieldType: 'number',
                      minValue: 0.01,
                      maxValue: 999999.99
                    }
                  }
                },
                'equivalencePartition': {
                  summary: 'Equivalence Partitioning',
                  value: {
                    dataType: 'equivalencePartition',
                    count: 15,
                    options: {
                      fieldName: 'transferAmount',
                      partitionType: 'all'
                    }
                  }
                },
                'securityTest': {
                  summary: 'Security Testing Data',
                  value: {
                    dataType: 'securityTest',
                    count: 20
                  }
                },
                'user': {
                  summary: 'User Data',
                  value: {
                    dataType: 'user',
                    count: 10,
                    options: {
                      includeEdgeCases: true
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Test data generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { type: 'object' }
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        generatedCount: { type: 'number' },
                        dataType: { type: 'string' },
                        processingTime: { type: 'number' }
                      }
                    }
                  }
                },
                examples: {
                  'boundaryValue': {
                    summary: 'Boundary Value Response',
                    value: {
                      success: true,
                      data: [
                        {
                          id: 0,
                          testType: 'boundary_value_analysis',
                          fieldName: 'transferAmount',
                          fieldType: 'number',
                          boundaryType: 'min',
                          description: 'Minimum valid value',
                          value: 0.01,
                          isValid: true,
                          expectedResult: 'accept',
                          range: { min: 0.01, max: 999999.99 }
                        }
                      ],
                      metadata: {
                        generatedCount: 1,
                        dataType: 'boundaryValue',
                        processingTime: 15
                      }
                    }
                  },
                  'equivalencePartition': {
                    summary: 'Equivalence Partition Response',
                    value: {
                      success: true,
                      data: [
                        {
                          id: 0,
                          testType: 'equivalence_partitioning',
                          fieldName: 'transferAmount',
                          partition: 'valid',
                          partitionClass: 'Small transfers',
                          value: 250,
                          range: '0.01 - 1000',
                          isValid: true,
                          expectedResult: 'accept',
                          errorCode: null,
                          testScenario: 'Test transferAmount with Small transfers'
                        }
                      ],
                      metadata: {
                        generatedCount: 1,
                        dataType: 'equivalencePartition',
                        processingTime: 12
                      }
                    }
                  },
                  'securityTest': {
                    summary: 'Security Test Response',
                    value: {
                      success: true,
                      data: [
                        {
                          id: 0,
                          testType: 'security_test',
                          attackType: 'sql_injection',
                          severity: 'critical',
                          owasp: 'A03:2021 - Injection',
                          payload: "' OR '1'='1",
                          targetField: 'login_username',
                          description: 'Classic SQLi bypass',
                          expectedBehavior: 'reject_and_sanitize',
                          bankingImpact: 'Unauthorized access to customer accounts, data breach'
                        }
                      ],
                      metadata: {
                        generatedCount: 1,
                        dataType: 'securityTest',
                        processingTime: 8
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Invalid data type' }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Failed to generate test data' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const options = {
  definition: swaggerDefinition,
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
