import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ApiTesting from './ApiTesting.tsx';
import ScriptEnhancementModal from './ScriptEnhancementModal';
import ImportScriptModal from './ImportScriptModal';
import ScriptValidationModal from './ScriptValidationModal';
import ScriptCueCards from './ScriptCueCards';
import TestDataManager from './TestDataManager';
// import ErrorAnalysis from './ErrorAnalysis';
import './Dashboard.css';

const API_URL = 'http://localhost:3001/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

interface Script {
  id: string;
  name: string;
  language: string;
  description?: string;
  createdAt: string;
  user: { name: string; email: string };
}

interface TestRun {
  id: string;
  status: string;
  duration?: number;
  startedAt: string;
  allureReportUrl?: string;
  executionReportUrl?: string;
  script: { name: string };
}

// interface Stats {
//   totalScripts: number;
//   totalRuns: number;
//   successRate: number;
// }

type ActiveView = 
  | 'overview' 
  | 'scripts' 
  | 'runs' 
  | 'testdata' 
  | 'apitesting' 
  | 'allure'
  | 'analytics'
  | 'settings';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [projectLoading, setProjectLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  // const [stats, setStats] = useState<Stats>({ totalScripts: 0, totalRuns: 0, successRate: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLanguage, setImportLanguage] = useState('javascript');
  const [importing, setImporting] = useState(false);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedScriptForAction, setSelectedScriptForAction] = useState<{ id: string; name: string } | null>(null);
  const [showImportScriptModal, setShowImportScriptModal] = useState(false);
  const [showAllTestRuns, setShowAllTestRuns] = useState(true); // Show all runs by default
  const [autoOpenTestData, setAutoOpenTestData] = useState(false); // Auto-open test data modal
  const [showExecuteModal, setShowExecuteModal] = useState(false); // Script execution modal
  const [currentScriptForExecution, setCurrentScriptForExecution] = useState<{ id: string; name: string } | null>(null);

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  // Handle 401 errors globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('accessToken');
          window.location.href = '/login.html';
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Reload data when project changes
    loadData();
  }, [selectedProjectId]);



  const loadProjects = async () => {
    setProjectLoading(true);
    try {
      const res = await axios.get(`${API_URL}/projects`, { headers });
      const list: Project[] = res.data?.data || res.data?.projects || [];
      setProjects(list);
      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setProjectLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      alert('Project name is required');
      return;
    }
    setProjectLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/projects`,
        { name: newProjectName.trim(), description: newProjectDescription.trim() || undefined },
        { headers }
      );
      const created: Project = res.data?.data || res.data?.project;
      await loadProjects();
      if (created?.id) setSelectedProjectId(created.id);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + (error.response?.data?.error || error.message));
    } finally {
      setProjectLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [scriptsRes, runsRes] = await Promise.all([
        axios
          .get(`${API_URL}/scripts`, { headers, params: { projectId: selectedProjectId || undefined } })
          .catch(() => ({ data: { scripts: [], data: [] } })),
        axios
          .get(`${API_URL}/test-runs`, { 
            headers, 
            params: { projectId: showAllTestRuns ? undefined : (selectedProjectId || undefined) } 
          })
          .catch(() => ({ data: { testRuns: [], data: [] } }))
      ]);

      const scriptData = (scriptsRes as any).data?.scripts || (scriptsRes as any).data?.data || [];
      const runData = (runsRes as any).data?.data || (runsRes as any).data?.testRuns || [];

      setScripts(scriptData);
      setTestRuns(runData);

      // const successCount = runData.filter((r: TestRun) => r.status === 'passed').length;
      // setStats({
      //   totalScripts: scriptData.length,
      //   totalRuns: runData.length,
      //   successRate: runData.length > 0 ? Math.round((successCount / runData.length) * 100) : 0
      // });
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAllureReport = async (testRunId: string) => {
    setGeneratingReport(testRunId);
    try {
      // First check if report already exists
      const testRun = testRuns.find(r => r.id === testRunId);
      if (testRun?.executionReportUrl) {
        // Report already exists, just open it
        setSelectedReport(testRun.executionReportUrl);
        setActiveView('allure');
        setGeneratingReport(null);
        return;
      }

      // Generate new report
      const response = await axios.post(`${API_URL}/allure/generate/${testRunId}`, {}, { headers });
      await loadData();
      setSelectedReport(response.data.reportUrl);
      setActiveView('allure');
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + (error.response?.data?.error || error.message));
    } finally {
      setGeneratingReport(null);
    }
  };



  const handleGenerateReport = async (scriptId: string, projectId?: string) => {
    try {
      console.log('Generating report for script:', scriptId, 'project:', projectId);
      alert(`Generating report for script ${scriptId}...`);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  };

  const handleExecuteScript = async (scriptId: string, scriptName: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/scripts/${scriptId}/execute`,
        {},
        { headers }
      );

      if (response.data.success) {
        alert(`✅ ${scriptName} execution started!

Test Run ID: ${response.data.data.testRunId}

Navigating to Test Runs...`);
        // Reload data to get the new test run
        await loadData();
        // Navigate to Test Runs view
        setActiveView('runs');
      }
    } catch (error: any) {
      console.error('Error executing script:', error);
      alert('Failed to execute script: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleImportScript = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }

    setImporting(true);
    try {
      const fileContent = await importFile.text();
      const scriptName = importFile.name.replace(/\.[^/.]+$/, '');
      
      await axios.post(
        `${API_URL}/scripts`,
        {
          name: scriptName,
          language: importLanguage,
          code: fileContent,
          projectId: selectedProjectId,
          description: `Imported from ${importFile.name}`
        },
        { headers }
      );

      alert('Script imported successfully!');
      setShowImportDialog(false);
      setImportFile(null);
      await loadData();
    } catch (error: any) {
      console.error('Error importing script:', error);
      alert('Failed to import script: ' + (error.response?.data?.error || error.message));
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Auto-detect language from file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'js') setImportLanguage('javascript');
      else if (ext === 'ts') setImportLanguage('typescript');
      else if (ext === 'py') setImportLanguage('python');
      else if (ext === 'java') setImportLanguage('java');
      else if (ext === 'cs') setImportLanguage('csharp');
    }
  };

  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Project Overview', category: 'Main' },
    { id: 'scripts', icon: '📝', label: 'Scripts', category: 'Test Management' },
    { id: 'runs', icon: '▶️', label: 'Test Runs', category: 'Test Management' },
    { id: 'testdata', icon: '🗄️', label: 'Test Data', category: 'Data Management' },
    { id: 'apitesting', icon: '🔌', label: 'API Testing', category: 'Testing Tools' },
    { id: 'allure', icon: '📈', label: 'Test Execution Reports', category: 'Reports' },
    { id: 'analytics', icon: '📉', label: 'Analytics', category: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings', category: 'System' }
  ];

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const currentProjectName = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)?.name || 'Unknown Project'
    : 'No Project';

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🎭 Playwright CRX</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn-logout" 
              onClick={onLogout}
              title="Logout"
              style={{
                padding: '6px 12px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              🚪 Logout
            </button>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Project badge */}
        <div className="project-badge" style={{ padding: '8px 12px', color: '#888' }}>
          Project: <strong>{currentProjectName}</strong>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(groupedMenuItems).map(([category, items]) => (
            <div key={category} className="nav-category">
              <div className="category-label">{category}</div>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView(item.id as ActiveView);
                    setMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {/* Badge removed - no longer using badges */}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Overview */}
          {activeView === 'overview' && (
            <div className="view-container">
              <h1 className="view-title">Project Overview</h1>

              {/* Project Controls */}
              <div className="project-controls" style={{ marginBottom: 24 }}>
                <h2>Project</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="content-card">
                    <div className="form-group">
                      <label>Selected Project</label>
                      <select
                        value={selectedProjectId || ''}
                        onChange={(e) => setSelectedProjectId(e.target.value || null)}
                        disabled={projectLoading}
                        className="form-select"
                      >
                        <option value="">All Projects</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-secondary" onClick={loadProjects} disabled={projectLoading}>
                        {projectLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
                      </button>
                      <button className="btn-secondary" onClick={loadData} disabled={loading}>
                        {loading ? '⏳ Loading...' : '↻ Reload Data'}
                      </button>
                    </div>
                  </div>

                  <div className="content-card">
                    <h3>Create Project</h3>
                    <div className="form-group">
                      <label>Project Name</label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g., Checkout Flow"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description (optional)</label>
                      <textarea
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="Short description"
                        className="form-textarea"
                        rows={3}
                      />
                    </div>
                    <button className="btn-primary" onClick={createProject} disabled={projectLoading}>
                      {projectLoading ? '⏳ Creating...' : '➕ Create Project'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                  <button className="action-card" onClick={() => setActiveView('scripts')}>
                    <span className="action-icon">📝</span>
                    <span className="action-label">View Scripts</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('runs')}>
                    <span className="action-icon">▶️</span>
                    <span className="action-label">Test Runs</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('testdata')}>
                    <span className="action-icon">🗄️</span>
                    <span className="action-label">Test Data</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveView('apitesting')}>
                    <span className="action-icon">🔌</span>
                    <span className="action-label">API Testing</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h2>Recent Test Runs</h2>
                <div className="activity-list">
                  {testRuns.slice(0, 5).map((run) => (
                    <div key={run.id} className="activity-item">
                      <div className="activity-icon">
                        {run.status === 'passed' ? '✅' : run.status === 'failed' ? '❌' : '⏳'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">{run.script.name}</div>
                        <div className="activity-meta">
                          {new Date(run.startedAt).toLocaleString()}
                          {run.duration && ` • ${run.duration}ms`}
                        </div>
                      </div>
                      <span className={`status-badge ${run.status}`}>{run.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scripts View */}
          {activeView === 'scripts' && (
            <div className="view-container">
              <h1 className="view-title" style={{ marginBottom: 24 }}>Test Scripts</h1>
              
              {/* Standard 6-Step Workflow Template */}
              <ScriptCueCards
                script={{
                  id: 'template',
                  name: 'Standard Workflow',
                  language: 'Template'
                }}
                onGenerate={() => setShowImportDialog(true)}
                onEnhance={() => {
                  if (scripts.length === 0) {
                    alert('Please import a script first');
                    return;
                  }
                  setSelectedScriptForAction({ id: scripts[0].id, name: scripts[0].name });
                  setShowEnhancementModal(true);
                }}
                onTestData={() => {
                  if (scripts.length === 0) {
                    alert('Please import a script first');
                    return;
                  }
                  // Open enhancement modal with auto-open test data flag
                  setSelectedScriptForAction({ id: scripts[0].id, name: scripts[0].name });
                  setAutoOpenTestData(true);
                  setShowEnhancementModal(true);
                }}
                onValidate={() => {
                  if (scripts.length === 0) {
                    alert('Please import a script first');
                    return;
                  }
                  setSelectedScriptForAction({ id: scripts[0].id, name: scripts[0].name });
                  setShowValidationModal(true);
                }}
                onFinalize={() => {
                  if (scripts.length === 0) {
                    alert('Please import a script first');
                    return;
                  }
                  // Open script selection modal
                  setCurrentScriptForExecution({ id: scripts[0].id, name: scripts[0].name });
                  setShowExecuteModal(true);
                }}
                onInsights={() => {
                  if (scripts.length === 0) {
                    alert('Please import a script first');
                    return;
                  }
                  setActiveView('analytics');
                }}
                layout="standalone"
                showHeader={true}
              />

              {/* Database Scripts List */}
              <div style={{ marginTop: 40 }}>
                <h2 style={{ marginBottom: 16 }}>
                  📝 Your Scripts {selectedProjectId && `in ${currentProjectName}`}
                </h2>
                {loading ? (
                  <div className="loading-state">Loading scripts...</div>
                ) : scripts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No Scripts Yet</h3>
                    <p>Use Step 1 above to import your first script!</p>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {scripts.map((script) => (
                      <div key={script.id} className="content-card">
                        <div className="card-header">
                          <h3>{script.name}</h3>
                          <span className="language-badge">{script.language}</span>
                        </div>
                        {script.description && <p className="card-description">{script.description}</p>}
                        <div className="card-meta">
                          <span>👤 {script.user.name}</span>
                          <span>📅 {new Date(script.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="card-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              setSelectedScriptForAction({ id: script.id, name: script.name });
                              setShowEnhancementModal(true);
                            }}
                            style={{ flex: 1, fontSize: 13 }}
                          >
                            🚀 Enhance
                          </button>
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              setSelectedScriptForAction({ id: script.id, name: script.name });
                              setShowValidationModal(true);
                            }}
                            style={{ flex: 1, fontSize: 13 }}
                          >
                            🔍 Validate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Import Dialog */}
              {showImportDialog && (
                <div className="modal-overlay" onClick={() => setShowImportDialog(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>📥 Import Script</h2>
                      <button className="modal-close" onClick={() => setShowImportDialog(false)}>
                        ✕
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>Select Project</label>
                        <select
                          value={selectedProjectId || ''}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="form-select"
                        >
                          <option value="">-- Select a project --</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Script Language</label>
                        <select
                          value={importLanguage}
                          onChange={(e) => setImportLanguage(e.target.value)}
                          className="form-select"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="csharp">C#</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Upload Script File</label>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".js,.ts,.py,.java,.cs"
                          className="form-input"
                        />
                        {importFile && (
                          <p style={{ marginTop: 8, fontSize: 13, color: '#667eea' }}>
                            ✓ Selected: {importFile.name}
                          </p>
                        )}
                      </div>

                      <div className="modal-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setShowImportDialog(false)}
                          disabled={importing}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-primary"
                          onClick={handleImportScript}
                          disabled={importing || !importFile || !selectedProjectId}
                        >
                          {importing ? '⏳ Importing...' : '📥 Import Script'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Script Enhancement Modal */}
              {showEnhancementModal && (
                <ScriptEnhancementModal
                  onClose={() => {
                    setShowEnhancementModal(false);
                    setAutoOpenTestData(false);
                  }}
                  onApply={() => {
                    loadData();
                  }}
                  autoOpenTestData={autoOpenTestData}
                />
              )}

              {/* Import Script Modal (for Step 1 - Generate) */}
              {showImportScriptModal && (
                <ImportScriptModal
                  isOpen={showImportScriptModal}
                  onClose={() => setShowImportScriptModal(false)}
                  onGenerateReport={handleGenerateReport}
                  currentScriptId={selectedScriptForAction?.id}
                />
              )}

              {/* Script Validation Modal */}
              {showValidationModal && (
                <ScriptValidationModal
                  scriptId={selectedScriptForAction?.id}
                  scriptName={selectedScriptForAction?.name}
                  onClose={() => {
                    setShowValidationModal(false);
                    setSelectedScriptForAction(null);
                  }}
                />
              )}


            </div>
          )}

          {/* Test Runs View */}
          {activeView === 'runs' && (
            <div className="view-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h1 className="view-title">Test Runs</h1>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={showAllTestRuns}
                    onChange={(e) => {
                      setShowAllTestRuns(e.target.checked);
                      // Reload data with new filter
                      setTimeout(() => loadData(), 100);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Show all test runs (including extension runs)</span>
                </label>
              </div>
              <div style={{ marginBottom: 12, color: '#666' }}>
                Filter: <strong>{showAllTestRuns ? 'All Test Runs' : (selectedProjectId ? currentProjectName : 'All Projects')}</strong>
              </div>
              {loading ? (
                <div className="loading-state">Loading test runs...</div>
              ) : testRuns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▶️</div>
                  <h3>No Test Runs Yet</h3>
                  <p>Execute tests using the extension to see results here!</p>
                </div>
              ) : (
                <div className="runs-list">
                  {testRuns.map((run) => (
                    <div key={run.id} className="run-card">
                      <div className="run-header">
                        <div className="run-info">
                          <h3>{run.script.name}</h3>
                          <div className="run-meta">
                            <span className={`status-badge ${run.status}`}>{run.status}</span>
                            <span>🕒 {new Date(run.startedAt).toLocaleString()}</span>
                            {run.duration && <span>⏱️ {run.duration}ms</span>}
                          </div>
                        </div>
                        <div className="run-actions">
                          {run.allureReportUrl ? (
                            <button
                              className="btn-secondary"
                              onClick={() => {
                                setSelectedReport(run.allureReportUrl!);
                                setActiveView('allure');
                              }}
                            >
                              📊 View Report
                            </button>
                          ) : (
                            <button
                              className="btn-primary"
                              onClick={() => generateAllureReport(run.id)}
                              disabled={generatingReport === run.id}
                            >
                              {generatingReport === run.id ? '⏳ Generating...' : '📊 Generate Report'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test Data Management */}
          {activeView === 'testdata' && <TestDataManager />}

          {/* API Testing */}
          {activeView === 'apitesting' && <ApiTesting />}

          {/* Allure Reports */}
          {activeView === 'allure' && (
            <div className="view-container full-height">
              <h1 className="view-title">Test Execution Reports</h1>
              {selectedReport ? (
                <div className="report-viewer">
                  <div className="report-header">
                    <button className="btn-secondary" onClick={() => setSelectedReport(null)}>
                      ← Back to Runs
                    </button>
                  </div>
                  <iframe
                    src={`http://localhost:3001${selectedReport}`}
                    className="report-iframe"
                    title="Test Execution Report"
                  />
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No Report Selected</h3>
                  <p>Generate or view a test execution report from the Test Runs section.</p>
                  <button className="btn-primary" onClick={() => setActiveView('runs')}>
                    View Test Runs
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {activeView === 'analytics' && (
            <div className="view-container full-width">
              <h1 className="view-title">Analytics Dashboard</h1>
              
              {loading ? (
                <div className="loading-state">Loading analytics...</div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="analytics-stats">
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>📝</div>
                      <div className="stat-content">
                        <h4>Total Scripts</h4>
                        <p className="stat-value">{scripts.length}</p>
                        <p className="stat-subtitle">{selectedProjectId ? currentProjectName : 'All Projects'}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: '#ddd6fe', color: '#6b21a8' }}>▶️</div>
                      <div className="stat-content">
                        <h4>Total Test Runs</h4>
                        <p className="stat-value">{testRuns.length}</p>
                        <p className="stat-subtitle">Last 30 days</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>✅</div>
                      <div className="stat-content">
                        <h4>Success Rate</h4>
                        <p className="stat-value">
                          {testRuns.length > 0
                            ? `${Math.round((testRuns.filter(r => r.status === 'passed').length / testRuns.length) * 100)}%`
                            : 'N/A'}
                        </p>
                        <p className="stat-subtitle">
                          {testRuns.filter(r => r.status === 'passed').length} / {testRuns.length} passed
                        </p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>⏱️</div>
                      <div className="stat-content">
                        <h4>Avg Duration</h4>
                        <p className="stat-value">
                          {testRuns.length > 0 && testRuns.some(r => r.duration)
                            ? `${Math.round(testRuns.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / testRuns.filter(r => r.duration).length / 1000)}s`
                            : 'N/A'}
                        </p>
                        <p className="stat-subtitle">Average execution time</p>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="analytics-grid">
                    {/* Test Status Distribution */}
                    <div className="analytics-card">
                      <h3>📊 Test Status Distribution</h3>
                      <div className="chart-container">
                        {testRuns.length > 0 ? (
                          <div className="pie-chart">
                            {(() => {
                              const passed = testRuns.filter(r => r.status === 'passed').length;
                              const failed = testRuns.filter(r => r.status === 'failed').length;
                              const error = testRuns.filter(r => r.status === 'error').length;
                              const total = testRuns.length;
                              
                              return (
                                <>
                                  <div className="pie-slice-container">
                                    <div 
                                      className="pie-slice" 
                                      style={{
                                        background: `conic-gradient(
                                          #10b981 0% ${(passed/total)*100}%,
                                          #ef4444 ${(passed/total)*100}% ${((passed+failed)/total)*100}%,
                                          #f59e0b ${((passed+failed)/total)*100}% 100%
                                        )`,
                                        width: '200px',
                                        height: '200px',
                                        borderRadius: '50%',
                                        margin: '20px auto'
                                      }}
                                    />
                                  </div>
                                  <div className="chart-legend">
                                    <div className="legend-item">
                                      <span className="legend-color" style={{ background: '#10b981' }}></span>
                                      <span>Passed: {passed} ({Math.round((passed/total)*100)}%)</span>
                                    </div>
                                    <div className="legend-item">
                                      <span className="legend-color" style={{ background: '#ef4444' }}></span>
                                      <span>Failed: {failed} ({Math.round((failed/total)*100)}%)</span>
                                    </div>
                                    <div className="legend-item">
                                      <span className="legend-color" style={{ background: '#f59e0b' }}></span>
                                      <span>Error: {error} ({Math.round((error/total)*100)}%)</span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="empty-chart">No test runs available</div>
                        )}
                      </div>
                    </div>

                    {/* Test Execution Trend */}
                    <div className="analytics-card">
                      <h3>📈 Test Execution Trend (Last 7 Days)</h3>
                      <div className="chart-container">
                        {testRuns.length > 0 ? (
                          <div className="bar-chart">
                            {(() => {
                              const last7Days = Array.from({ length: 7 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (6 - i));
                                return date.toISOString().split('T')[0];
                              });
                              
                              const dailyData = last7Days.map(date => {
                                const dayRuns = testRuns.filter(r => 
                                  new Date(r.startedAt).toISOString().split('T')[0] === date
                                );
                                return {
                                  date,
                                  passed: dayRuns.filter(r => r.status === 'passed').length,
                                  failed: dayRuns.filter(r => r.status === 'failed').length,
                                  total: dayRuns.length
                                };
                              });
                              
                              const maxRuns = Math.max(...dailyData.map(d => d.total), 1);
                              
                              return (
                                <div className="bar-chart-container">
                                  {dailyData.map((day, idx) => (
                                    <div key={idx} className="bar-group">
                                      <div className="bar-stack" style={{ height: '150px', justifyContent: 'flex-end' }}>
                                        {day.total > 0 && (
                                          <>
                                            <div 
                                              className="bar-segment" 
                                              style={{ 
                                                height: `${(day.passed/maxRuns)*150}px`,
                                                background: '#10b981',
                                                width: '40px',
                                                borderRadius: '4px 4px 0 0'
                                              }}
                                              title={`Passed: ${day.passed}`}
                                            />
                                            <div 
                                              className="bar-segment" 
                                              style={{ 
                                                height: `${(day.failed/maxRuns)*150}px`,
                                                background: '#ef4444',
                                                width: '40px'
                                              }}
                                              title={`Failed: ${day.failed}`}
                                            />
                                          </>
                                        )}
                                      </div>
                                      <div className="bar-label">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="bar-value">{day.total}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="empty-chart">No test runs in the last 7 days</div>
                        )}
                      </div>
                    </div>

                    {/* Top Scripts by Runs */}
                    <div className="analytics-card">
                      <h3>🏆 Most Executed Scripts</h3>
                      <div className="chart-container">
                        {scripts.length > 0 && testRuns.length > 0 ? (
                          <div className="list-chart">
                            {(() => {
                              const scriptRunCounts = scripts.map(script => ({
                                name: script.name,
                                count: testRuns.filter(r => r.script.name === script.name).length
                              })).filter(s => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
                              
                              const maxCount = Math.max(...scriptRunCounts.map(s => s.count), 1);
                              
                              return scriptRunCounts.map((script, idx) => (
                                <div key={idx} className="list-item">
                                  <div className="list-label">{script.name}</div>
                                  <div className="list-bar-container">
                                    <div 
                                      className="list-bar" 
                                      style={{ 
                                        width: `${(script.count/maxCount)*100}%`,
                                        background: '#667eea'
                                      }}
                                    />
                                  </div>
                                  <div className="list-value">{script.count} runs</div>
                                </div>
                              ));
                            })()}
                          </div>
                        ) : (
                          <div className="empty-chart">No script execution data</div>
                        )}
                      </div>
                    </div>

                    {/* Script Language Distribution */}
                    <div className="analytics-card">
                      <h3>💻 Language Distribution</h3>
                      <div className="chart-container">
                        {scripts.length > 0 ? (
                          <div className="list-chart">
                            {(() => {
                              const languageCounts = scripts.reduce((acc, script) => {
                                acc[script.language] = (acc[script.language] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              
                              const languageData = Object.entries(languageCounts)
                                .map(([lang, count]) => ({ language: lang, count }))
                                .sort((a, b) => b.count - a.count);
                              
                              const total = scripts.length;
                              const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                              
                              return languageData.map((item, idx) => (
                                <div key={idx} className="list-item">
                                  <div className="list-label">{item.language}</div>
                                  <div className="list-bar-container">
                                    <div 
                                      className="list-bar" 
                                      style={{ 
                                        width: `${(item.count/total)*100}%`,
                                        background: colors[idx % colors.length]
                                      }}
                                    />
                                  </div>
                                  <div className="list-value">{item.count} ({Math.round((item.count/total)*100)}%)</div>
                                </div>
                              ));
                            })()}
                          </div>
                        ) : (
                          <div className="empty-chart">No scripts available</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="analytics-card" style={{ marginTop: '24px' }}>
                    <h3>🕒 Recent Test Activity</h3>
                    <div className="recent-activity">
                      {testRuns.length > 0 ? (
                        <div className="activity-list">
                          {testRuns.slice(0, 10).map((run, idx) => (
                            <div key={idx} className="activity-item">
                              <span className={`status-badge ${run.status}`}>{run.status}</span>
                              <span className="activity-script">{run.script.name}</span>
                              <span className="activity-time">{new Date(run.startedAt).toLocaleString()}</span>
                              {run.duration && <span className="activity-duration">⏱️ {Math.round(run.duration/1000)}s</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state" style={{ padding: '40px' }}>
                          <p>No recent test activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Settings */}
          {activeView === 'settings' && (
            <div className="view-container">
              <h1 className="view-title">Settings</h1>
              <div className="empty-state">
                <div className="empty-icon">⚙️</div>
                <h3>System Settings</h3>
                <p>Configure system-wide settings, integrations, and defaults here.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Script Execution Modal */}
      {showExecuteModal && (
        <div className="modal-overlay" onClick={() => setShowExecuteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>🚀 Execute Script</h2>
              <button className="modal-close" onClick={() => setShowExecuteModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Choose a script to execute:
              </p>

              {/* Current Script Option */}
              {currentScriptForExecution && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                    📝 Current Script
                  </h3>
                  <div 
                    className="content-card" 
                    style={{ 
                      padding: '16px', 
                      cursor: 'pointer',
                      border: '2px solid #3b82f6',
                      background: '#eff6ff'
                    }}
                    onClick={() => {
                      handleExecuteScript(currentScriptForExecution.id, currentScriptForExecution.name);
                      setShowExecuteModal(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        ▶️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e40af' }}>
                          {currentScriptForExecution.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Execute the current working script
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Scripts */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                  🗄️ Scripts from Database ({scripts.length})
                </h3>
                {scripts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {scripts.map((script) => (
                      <div 
                        key={script.id}
                        className="content-card" 
                        style={{ 
                          padding: '12px 16px', 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: '1px solid #e5e7eb'
                        }}
                        onClick={() => {
                          handleExecuteScript(script.id, script.name);
                          setShowExecuteModal(false);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ fontSize: '20px' }}>📄</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
                              {script.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', gap: '12px' }}>
                              <span>📅 {new Date(script.createdAt).toLocaleDateString()}</span>
                              <span className="language-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {script.language}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '18px', color: '#10b981' }}>▶️</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                    <p style={{ color: '#9ca3af' }}>No scripts available in database</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowExecuteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
