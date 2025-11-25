import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScriptValidationModal.css';

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

interface SuggestionReview {
  accepted: boolean;
  comment: string;
}

interface TestDataRecord {
  _testDataType: string;
  [key: string]: any;
}

interface TestDataSummary {
  type: string;
  count: number;
  records: TestDataRecord[];
  issues: string[];
}

interface DiffLine {
  line: number;
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

interface EnhancementData {
  scriptId: string;
  scriptName: string;
  originalCode: string;
  enhancedCode: string;
  suggestions: EnhancementSuggestion[];
  diff: DiffLine[];
  summary: {
    totalSuggestions: number;
    byCategory: Record<string, number>;
    estimatedImprovement: number;
  };
}

interface ScriptValidationModalProps {
  scriptId?: string;
  scriptName?: string;
  onClose: () => void;
}

export const ScriptValidationModal: React.FC<ScriptValidationModalProps> = ({
  scriptId: initialScriptId,
  scriptName: initialScriptName,
  onClose
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedScriptId, setSelectedScriptId] = useState<string>(initialScriptId || '');
  const [selectedScriptName, setSelectedScriptName] = useState<string>(initialScriptName || '');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingEnhancement, setLoadingEnhancement] = useState(false);
  const [enhancement, setEnhancement] = useState<EnhancementData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  
  // Review comments state
  const [suggestionReviews, setSuggestionReviews] = useState<Map<number, SuggestionReview>>(new Map());
  const [globalComment, setGlobalComment] = useState<string>('');
  
  // Workflow state
  const [workflowStatus, setWorkflowStatus] = useState<string>('');
  const [scriptWorkflowStatus, setScriptWorkflowStatus] = useState<string>('');
  
  // Test data state
  const [testDataSummary, setTestDataSummary] = useState<TestDataSummary[]>([]);
  const [loadingTestData, setLoadingTestData] = useState(false);
  const [selectedTestDataAction, setSelectedTestDataAction] = useState<'approve' | 'regenerate' | 'reject' | null>(null);

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
      loadEnhancementData();
    }
  }, [selectedScriptId]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await axios.get(`${API_URL}/projects`, { headers });
      console.log('Projects loaded:', res.data);
      setProjects(res.data.data || []);
      
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
      setError(err.response?.data?.error || 'Failed to load projects.');
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
      
      if (initialScriptId && !selectedScriptId) {
        setSelectedScriptId(initialScriptId);
      }
    } catch (err: any) {
      console.error('Failed to load scripts:', err);
      setError(err.response?.data?.error || 'Failed to load scripts.');
    }
  };

  const loadEnhancementData = async () => {
    if (!selectedScriptId) return;

    setLoadingEnhancement(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_URL}/scripts/${selectedScriptId}/enhancement-for-validation`,
        { headers }
      );
      console.log('Enhancement data loaded:', res.data);
      const data: EnhancementData = res.data.data;
      console.log('Original Code Length:', data.originalCode?.length);
      console.log('Enhanced Code Length:', data.enhancedCode?.length);
      console.log('Suggestions Count:', data.suggestions?.length);
      setEnhancement(data);
      setSelectedScriptName(data.scriptName);

      // Pre-select all high-confidence suggestions
      const highConfidence = new Set(
        data.suggestions
          .filter(s => s.confidence >= 0.8)
          .map((_, idx) => idx)
      );
      setSelectedSuggestions(highConfidence);
      
      // Load script workflow status
      await loadScriptWorkflowStatus();
      
      // Load test data for review
      await loadTestDataForReview();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load enhancement data';
      console.error('Enhancement error:', err);
      setError(errorMsg);
    } finally {
      setLoadingEnhancement(false);
    }
  };

  const loadScriptWorkflowStatus = async () => {
    if (!selectedScriptId) return;
    try {
      const res = await axios.get(`${API_URL}/scripts/${selectedScriptId}`, { headers });
      const script = res.data.data;
      setScriptWorkflowStatus(script.workflowStatus || 'draft');
    } catch (err) {
      console.error('Failed to load workflow status:', err);
    }
  };

  const loadTestDataForReview = async () => {
    if (!selectedScriptId) return;
    setLoadingTestData(true);
    try {
      // Try to fetch test data associated with this script
      const res = await axios.get(`${API_URL}/testdata`, { 
        headers,
        params: { scriptId: selectedScriptId }
      });
      
      if (res.data.data && res.data.data.length > 0) {
        // Group test data by type
        const groupedData: Record<string, TestDataRecord[]> = {};
        res.data.data.forEach((record: TestDataRecord) => {
          const type = record._testDataType || 'positive';
          if (!groupedData[type]) {
            groupedData[type] = [];
          }
          groupedData[type].push(record);
        });
        
        // Create summary
        const summary: TestDataSummary[] = Object.entries(groupedData).map(([type, records]) => ({
          type,
          count: records.length,
          records: records.slice(0, 5), // Show first 5 records
          issues: detectTestDataIssues(records, type)
        }));
        
        setTestDataSummary(summary);
      }
    } catch (err) {
      console.error('Failed to load test data:', err);
    } finally {
      setLoadingTestData(false);
    }
  };

  const detectTestDataIssues = (records: TestDataRecord[], type: string): string[] => {
    const issues: string[] = [];
    
    if (records.length === 0) {
      issues.push('No test data records found');
    }
    
    if (type === 'boundary' && records.length < 5) {
      issues.push('Insufficient boundary value cases (recommended: 5+)');
    }
    
    if (type === 'security') {
      const hasXSS = records.some(r => JSON.stringify(r).includes('<script>'));
      const hasSQLi = records.some(r => JSON.stringify(r).includes("'"));
      if (!hasXSS) issues.push('Missing XSS test cases');
      if (!hasSQLi) issues.push('Missing SQL injection test cases');
    }
    
    // Check for duplicate records
    const stringified = records.map(r => JSON.stringify(r));
    const uniqueRecords = new Set(stringified);
    if (uniqueRecords.size < records.length) {
      issues.push(`Found ${records.length - uniqueRecords.size} duplicate records`);
    }
    
    return issues;
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

  const addSuggestionReview = (index: number, comment: string) => {
    const newReviews = new Map(suggestionReviews);
    newReviews.set(index, {
      accepted: selectedSuggestions.has(index),
      comment
    });
    setSuggestionReviews(newReviews);
  };

  const handleWorkflowAction = async (action: 'approve' | 'requestChanges' | 'rejectToAI' | 'rejectToDraft') => {
    if (!enhancement || !selectedScriptId) return;

    setApplying(true);
    setWorkflowStatus(action);
    
    try {
      // Build review payload
      const reviewData = {
        acceptedSuggestions: Array.from(selectedSuggestions),
        suggestionReviews: Object.fromEntries(suggestionReviews),
        globalComment,
        testDataApproved: selectedTestDataAction === 'approve',
        testDataAction: selectedTestDataAction
      };

      switch (action) {
        case 'approve':
          // Apply enhancements first
          await applyEnhancements();
          
          // Then finalize via pipeline
          await axios.post(
            `http://localhost:3001/api/pipeline/${selectedScriptId}/finalize`,
            { 
              approved: true, 
              comments: globalComment || 'Approved during human validation',
              reviewData 
            },
            { headers }
          );
          alert('✅ Script approved and finalized! Status: finalized');
          break;

        case 'requestChanges':
          await axios.post(
            `http://localhost:3001/api/pipeline/${selectedScriptId}/finalize`,
            { 
              approved: false, 
              comments: globalComment || 'Changes requested',
              reviewData 
            },
            { headers }
          );
          alert('🔄 Changes requested. Script moved back to testdata_ready');
          break;

        case 'rejectToAI':
          await axios.post(
            `${API_URL}/scripts/${selectedScriptId}/update-workflow`,
            { 
              workflowStatus: 'ai_enhanced',
              comments: globalComment || 'Rejected - Re-run AI enhancement requested'
            },
            { headers }
          );
          alert('🤖 Script sent back for AI re-enhancement');
          break;

        case 'rejectToDraft':
          await axios.post(
            `${API_URL}/scripts/${selectedScriptId}/update-workflow`,
            { 
              workflowStatus: 'draft',
              comments: globalComment || 'Rejected - Start over'
            },
            { headers }
          );
          alert('❌ Script rejected and moved to draft');
          break;
      }

      onClose();
    } catch (err: any) {
      console.error('Workflow action error:', err);
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setApplying(false);
      setWorkflowStatus('');
    }
  };

  const applyEnhancements = async () => {
    if (!enhancement) return;

    let finalCode = enhancement.enhancedCode;
    
    if (selectedSuggestions.size !== enhancement.suggestions.length) {
      const lines = enhancement.originalCode.split('\n');
      const selectedSuggestionsList = enhancement.suggestions
        .filter((_, idx) => selectedSuggestions.has(idx))
        .sort((a, b) => b.lineNumber - a.lineNumber);

      selectedSuggestionsList.forEach(suggestion => {
        if (suggestion.lineNumber < lines.length) {
          lines[suggestion.lineNumber] = suggestion.suggestedCode;
        }
      });
      finalCode = lines.join('\n');
    }

    await axios.post(
      `${API_URL}/scripts/${selectedScriptId}/apply-enhancement`,
      { enhancedCode: finalCode },
      { headers }
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      locator: '#3b82f6',
      wait: '#f59e0b',
      'error-handling': '#ef4444',
      'best-practice': '#10b981'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      locator: '🎯',
      wait: '⏱️',
      'error-handling': '🛡️',
      'best-practice': '✨'
    };
    return icons[category] || '📝';
  };

  if (loadingProjects) {
    return (
      <div className="modal-overlay">
        <div className="validation-modal">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingEnhancement) {
    return (
      <div className="modal-overlay">
        <div className="validation-modal">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading enhancement data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedScriptId) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>🔍 Selector Validation</h2>
              <p className="script-name">Select a script to validate</p>
            </div>
            <button onClick={onClose} className="close-btn">×</button>
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
                      <p style={{ color: '#f59e0b', marginTop: '8px' }}>⚠️ No scripts found in this project.</p>
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
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="validation-modal validation-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>✅ Human Validation - Code Review</h2>
            <p className="script-name">
              {selectedScriptName}
              {scriptWorkflowStatus && (
                <span style={{ 
                  marginLeft: '12px', 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  background: scriptWorkflowStatus === 'human_review' ? '#dbeafe' : '#fef3c7',
                  color: scriptWorkflowStatus === 'human_review' ? '#1e40af' : '#92400e'
                }}>
                  📋 Status: {scriptWorkflowStatus.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="error-banner">
            ❌ {error}
          </div>
        )}

        {enhancement && (
          <>
            <div className="validation-summary">
              <div className="summary-card">
                <div className="summary-icon">💡</div>
                <div>
                  <div className="summary-value">{enhancement.summary.totalSuggestions}</div>
                  <div className="summary-label">AI Suggestions</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">✅</div>
                <div>
                  <div className="summary-value">{selectedSuggestions.size}</div>
                  <div className="summary-label">Accepted</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">📊</div>
                <div>
                  <div className="summary-value">{enhancement.summary.estimatedImprovement}%</div>
                  <div className="summary-label">Est. Improvement</div>
                </div>
              </div>
            </div>

            <div className="modal-content">
              <div className="diff-container-side-by-side">
                <div className="diff-pane">
                  <div className="diff-pane-header">
                    <h3>📄 Original Script</h3>
                  </div>
                  <div className="diff-pane-content">
                    <pre className="code-block">
                      {enhancement.originalCode.split('\n').map((line, idx) => {
                        // Check if this line has a suggestion (will be replaced)
                        const hasSuggestion = enhancement.suggestions.find(s => s.lineNumber === idx);
                        return (
                          <div
                            key={idx}
                            className={hasSuggestion ? 'code-line-removed' : 'code-line'}
                          >
                            <span className="line-number">{idx + 1}</span>
                            <span className="line-content">{line || ' '}</span>
                          </div>
                        );
                      })}
                    </pre>
                  </div>
                </div>

                <div className="diff-pane">
                  <div className="diff-pane-header">
                    <h3>✨ Enhanced Script (AI Suggestions)</h3>
                  </div>
                  <div className="diff-pane-content">
                    <pre className="code-block">
                      {enhancement.enhancedCode.split('\n').map((line, idx) => {
                        // Check if this line was changed by AI
                        const hasSuggestion = enhancement.suggestions.find(s => s.lineNumber === idx);
                        return (
                          <div
                            key={idx}
                            className={hasSuggestion ? 'code-line-added' : 'code-line'}
                          >
                            <span className="line-number">{idx + 1}</span>
                            <span className="line-content">{line || ' '}</span>
                          </div>
                        );
                      })}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="suggestions-list" style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>🔍 Review & Accept Suggestions</h3>
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
                        <span className="line-number">Line {suggestion.lineNumber + 1}</span>
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
                      
                      {/* Review Comment Section */}
                      <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                          💬 Review Comment (optional)
                        </label>
                        <textarea
                          placeholder="Add your review comment (why accepted/rejected, concerns, etc.)"
                          value={suggestionReviews.get(index)?.comment || ''}
                          onChange={(e) => addSuggestionReview(index, e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Test Data Validation Section */}
              {testDataSummary.length > 0 && (
                <div style={{ marginTop: '32px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Test Data Review
                    {loadingTestData && <span style={{ fontSize: '0.875rem', color: '#64748b' }}>(Loading...)</span>}
                  </h3>
                  
                  {testDataSummary.map((dataset, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', background: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                            {dataset.type === 'positive' && '✅ Positive Testing'}
                            {dataset.type === 'negative' && '❌ Negative Testing'}
                            {dataset.type === 'boundary' && '📊 Boundary Value Analysis'}
                            {dataset.type === 'security' && '🔒 Security Testing'}
                            {dataset.type === 'equivalence' && '📦 Equivalence Partitioning'}
                          </h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                            {dataset.count} records generated
                          </p>
                        </div>
                      </div>
                      
                      {/* Sample Data Preview */}
                      <div style={{ marginBottom: '12px' }}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ fontWeight: '500', fontSize: '0.875rem', marginBottom: '8px' }}>📝 View Sample Records</summary>
                          <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                            {JSON.stringify(dataset.records, null, 2)}
                          </pre>
                        </details>
                      </div>
                      
                      {/* Issues */}
                      {dataset.issues.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: '600', color: '#dc2626' }}>⚠️ Issues Detected:</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', color: '#991b1b' }}>
                            {dataset.issues.map((issue, issueIdx) => (
                              <li key={issueIdx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Test Data Actions */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedTestDataAction('approve')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: selectedTestDataAction === 'approve' ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: selectedTestDataAction === 'approve' ? '#d1fae5' : 'white',
                        color: selectedTestDataAction === 'approve' ? '#065f46' : '#475569',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}
                    >
                      ✅ Approve Test Data
                    </button>
                    <button
                      onClick={() => setSelectedTestDataAction('regenerate')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: selectedTestDataAction === 'regenerate' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                        background: selectedTestDataAction === 'regenerate' ? '#fef3c7' : 'white',
                        color: selectedTestDataAction === 'regenerate' ? '#92400e' : '#475569',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}
                    >
                      🔄 Request Regeneration
                    </button>
                    <button
                      onClick={() => setSelectedTestDataAction('reject')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: selectedTestDataAction === 'reject' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        background: selectedTestDataAction === 'reject' ? '#fee2e2' : 'white',
                        color: selectedTestDataAction === 'reject' ? '#991b1b' : '#475569',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}
                    >
                      ❌ Reject Test Data
                    </button>
                  </div>
                </div>
              )}

              {/* Global Review Comment */}
              <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  📝 Overall Review Comments
                </label>
                <textarea
                  placeholder="Add your overall review comments (optional but recommended for audit trail)"
                  value={globalComment}
                  onChange={(e) => setGlobalComment(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </>
        )}

        {!enhancement && !loadingEnhancement && (
          <div className="empty-state">
            <p>⏳ Analyzing script for improvements...</p>
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" disabled={applying}>
            Cancel
          </button>
          
          {/* Multi-Action Workflow Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={() => handleWorkflowAction('approve')}
              className="btn-primary"
              disabled={applying || !enhancement || selectedSuggestions.size === 0}
              style={{
                background: '#10b981',
                borderColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {applying && workflowStatus === 'approve' ? '⏳ Processing...' : '✅ Approve & Finalize'}
            </button>
            
            <button
              onClick={() => handleWorkflowAction('requestChanges')}
              className="btn-secondary"
              disabled={applying}
              style={{
                background: '#f59e0b',
                borderColor: '#f59e0b',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {applying && workflowStatus === 'requestChanges' ? '⏳ Processing...' : '🔄 Request Changes'}
            </button>
            
            <button
              onClick={() => handleWorkflowAction('rejectToAI')}
              className="btn-secondary"
              disabled={applying}
              style={{
                background: '#6366f1',
                borderColor: '#6366f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {applying && workflowStatus === 'rejectToAI' ? '⏳ Processing...' : '🤖 Re-run AI'}
            </button>
            
            <button
              onClick={() => handleWorkflowAction('rejectToDraft')}
              className="btn-secondary"
              disabled={applying}
              style={{
                background: '#ef4444',
                borderColor: '#ef4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {applying && workflowStatus === 'rejectToDraft' ? '⏳ Processing...' : '❌ Reject & Restart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptValidationModal;
