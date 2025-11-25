import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScriptEnhancementModal.css';

const API_URL = 'http://localhost:3001/api';

interface Project {
  id: string;
  name: string;
}

interface Script {
  id: string;
  name: string;
  language: string;
  projectId: string;
}

interface EnhancementSuggestion {
  lineNumber: number;
  originalCode: string;
  suggestedCode: string;
  reason: string;
  confidence: number;
  category: string;
}

interface EnhancementData {
  scriptId: string;
  scriptName: string;
  originalCode: string;
  enhancedCode: string;
  suggestions: EnhancementSuggestion[];
  diff: Array<{ line: number; type: string; content: string }>;
  summary: {
    totalSuggestions: number;
    byCategory: Record<string, number>;
    estimatedImprovement: number;
  };
}

interface ScriptEnhancementModalProps {
  scriptId?: string;
  scriptName?: string;
  onClose: () => void;
  onApply: () => void;
  autoOpenTestData?: boolean; // Auto-open test data generation modal
}

export const ScriptEnhancementModal: React.FC<ScriptEnhancementModalProps> = ({
  scriptId: initialScriptId,
  scriptName: initialScriptName,
  onClose,
  onApply,
  autoOpenTestData = false
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedScriptId, setSelectedScriptId] = useState<string>(initialScriptId || '');
  const [selectedScriptName, setSelectedScriptName] = useState<string>(initialScriptName || '');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [enhancement, setEnhancement] = useState<EnhancementData | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'suggestions' | 'diff'>('suggestions');
  const [error, setError] = useState<string | null>(null);
  const [useMLEnhancement, setUseMLEnhancement] = useState(false); // ML toggle
  const [analyzeXPath, setAnalyzeXPath] = useState(false); // XPath analysis toggle
  const [analyzeVisualAI, setAnalyzeVisualAI] = useState(false); // Visual AI screenshot analysis toggle
  const [xpathAnalysis, setXpathAnalysis] = useState<any>(null); // XPath analysis results
  const [visualAIAnalysis, setVisualAIAnalysis] = useState<any>(null); // Visual AI analysis results
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Uploaded script file
  const [uploadAnalysis, setUploadAnalysis] = useState<any>(null); // Upload analysis results
  const [testDataRecommendation, setTestDataRecommendation] = useState<any>(null); // Test data recommendations
  const [generatedTestData, setGeneratedTestData] = useState<any>(null); // Generated test data
  const [generatingTestData, setGeneratingTestData] = useState(false); // Loading state for test data generation
  const [showTestDataModal, setShowTestDataModal] = useState(false); // Show test data generation modal
  const [testDataSource, setTestDataSource] = useState<'current' | 'database' | 'upload'>('current'); // Source for test data generation
  const [selectedTestDataProject, setSelectedTestDataProject] = useState<string>(''); // Selected project for test data
  const [selectedTestDataScript, setSelectedTestDataScript] = useState<string>(''); // Selected script for test data
  const [testDataType, setTestDataType] = useState<'positive' | 'negative' | 'boundary' | 'equivalence' | 'security' | 'all'>('all'); // Type of test data to generate
  const [testDataCount, setTestDataCount] = useState<number>(10); // Number of records to generate
  
  // Phase I: Category toggles for selective enhancement
  const [enableSelectors, setEnableSelectors] = useState(true);
  const [enableWaits, setEnableWaits] = useState(true);
  const [enableAssertions, setEnableAssertions] = useState(true);
  
  // Phase II: Additional category toggles
  const [enablePageObjects, setEnablePageObjects] = useState(true);
  const [enableParameterization, setEnableParameterization] = useState(true);
  const [enableErrorHandling, setEnableErrorHandling] = useState(true);

  // Phase III: New category toggles
  const [enableLogging, setEnableLogging] = useState(true);
  const [enableRetry, setEnableRetry] = useState(true);
  const [enableBestPractices, setEnableBestPractices] = useState(true);

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadScripts(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedScriptId) {
      loadEnhancement();
    }
  }, [selectedScriptId, useMLEnhancement, analyzeXPath, analyzeVisualAI]); // Re-run when ML toggle, XPath toggle, or Visual AI toggle changes

  // Auto-open test data modal if requested
  useEffect(() => {
    if (autoOpenTestData && enhancement && !showTestDataModal) {
      setShowTestDataModal(true);
    }
  }, [autoOpenTestData, enhancement]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await axios.get(`${API_URL}/projects`, { headers });
      console.log('Projects loaded:', res.data);
      setProjects(res.data.data || []);
      
      // If initialScriptId provided, find its project
      if (initialScriptId && res.data.data?.length > 0) {
        const scriptRes = await axios.get(`${API_URL}/scripts/${initialScriptId}`, { headers });
        const script = scriptRes.data.data;
        console.log('Initial script loaded:', script);
        if (script) {
          setSelectedProjectId(script.projectId);
        }
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.response?.data?.error || 'Failed to load projects. Please ensure you are logged in.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadScripts = async (projectId: string) => {
    try {
      console.log('Loading scripts for project:', projectId);
      const res = await axios.get(`${API_URL}/scripts`, { headers, params: { projectId } });
      console.log('Scripts loaded:', res.data);
      const scriptList = res.data.data || res.data.scripts || [];
      setScripts(scriptList);
      
      // Auto-select if initialScriptId is in this project
      if (initialScriptId && !selectedScriptId) {
        setSelectedScriptId(initialScriptId);
      }
    } catch (err: any) {
      console.error('Failed to load scripts:', err);
      setError(err.response?.data?.error || 'Failed to load scripts for this project.');
    }
  };

  const loadEnhancement = async () => {
    if (!selectedScriptId) return;
    
    console.log('Loading enhancement for script:', selectedScriptId, 'ML mode:', useMLEnhancement, 'XPath:', analyzeXPath, 'Visual AI:', analyzeVisualAI);
    setLoading(true);
    setError(null);
    setXpathAnalysis(null); // Reset XPath analysis
    setVisualAIAnalysis(null); // Reset Visual AI analysis
    try {
      // Choose endpoint based on ML toggle
      const endpoint = useMLEnhancement 
        ? `${API_URL}/ml/enhance-script/${selectedScriptId}`
        : `${API_URL}/scripts/${selectedScriptId}/enhance`;
      
      const res = await axios.post(
        endpoint,
        {},
        { headers }
      );
      console.log('Enhancement data received:', res.data);
      const data: EnhancementData = res.data.data;
      setEnhancement(data);
      setSelectedScriptName(data.scriptName);
      
      // If XPath analysis is enabled, extract and analyze XPath expressions
      if (analyzeXPath) {
        await analyzeXPathExpressions(data.originalCode);
      }
      
      // If Visual AI is enabled, extract and analyze screenshots
      if (analyzeVisualAI) {
        await analyzeVisualScreenshots(data.originalCode);
      }
      
      // Pre-select high-confidence suggestions (respecting category toggles)
      const enabledCategories = new Set<string>([
        ...(enableSelectors ? ['selector'] : []),
        ...(enableWaits ? ['wait'] : []),
        ...(enableAssertions ? ['assertion'] : []),
        ...(enablePageObjects ? ['page-object'] : []),
        ...(enableParameterization ? ['parameterization'] : []),
        ...(enableErrorHandling ? ['error-handling'] : []),
        ...(enableLogging ? ['logging'] : []),
        ...(enableRetry ? ['retry'] : []),
        ...(enableBestPractices ? ['best-practice'] : [])
      ]);
      
      const highConfidence = new Set(
        data.suggestions
          .map((s, idx) => ({ s, idx }))
          .filter(({ s }) => s.confidence >= 0.8 && enabledCategories.has(s.category))
          .map(({ idx }) => idx)
      );
      setSelectedSuggestions(highConfidence);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to analyze script';
      console.error('Enhancement error:', err);
      console.error('Error details:', err.response?.data);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const analyzeXPathExpressions = async (code: string) => {
    try {
      // Extract XPath expressions from code
      const xpathMatches = code.match(/['"]xpath=([^'"]+)['"]/g) || [];
      const absoluteXPaths = code.match(/locator\(['"](\/[^'"]+)['"]\)/g) || [];
      const relativeXPaths = code.match(/locator\(['"](\/\/[^'"]+)['"]\)/g) || [];
      
      const allXPaths = [
        ...xpathMatches.map(m => m.replace(/['"]xpath=/g, '').replace(/['"]/g, '')),
        ...absoluteXPaths.map(m => m.match(/locator\(['"]([^'"]+)['"]\)/)?.[1] || ''),
        ...relativeXPaths.map(m => m.match(/locator\(['"]([^'"]+)['"]\)/)?.[1] || '')
      ].filter(x => x && (x.startsWith('/') || x.startsWith('./')));

      if (allXPaths.length === 0) {
        setXpathAnalysis({
          found: false,
          message: 'No XPath expressions found in the script'
        });
        return;
      }

      console.log('Found XPath expressions:', allXPaths);

      // Analyze each XPath using AI service
      const AI_SERVICE_URL = 'http://localhost:8000/api/ai-analysis';
      const analyses = await Promise.all(
        allXPaths.map(async (xpath) => {
          try {
            const response = await axios.post(`${AI_SERVICE_URL}/xpath-deep-analysis`, {
              xpath: xpath
            });
            return {
              xpath,
              ...response.data.data
            };
          } catch (error) {
            console.error('XPath analysis error for:', xpath, error);
            return {
              xpath,
              error: 'Analysis failed'
            };
          }
        })
      );

      setXpathAnalysis({
        found: true,
        count: allXPaths.length,
        analyses
      });

    } catch (error) {
      console.error('XPath extraction error:', error);
      setXpathAnalysis({
        found: false,
        error: 'Failed to analyze XPath expressions'
      });
    }
  };

  const analyzeVisualScreenshots = async (code: string) => {
    try {
      // Extract screenshot commands from code
      const screenshotMatches = code.match(/screenshot\([^)]*\)/g) || [];
      const toHaveScreenshotMatches = code.match(/toHaveScreenshot\([^)]*\)/g) || [];
      const screenshotPaths = code.match(/path:\s*['"]([^'"]+\.png)['"]/g) || [];
      
      const allScreenshots = [
        ...screenshotMatches,
        ...toHaveScreenshotMatches
      ];

      if (allScreenshots.length === 0) {
        setVisualAIAnalysis({
          found: false,
          message: 'No screenshot assertions found in the script'
        });
        return;
      }

      console.log('Found screenshot commands:', allScreenshots);

      // Extract screenshot paths/names
      const paths = screenshotPaths.map(p => {
        const match = p.match(/path:\s*['"]([^'"]+)['"]/);
        return match ? match[1] : null;
      }).filter(Boolean);

      // Analyze screenshots using AI service
      const AI_SERVICE_URL = 'http://localhost:8000/api/ai-analysis';
      const response = await axios.post(`${AI_SERVICE_URL}/visual-ai-analysis`, {
        script_content: code,
        screenshot_commands: allScreenshots,
        screenshot_paths: paths
      });

      setVisualAIAnalysis({
        found: true,
        count: allScreenshots.length,
        ...response.data.data
      });

    } catch (error) {
      console.error('Visual AI analysis error:', error);
      setVisualAIAnalysis({
        found: false,
        error: 'Failed to analyze visual screenshots'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);
    setError(null);
    setUploadAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const AI_SERVICE_URL = 'http://localhost:8000/api/ai-analysis';
      const response = await axios.post(`${AI_SERVICE_URL}/upload-script-xpath-analysis`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload analysis received:', response.data);
      setUploadAnalysis(response.data.data);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.response?.data?.detail || 'Failed to analyze uploaded script');
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = async () => {
    setGeneratingTestData(true);
    setTestDataRecommendation(null);
    setGeneratedTestData(null);

    try {
      const AI_SERVICE_URL = 'http://localhost:8000/api/ai-analysis';
      let scriptCode = '';

      // Get script code based on source
      if (testDataSource === 'current') {
        if (!enhancement?.originalCode) {
          alert('No script loaded. Please select a script first.');
          return;
        }
        scriptCode = enhancement.originalCode;
      } else if (testDataSource === 'database') {
        if (!selectedTestDataScript) {
          alert('Please select a script from the database.');
          return;
        }
        // Fetch script code from database
        const scriptRes = await axios.get(`${API_URL}/scripts/${selectedTestDataScript}`, { headers });
        scriptCode = scriptRes.data.data.code;
      } else if (testDataSource === 'upload') {
        if (!uploadedFile) {
          alert('Please upload a file.');
          return;
        }
        // Read file content
        scriptCode = await uploadedFile.text();
      }
      
      // Step 1: Get test data recommendations
      const recResponse = await axios.post(`${AI_SERVICE_URL}/recommend-testdata`, {
        script_content: scriptCode
      });

      const recommendation = recResponse.data.data;
      setTestDataRecommendation(recommendation);

      // Step 2: Generate actual test data if template exists
      if (recommendation.recommended_template && Object.keys(recommendation.recommended_template).length > 0) {
        const genResponse = await axios.post('http://localhost:8000/api/dynamic/generate-testdata', {
          template: recommendation.recommended_template,
          count: testDataCount,
          testDataType: testDataType // Pass the selected test data type
        });

        setGeneratedTestData(genResponse.data);
      }

      // DON'T close modal - keep it open to show results
      // User can close it manually or click the close button

    } catch (err: any) {
      console.error('Test data generation error:', err);
      setError(err.response?.data?.detail || 'Failed to generate test data');
    } finally {
      setGeneratingTestData(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const applyEnhancements = async () => {
    if (!enhancement) return;

    setApplying(true);
    try {
      // Use the enhanced code from backend or build it from selected suggestions
      let finalCode = enhancement.enhancedCode;
      
      // Build enabled categories set
      const enabledCategories = new Set<string>([
        ...(enableSelectors ? ['selector'] : []),
        ...(enableWaits ? ['wait'] : []),
        ...(enableAssertions ? ['assertion'] : []),
        ...(enablePageObjects ? ['page-object'] : []),
        ...(enableParameterization ? ['parameterization'] : []),
        ...(enableErrorHandling ? ['error-handling'] : []),
        ...(enableLogging ? ['logging'] : []),
        ...(enableRetry ? ['retry'] : []),
        ...(enableBestPractices ? ['best-practice'] : [])
      ]);
      
      // If user deselected some suggestions or disabled categories, rebuild the code
      if (
        selectedSuggestions.size !== enhancement.suggestions.length ||
        enabledCategories.size !== 9
      ) {
        const lines = enhancement.originalCode.split('\n');
        const selectedSuggestionsList = enhancement.suggestions
          .map((s, idx) => ({ s, idx }))
          .filter(({ s, idx }) => selectedSuggestions.has(idx) && enabledCategories.has(s.category))
          .sort((a, b) => b.s.lineNumber - a.s.lineNumber);

        selectedSuggestionsList.forEach(({ s }) => {
          if (s.lineNumber < lines.length) {
            lines[s.lineNumber] = s.suggestedCode;
          }
        });
        finalCode = lines.join('\n');
      }

      const response = await axios.post(
        `${API_URL}/scripts/${selectedScriptId}/apply-enhancement`,
        { enhancedCode: finalCode },
        { headers }
      );

      alert('✅ ' + (response.data.message || 'Script enhanced successfully!'));
      onApply();
      onClose();
    } catch (err: any) {
      alert('Failed to apply enhancements: ' + (err.response?.data?.error || err.message));
    } finally {
      setApplying(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      selector: '#3b82f6',
      wait: '#f59e0b',
      assertion: '#10b981',
      'page-object': '#8b5cf6',
      parameterization: '#ec4899',
      'error-handling': '#ef4444',
      logging: '#06b6d4',
      retry: '#f97316',
      'best-practice': '#84cc16',
      locator: '#3b82f6'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      selector: '🎯',
      wait: '⏱️',
      assertion: '✅',
      'page-object': '📦',
      parameterization: '🔧',
      'error-handling': '🛡️',
      logging: '📝',
      retry: '🔁',
      'best-practice': '✨',
      locator: '🎯'
    };
    return icons[category] || '📝';
  };

  if (loadingProjects) {
    return (
      <div className="modal-overlay">
        <div className="enhancement-modal">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="enhancement-modal">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing script for improvements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="enhancement-modal">
          <div className="error-state">
            <h3>❌ Error</h3>
            <p>{error}</p>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!enhancement) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="enhancement-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>🚀 AI Script Enhancement</h2>
              <p className="script-name">Select a script to enhance</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* ML Enhancement Toggle */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                padding: '8px 12px',
                background: useMLEnhancement ? '#3b82f6' : '#e2e8f0',
                color: useMLEnhancement ? 'white' : '#475569',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              title={useMLEnhancement 
                ? 'ML Mode: Uses AST analysis and pattern recognition for intelligent suggestions' 
                : 'Rule-Based Mode: Uses predefined patterns for fast analysis'}
              >
                <input 
                  type="checkbox" 
                  checked={useMLEnhancement} 
                  onChange={(e) => setUseMLEnhancement(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span>🧠 ML Enhancement</span>
              </label>
              
              {/* XPath Analysis Toggle */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                padding: '8px 12px',
                background: analyzeXPath ? '#10b981' : '#e2e8f0',
                color: analyzeXPath ? 'white' : '#475569',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              title="Analyze XPath expressions and get AI-powered conversion recommendations"
              >
                <input 
                  type="checkbox" 
                  checked={analyzeXPath} 
                  onChange={(e) => setAnalyzeXPath(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#10b981' }}
                />
                <span>🔍 XPath Analysis</span>
              </label>
              
              {/* Visual AI Toggle */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                padding: '8px 12px',
                background: analyzeVisualAI ? '#8b5cf6' : '#e2e8f0',
                color: analyzeVisualAI ? 'white' : '#475569',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              title="Analyze screenshots with Visual AI for regression testing"
              >
                <input 
                  type="checkbox" 
                  checked={analyzeVisualAI} 
                  onChange={(e) => setAnalyzeVisualAI(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#8b5cf6' }}
                />
                <span>🇺 Visual AI</span>
              </label>
              <button onClick={onClose} className="close-btn">×</button>
            </div>
          </div>

          <div className="script-selector">
            {projects.length === 0 ? (
              <div className="empty-state">
                <p style={{ marginBottom: '16px' }}>⚠️ No projects found. Please create a project first.</p>
                <button onClick={onClose} className="btn-primary">Close</button>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="project-select">📁 Select Project</label>
                  <select 
                    id="project-select"
                    value={selectedProjectId} 
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedScriptId('');
                      setEnhancement(null);
                    }}
                    className="form-select"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>

                {selectedProjectId && (
                  <div className="form-group">
                    <label htmlFor="script-select">📝 Select Script</label>
                    {scripts.length === 0 ? (
                      <p style={{ color: '#f59e0b', marginTop: '8px' }}>⚠️ No scripts found in this project. Please create or import a script first.</p>
                    ) : (
                      <select 
                        id="script-select"
                        value={selectedScriptId} 
                        onChange={(e) => {
                          setSelectedScriptId(e.target.value);
                          const script = scripts.find(s => s.id === e.target.value);
                          if (script) {
                            setSelectedScriptName(script.name);
                          }
                        }}
                        className="form-select"
                      >
                        <option value="">Choose a script...</option>
                        {scripts.map(script => (
                          <option key={script.id} value={script.id}>
                            {script.name} ({script.language})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* File Upload Section */}
                <div style={{ 
                  marginTop: '24px', 
                  padding: '16px', 
                  background: '#f8fafc', 
                  borderRadius: '8px',
                  border: '2px dashed #cbd5e1'
                }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: '#1e293b'
                  }}>📤 Or Upload Playwright Script for XPath Analysis</label>
                  <input 
                    type="file" 
                    accept=".ts,.js,.spec.ts,.spec.js"
                    onChange={handleFileUpload}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  />
                  {uploadedFile && (
                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#10b981' }}>
                      ✅ Uploaded: {uploadedFile.name}
                    </p>
                  )}
                </div>

                {selectedScriptId && (
                  <button 
                    onClick={loadEnhancement}
                    className="btn-primary"
                    style={{ marginTop: '16px', width: '100%' }}
                  >
                    🚀 Analyze Script
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="enhancement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🚀 AI Script Enhancement</h2>
            <p className="script-name">{selectedScriptName}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* ML Enhancement Toggle */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              padding: '8px 12px',
              background: useMLEnhancement ? '#3b82f6' : '#e2e8f0',
              color: useMLEnhancement ? 'white' : '#475569',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}>
              <input 
                type="checkbox" 
                checked={useMLEnhancement} 
                onChange={(e) => setUseMLEnhancement(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span>🧠 ML Enhancement</span>
            </label>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        <div className="enhancement-summary">
          <div className="summary-card">
            <div className="summary-icon">💡</div>
            <div>
              <div className="summary-value">{enhancement.summary.totalSuggestions}</div>
              <div className="summary-label">Suggestions</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">{useMLEnhancement ? '🧠' : '📊'}</div>
            <div>
              <div className="summary-value">{useMLEnhancement ? 'ML' : 'Rule'}</div>
              <div className="summary-label">Mode</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div>
              <div className="summary-value">{selectedSuggestions.size}</div>
              <div className="summary-label">Selected</div>
            </div>
          </div>
        </div>

        <div className="view-tabs">
          <button
            className={`tab ${viewMode === 'suggestions' ? 'active' : ''}`}
            onClick={() => setViewMode('suggestions')}
          >
            📝 Suggestions
          </button>
          <button
            className={`tab ${viewMode === 'diff' ? 'active' : ''}`}
            onClick={() => setViewMode('diff')}
          >
            🔄 Code Diff
          </button>
        </div>

        <div className="modal-content">
          {viewMode === 'suggestions' ? (
            <div className="suggestions-list">
              {/* Phase I + II: Category toggles */}
              <div className="category-toggles" style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '12px', 
                marginBottom: '16px', 
                padding: '12px', 
                background: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ width: '100%', fontWeight: 600, marginBottom: '4px', color: '#475569' }}>Phase I: Core Improvements</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableSelectors} 
                    onChange={(e) => setEnableSelectors(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#3b82f6' }}>🎯 Selectors</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableWaits} 
                    onChange={(e) => setEnableWaits(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#f59e0b' }}>⏱️ Waits</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableAssertions} 
                    onChange={(e) => setEnableAssertions(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#10b981' }}>✅ Assertions</span>
                </label>
                
                <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ width: '100%', fontWeight: 600, marginBottom: '4px', color: '#475569' }}>Phase II: Advanced</div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enablePageObjects} 
                    onChange={(e) => setEnablePageObjects(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#8b5cf6' }}>📦 Page Objects</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableParameterization} 
                    onChange={(e) => setEnableParameterization(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#ec4899' }}>🔧 Parameterization</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableErrorHandling} 
                    onChange={(e) => setEnableErrorHandling(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#ef4444' }}>🛡️ Error Handling</span>
                </label>
                
                <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                <div style={{ width: '100%', fontWeight: 600, marginBottom: '4px', color: '#475569' }}>Phase III: New Enhancements</div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableLogging} 
                    onChange={(e) => setEnableLogging(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#06b6d4' }}>📝 Logging</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableRetry} 
                    onChange={(e) => setEnableRetry(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#f97316' }}>🔁 Retry Logic</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={enableBestPractices} 
                    onChange={(e) => setEnableBestPractices(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500, color: '#84cc16' }}>✨ Best Practices</span>
                </label>
              </div>

              {/* Test Data Generation Button */}
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <button
                  onClick={() => setShowTestDataModal(true)}
                  disabled={generatingTestData}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: generatingTestData ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: generatingTestData ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {generatingTestData ? '⏳ Generating Test Data...' : '🧪 Generate Test Data with GPT-4o'}
                </button>
              </div>

              {/* Test Data Recommendation Results */}
              {testDataRecommendation && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🧪 Test Data Generation Results
                  </h4>

                  {/* Detected Fields */}
                  {testDataRecommendation.detected_fields && testDataRecommendation.detected_fields.length > 0 && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '12px', color: '#059669' }}>📊 Detected Fields ({testDataRecommendation.detected_fields.length}):</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {testDataRecommendation.detected_fields.map((field: any, idx: number) => (
                          <div key={idx} style={{
                            padding: '8px',
                            background: '#f0fdf4',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            <div style={{ fontWeight: 600, color: '#059669' }}>{field.field}</div>
                            <div style={{ color: '#6b7280', fontSize: '11px' }}>{field.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GPT-4o Recommendation */}
                  {testDataRecommendation.gpt4_recommendation && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#059669' }}>🤖 GPT-4o Recommendations:</div>
                      {testDataRecommendation.gpt4_recommendation}
                    </div>
                  )}

                  {/* Generated Test Data */}
                  {generatedTestData && generatedTestData.data && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '12px', color: '#059669' }}>
                        ✅ Generated Test Data ({generatedTestData.data.length} records)
                        {generatedTestData.metadata && (
                          <span style={{ 
                            marginLeft: '12px', 
                            padding: '4px 12px', 
                            background: '#3b82f6', 
                            color: 'white', 
                            borderRadius: '6px', 
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            Type: {generatedTestData.metadata.testDataType.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}>
                        {/* Show sample of first 3 records in a prettier format */}
                        {generatedTestData.data.slice(0, 3).map((record: any, idx: number) => (
                          <div key={idx} style={{
                            marginBottom: '12px',
                            padding: '10px',
                            background: 'white',
                            borderRadius: '6px',
                            border: '2px solid #e5e7eb'
                          }}>
                            <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '6px' }}>
                              Record #{idx + 1}
                              {record._testDataType && (
                                <span style={{ 
                                  marginLeft: '8px',
                                  padding: '2px 8px',
                                  background: record._testDataType === 'security' ? '#ef4444' : 
                                             record._testDataType === 'boundary' ? '#f59e0b' :
                                             record._testDataType === 'negative' ? '#ec4899' : '#10b981',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 700
                                }}>
                                  {record._testDataType.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '11px' }}>
                              {JSON.stringify(record, null, 2)}
                            </pre>
                          </div>
                        ))}
                        {generatedTestData.data.length > 3 && (
                          <div style={{ marginTop: '12px', padding: '8px', background: '#fef3c7', borderRadius: '6px', fontSize: '11px', textAlign: 'center', color: '#92400e' }}>
                            ... and {generatedTestData.data.length - 3} more records (click "View All" below)
                          </div>
                        )}
                      </div>
                      
                      {/* Full JSON view (collapsible) */}
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', padding: '8px', background: '#e0f2fe', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}>
                          📄 View All Records (Full JSON)
                        </summary>
                        <div style={{
                          marginTop: '8px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          background: '#f8fafc',
                          padding: '12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(generatedTestData.data, null, 2)}
                          </pre>
                        </div>
                      </details>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(generatedTestData.data, null, 2));
                          alert('✅ Test data copied to clipboard!');
                        }}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        📋 Copy to Clipboard
                      </button>
                    </div>
                  )}

                  {/* Test Scenarios */}
                  {testDataRecommendation.test_scenarios && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '12px', color: '#059669' }}>🎯 Recommended Test Scenarios:</div>
                      {testDataRecommendation.test_scenarios.map((scenario: any, idx: number) => (
                        <div key={idx} style={{
                          padding: '10px',
                          background: '#f0fdf4',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: 600, color: '#059669', marginBottom: '4px' }}>
                            {scenario.type.toUpperCase()}: {scenario.count} records
                          </div>
                          <div style={{ color: '#6b7280' }}>{scenario.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>🔍 Review & Accept Suggestions</h3>
              
              {/* XPath Analysis Results */}
              {xpathAnalysis && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#f0fdf4',
                  border: '2px solid #10b981',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🔍 XPath Analysis Results
                  </h4>
                  
                  {xpathAnalysis.found ? (
                    <>
                      <p style={{ marginBottom: '12px', color: '#065f46' }}>
                        Found <strong>{xpathAnalysis.count}</strong> XPath expression{xpathAnalysis.count > 1 ? 's' : ''}
                      </p>
                      
                      {xpathAnalysis.analyses.map((analysis: any, idx: number) => (
                        <div key={idx} style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d1fae5'
                        }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontFamily: 'monospace',
                            marginBottom: '8px',
                            color: '#374151',
                            wordBreak: 'break-all'
                          }}>
                            <strong>XPath:</strong> {analysis.xpath}
                          </div>
                          
                          {analysis.error ? (
                            <div style={{ color: '#ef4444' }}>⚠️ {analysis.error}</div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ 
                                  padding: '4px 8px', 
                                  background: '#dbeafe', 
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}>
                                  Type: {analysis.type}
                                </span>
                                <span style={{ 
                                  padding: '4px 8px', 
                                  background: analysis.stability === 'high' ? '#d1fae5' : analysis.stability === 'medium' ? '#fef3c7' : '#fee2e2',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}>
                                  Stability: {analysis.stability}
                                </span>
                                <span style={{ 
                                  padding: '4px 8px', 
                                  background: '#f3e8ff', 
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}>
                                  Complexity: {analysis.complexity_score}/100
                                </span>
                              </div>
                              
                              {analysis.issues && analysis.issues.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                                    ⚠️ Issues:
                                  </div>
                                  {analysis.issues.map((issue: string, i: number) => (
                                    <div key={i} style={{ fontSize: '12px', color: '#991b1b', marginLeft: '12px' }}>
                                      • {issue}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* GPT-4o Analysis */}
                              {analysis.gpt4_analysis && (
                                <div style={{
                                  marginTop: '12px',
                                  padding: '12px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  lineHeight: '1.5'
                                }}>
                                  <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🤖 GPT-4o Analysis:
                                  </div>
                                  <div style={{ whiteSpace: 'pre-wrap', opacity: 0.95 }}>
                                    {analysis.gpt4_analysis}
                                  </div>
                                </div>
                              )}
                              
                              {analysis.ai_recommendation && (
                                <div style={{ 
                                  marginTop: '12px',
                                  padding: '12px',
                                  background: '#ecfdf5',
                                  border: '2px solid #10b981',
                                  borderRadius: '8px'
                                }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#047857', marginBottom: '8px' }}>
                                    🎯 Old vs New Comparison:
                                  </div>
                                  
                                  {/* Old XPath */}
                                  <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                                      ❌ Old (XPath):
                                    </div>
                                    <code style={{ 
                                      fontSize: '12px', 
                                      color: '#991b1b',
                                      display: 'block',
                                      padding: '8px',
                                      background: '#fee2e2',
                                      borderRadius: '4px',
                                      wordBreak: 'break-all'
                                    }}>
                                      {analysis.xpath}
                                    </code>
                                  </div>
                                  
                                  {/* New Recommendation */}
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#047857', marginBottom: '4px' }}>
                                      ✅ New (Recommended):
                                    </div>
                                    <code style={{ 
                                      fontSize: '12px', 
                                      color: '#065f46',
                                      display: 'block',
                                      padding: '8px',
                                      background: '#d1fae5',
                                      borderRadius: '4px',
                                      marginBottom: '8px',
                                      wordBreak: 'break-all'
                                    }}>
                                      {analysis.ai_recommendation.locator}
                                    </code>
                                    <div style={{ fontSize: '11px', color: '#047857', fontStyle: 'italic' }}>
                                      💡 {analysis.ai_recommendation.reasoning}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                      Confidence: {Math.round(analysis.ai_recommendation.confidence * 100)}%
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ color: '#6b7280' }}>
                      {xpathAnalysis.message || xpathAnalysis.error || 'No XPath expressions found'}
                    </p>
                  )}
                </div>
              )}
              
              {/* Visual AI Analysis Results */}
              {visualAIAnalysis && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#faf5ff',
                  border: '2px solid #8b5cf6',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: '#6b21a8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🇺 Visual AI Screenshot Analysis
                  </h4>
                  
                  {visualAIAnalysis.found ? (
                    <>
                      <p style={{ marginBottom: '12px', color: '#6b21a8' }}>
                        Found <strong>{visualAIAnalysis.count}</strong> screenshot command{visualAIAnalysis.count > 1 ? 's' : ''}
                      </p>
                      
                      {visualAIAnalysis.recommendations && visualAIAnalysis.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #e9d5ff'
                        }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: '#6b21a8'
                          }}>
                            📸 {rec.screenshot_type || 'Screenshot Assertion'}
                          </div>
                          
                          {rec.suggestions && (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#047857', marginBottom: '4px' }}>
                                ✅ Recommendations:
                              </div>
                              {rec.suggestions.map((suggestion: string, i: number) => (
                                <div key={i} style={{ fontSize: '12px', color: '#374151', marginLeft: '12px', marginBottom: '4px' }}>
                                  • {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {rec.best_practices && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', marginBottom: '4px' }}>
                                💡 Best Practices:
                              </div>
                              {rec.best_practices.map((practice: string, i: number) => (
                                <div key={i} style={{ fontSize: '12px', color: '#374151', marginLeft: '12px', marginBottom: '4px' }}>
                                  • {practice}
                                </div>
                              ))}
                            </div>
                          )}

                          {rec.example_code && (
                            <div style={{ 
                              marginTop: '12px',
                              padding: '8px',
                              background: '#f3e8ff',
                              borderRadius: '6px'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b21a8', marginBottom: '4px' }}>
                                📝 Example Code:
                              </div>
                              <code style={{ 
                                fontSize: '11px', 
                                color: '#4c1d95',
                                display: 'block',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                              }}>
                                {rec.example_code}
                              </code>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {visualAIAnalysis.gpt4_analysis && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: '1.5'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🤖 GPT-4o Visual AI Analysis:
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', opacity: 0.95 }}>
                            {visualAIAnalysis.gpt4_analysis}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ color: '#6b7280' }}>
                      {visualAIAnalysis.message || visualAIAnalysis.error || 'No screenshot assertions found'}
                    </p>
                  )}
                </div>
              )}
              
              {/* Upload Analysis Results - GPT-4o */}
              {uploadAnalysis && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🤖 GPT-4o Script Analysis: {uploadAnalysis.filename}
                  </h4>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{uploadAnalysis.xpath_count}</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>XPaths Found</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{uploadAnalysis.summary?.low_stability || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Low Stability</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{uploadAnalysis.summary?.avg_complexity?.toFixed(0) || 0}</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Avg Complexity</div>
                    </div>
                  </div>

                  {uploadAnalysis.gpt4_script_analysis && (
                    <div style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#667eea' }}>📝 Overall Analysis:</div>
                      {uploadAnalysis.gpt4_script_analysis}
                    </div>
                  )}

                  {uploadAnalysis.xpaths_analyzed && uploadAnalysis.xpaths_analyzed.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>
                        🔍 Detailed XPath Analysis:
                      </div>
                      {uploadAnalysis.xpaths_analyzed.map((analysis: any, idx: number) => (
                        <div key={idx} style={{
                          background: 'rgba(255,255,255,0.95)',
                          color: '#1e293b',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ 
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            marginBottom: '12px',
                            padding: '8px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                            wordBreak: 'break-all'
                          }}>
                            {analysis.xpath}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              background: '#dbeafe', 
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#1e40af'
                            }}>
                              {analysis.type}
                            </span>
                            <span style={{ 
                              padding: '4px 10px', 
                              background: analysis.stability === 'high' ? '#d1fae5' : analysis.stability === 'medium' ? '#fef3c7' : '#fee2e2',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: analysis.stability === 'high' ? '#065f46' : analysis.stability === 'medium' ? '#92400e' : '#991b1b'
                            }}>
                              {analysis.stability} stability
                            </span>
                            <span style={{ 
                              padding: '4px 10px', 
                              background: '#f3e8ff', 
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#6b21a8'
                            }}>
                              {analysis.complexity_score}/100 complexity
                            </span>
                          </div>

                          {analysis.issues && analysis.issues.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>
                                ⚠️ Issues:
                              </div>
                              {analysis.issues.map((issue: string, i: number) => (
                                <div key={i} style={{ fontSize: '12px', color: '#7f1d1d', marginLeft: '12px', marginBottom: '2px' }}>
                                  • {issue}
                                </div>
                              ))}
                            </div>
                          )}

                          {analysis.gpt4_recommendation && (
                            <div style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              padding: '12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              lineHeight: '1.5'
                            }}>
                              <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🤖 GPT-4o Recommendation:
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap', opacity: 0.95 }}>
                                {analysis.gpt4_recommendation}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadAnalysis.recommendations && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                        💡 General Recommendations:
                      </div>
                      {uploadAnalysis.recommendations.map((rec: string, i: number) => (
                        <div key={i} style={{ 
                          fontSize: '13px', 
                          marginBottom: '6px',
                          paddingLeft: '12px',
                          opacity: 0.95
                        }}>
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {enhancement.suggestions.length === 0 ? (
                <div className="no-suggestions">
                  <p>✨ Great! No improvements needed - your script looks good!</p>
                </div>
              ) : (
                enhancement.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`suggestion-card ${selectedSuggestions.has(index) ? 'selected' : ''}`}
                  >
                    <div className="suggestion-header">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(index)}
                        onChange={() => toggleSuggestion(index)}
                      />
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(suggestion.category) }}
                      >
                        {getCategoryIcon(suggestion.category)} {suggestion.category}
                      </span>
                      <span className="confidence-badge">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                      <span className="line-number">Line {suggestion.lineNumber}</span>
                    </div>
                    <p className="suggestion-reason">{suggestion.reason}</p>
                    <div className="code-comparison">
                      <div className="code-block original">
                        <div className="code-label">Original</div>
                        <pre>{suggestion.originalCode}</pre>
                      </div>
                      <div className="arrow">→</div>
                      <div className="code-block suggested">
                        <div className="code-label">Suggested</div>
                        <pre>{suggestion.suggestedCode}</pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="diff-view">
              <div className="diff-container">
                {enhancement.diff.map((line, idx) => (
                  <div key={idx} className={`diff-line ${line.type}`}>
                    <span className="line-num">{line.line + 1}</span>
                    <span className="line-content">{line.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" disabled={applying}>
            Cancel
          </button>
          <button
            onClick={applyEnhancements}
            className="btn-primary"
            disabled={applying || selectedSuggestions.size === 0}
          >
            {applying ? 'Applying...' : `Apply ${selectedSuggestions.size} Enhancement${selectedSuggestions.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Test Data Generation Modal */}
      {showTestDataModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => {
            // Close modal when clicking backdrop
            setShowTestDataModal(false);
            setTestDataSource('current');
            setSelectedTestDataProject('');
            setSelectedTestDataScript('');
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              🧪 Generate Test Data - Select Source
            </h3>

            {/* Source Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#475569' }}>
                Choose Source:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  border: testDataSource === 'current' ? '2px solid #10b981' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: testDataSource === 'current' ? '#f0fdf4' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="testDataSource"
                    value="current"
                    checked={testDataSource === 'current'}
                    onChange={(e) => setTestDataSource(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>📝 Use Current Script</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Generate from currently loaded script</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  border: testDataSource === 'database' ? '2px solid #10b981' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: testDataSource === 'database' ? '#f0fdf4' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="testDataSource"
                    value="database"
                    checked={testDataSource === 'database'}
                    onChange={(e) => setTestDataSource(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>🗃️ Select from Database</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Pick a project and script from database</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  border: testDataSource === 'upload' ? '2px solid #10b981' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: testDataSource === 'upload' ? '#f0fdf4' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="testDataSource"
                    value="upload"
                    checked={testDataSource === 'upload'}
                    onChange={(e) => setTestDataSource(e.target.value as any)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>📄 Upload Script File</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Upload a .ts, .js, or .spec file</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Database Selection */}
            {testDataSource === 'database' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>
                  📁 Select Project:
                </label>
                <select
                  value={selectedTestDataProject}
                  onChange={(e) => {
                    setSelectedTestDataProject(e.target.value);
                    setSelectedTestDataScript('');
                    if (e.target.value) {
                      loadScripts(e.target.value);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent modal close
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}
                >
                  <option value="">-- Select a project --</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                {selectedTestDataProject && (
                  <>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>
                      📜 Select Script:
                    </label>
                    <select
                      value={selectedTestDataScript}
                      onChange={(e) => setSelectedTestDataScript(e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Prevent modal close
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">-- Select a script --</option>
                      {scripts.map((script: any) => (
                        <option key={script.id} value={script.id}>
                          {script.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            {/* File Upload */}
            {testDataSource === 'upload' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>
                  📄 Upload Playwright Script:
                </label>
                <input
                  type="file"
                  accept=".ts,.js,.spec.ts,.spec.js"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadedFile(file);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px dashed #10b981',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#f0fdf4',
                    cursor: 'pointer'
                  }}
                />
                {uploadedFile && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                    ✅ Selected: {uploadedFile.name}
                  </div>
                )}
              </div>
            )}

            {/* Test Data Type & Count Selection */}
            <div 
              style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
                ⚙️ Test Data Configuration
              </h4>
              
              {/* Test Data Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569', fontSize: '13px' }}>
                  🎯 Select Test Data Type:
                </label>
                <select
                  value={testDataType}
                  onChange={(e) => setTestDataType(e.target.value as any)}
                  onClick={(e) => e.stopPropagation()} // Prevent modal close
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #10b981',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">✨ All Types (Comprehensive)</option>
                  <option value="positive">✅ Positive Testing (Valid Data)</option>
                  <option value="negative">❌ Negative Testing (Invalid Data)</option>
                  <option value="boundary">📊 Boundary Value Analysis</option>
                  <option value="equivalence">📦 Equivalence Partitioning</option>
                  <option value="security">🔒 Security Testing (SQL Injection, XSS)</option>
                </select>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                  {testDataType === 'all' && '• Generates mix of positive, negative, boundary, and security test cases'}
                  {testDataType === 'positive' && '• Valid data within expected ranges and formats'}
                  {testDataType === 'negative' && '• Invalid data: empty, null, wrong types, special characters'}
                  {testDataType === 'boundary' && '• Min, max, just below/above limits, edge cases'}
                  {testDataType === 'equivalence' && '• Representative values from each equivalence class'}
                  {testDataType === 'security' && '• SQL injection, XSS, script tags, malicious payloads'}
                </div>
              </div>

              {/* Test Data Count */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#475569', fontSize: '13px' }}>
                  🔢 Number of Records:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={testDataCount}
                    onChange={(e) => setTestDataCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                    onClick={(e) => e.stopPropagation()} // Prevent modal close
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '2px solid #10b981',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestDataCount(5);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: testDataCount === 5 ? '#10b981' : '#e2e8f0',
                        color: testDataCount === 5 ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      5
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestDataCount(10);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: testDataCount === 10 ? '#10b981' : '#e2e8f0',
                        color: testDataCount === 10 ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      10
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestDataCount(25);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: testDataCount === 25 ? '#10b981' : '#e2e8f0',
                        color: testDataCount === 25 ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      25
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestDataCount(50);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: testDataCount === 50 ? '#10b981' : '#e2e8f0',
                        color: testDataCount === 50 ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      50
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                  • Recommended: 5-10 for quick tests, 25-50 for comprehensive coverage
                </div>
              </div>
            </div>

            {/* Test Data Results - Show INSIDE the modal */}
            {testDataRecommendation && (
              <div style={{
                marginTop: '24px',
                marginBottom: '24px',
                padding: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🧪 Test Data Generation Results
                </h4>

                {/* Detected Fields */}
                {testDataRecommendation.detected_fields && testDataRecommendation.detected_fields.length > 0 && (
                  <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#059669', fontSize: '13px' }}>
                      📊 Detected Fields ({testDataRecommendation.detected_fields.length}):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '6px' }}>
                      {testDataRecommendation.detected_fields.map((field: any, idx: number) => (
                        <div key={idx} style={{
                          padding: '6px',
                          background: '#f0fdf4',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          <div style={{ fontWeight: 600, color: '#059669' }}>{field.field}</div>
                          <div style={{ color: '#6b7280', fontSize: '10px' }}>{field.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Test Data */}
                {generatedTestData && generatedTestData.data && (
                  <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#059669', fontSize: '13px' }}>
                      ✅ Generated Test Data ({generatedTestData.data.length} records):
                    </div>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: '#f8fafc',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(generatedTestData.data, null, 2)}
                      </pre>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(generatedTestData.data, null, 2));
                        alert('✅ Test data copied to clipboard!');
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      📋 Copy to Clipboard
                    </button>
                  </div>
                )}

                {/* GPT-4o Recommendation */}
                {testDataRecommendation.gpt4_recommendation && (
                  <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px', color: '#059669' }}>🤖 GPT-4o Recommendations:</div>
                    {testDataRecommendation.gpt4_recommendation}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTestDataModal(false);
                  setTestDataSource('current');
                  setSelectedTestDataProject('');
                  setSelectedTestDataScript('');
                  // Clear results when closing
                  setTestDataRecommendation(null);
                  setGeneratedTestData(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {testDataRecommendation ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={generateTestData}
                disabled={generatingTestData}
                style={{
                  padding: '10px 20px',
                  background: generatingTestData ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: generatingTestData ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {generatingTestData ? '⏳ Generating...' : '✅ Generate Test Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEnhancementModal;
