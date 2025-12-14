'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, scansApi, vulnerabilitiesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const [scanType, setScanType] = useState<'full' | 'quick' | 'custom'>('full')
  const [selectedVulns, setSelectedVulns] = useState<Set<string>>(new Set())
  const [showChecklist, setShowChecklist] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [selectedScanners, setSelectedScanners] = useState<Set<string>>(new Set([
    'sqlInjection', 'xss', 'csrf', 'securityHeaders', 'sensitiveData',
    'authentication', 'authorization', 'ssrf', 'insecureDesign', 'logging'
  ]))

  const availableScanners = [
    { id: 'sqlInjection', name: 'SQL Injection', description: 'Detects SQL injection vulnerabilities' },
    { id: 'xss', name: 'Cross-Site Scripting (XSS)', description: 'Detects XSS vulnerabilities' },
    { id: 'csrf', name: 'CSRF Protection', description: 'Checks for CSRF protection' },
    { id: 'securityHeaders', name: 'Security Headers', description: 'Checks security headers configuration' },
    { id: 'sensitiveData', name: 'Sensitive Data Exposure', description: 'Detects sensitive data exposure' },
    { id: 'authentication', name: 'Authentication', description: 'Analyzes authentication mechanisms' },
    { id: 'authorization', name: 'Authorization', description: 'Checks authorization and access control' },
    { id: 'ssrf', name: 'SSRF', description: 'Detects Server-Side Request Forgery' },
    { id: 'insecureDesign', name: 'Insecure Design', description: 'Analyzes design security patterns' },
    { id: 'logging', name: 'Logging & Monitoring', description: 'Checks security logging' },
  ]

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getById(projectId)
      return response.data
    },
  })

  // Fetch scans for this project
  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ['scans', projectId],
    queryFn: async () => {
      const response = await scansApi.getAll({ project_id: projectId })
      return response.data || []
    },
    refetchInterval: (query) => {
      // Poll every 2 seconds if there's a running scan
      const data = query.state.data as any[]
      const hasRunningScan = data?.some((scan: any) => scan.status === 'running' || scan.status === 'pending')
      return hasRunningScan ? 2000 : false
    },
  })

  // Fetch vulnerabilities for this project
  const { data: vulnerabilities, isLoading: vulnsLoading } = useQuery({
    queryKey: ['vulnerabilities', projectId],
    queryFn: async () => {
      const response = await vulnerabilitiesApi.getByProject(projectId)
      return response.data || []
    },
    refetchInterval: (query) => {
      // Poll every 2 seconds if there's a running scan
      const scans = query.state.data as any[]
      const hasRunningScan = scans?.some((scan: any) => scan.status === 'running' || scan.status === 'pending')
      return hasRunningScan ? 2000 : false
    },
  })

  // Create scan mutation
  const createScan = useMutation({
    mutationFn: async (data: { type: string; config?: any }) => {
      const response = await scansApi.create({
        project_id: projectId,
        scan_type: data.type,
        scan_config: data.config || {},
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', projectId] })
      setShowScannerModal(false)
      alert('Scan started successfully!')
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to start scan')
    },
  })

  // Cancel scan mutation
  const cancelScan = useMutation({
    mutationFn: async (scanId: string) => {
      const response = await scansApi.cancel(scanId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', projectId] })
      alert('Scan cancelled successfully!')
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to cancel scan')
    },
  })

  const handleStartScan = () => {
    if (scanType === 'custom') {
      if (selectedScanners.size === 0) {
        alert('Please select at least one scanner')
        return
      }
      setShowScannerModal(true)
    } else {
      if (!confirm(`Start a ${scanType} scan for ${project?.name}?`)) {
        return
      }
      createScan.mutate({ type: scanType })
    }
  }

  const handleConfirmScan = () => {
    if (selectedScanners.size === 0) {
      alert('Please select at least one scanner')
      return
    }
    if (!confirm(`Start a custom scan with ${selectedScanners.size} scanner(s) for ${project?.name}?`)) {
      return
    }
    createScan.mutate({
      type: 'custom',
      config: {
        scanners: Array.from(selectedScanners),
      },
    })
  }

  const toggleScanner = (scannerId: string) => {
    setSelectedScanners((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(scannerId)) {
        newSet.delete(scannerId)
      } else {
        newSet.add(scannerId)
      }
      return newSet
    })
  }

  const selectAllScanners = () => {
    if (selectedScanners.size === availableScanners.length) {
      setSelectedScanners(new Set())
    } else {
      setSelectedScanners(new Set(availableScanners.map(s => s.id)))
    }
  }

  const toggleVulnSelection = (vulnId: string) => {
    setSelectedVulns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(vulnId)) {
        newSet.delete(vulnId)
      } else {
        newSet.add(vulnId)
      }
      return newSet
    })
  }

  const selectAllVulns = () => {
    if (vulnerabilities && vulnerabilities.length > 0) {
      if (selectedVulns.size === vulnerabilities.length) {
        setSelectedVulns(new Set())
      } else {
        setSelectedVulns(new Set(vulnerabilities.map((v: any) => v.id)))
      }
    }
  }

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ status, count }: { status: string; count: number }) => {
      const updates = Array.from(selectedVulns).map((id) =>
        vulnerabilitiesApi.update(id, { status })
      )
      await Promise.all(updates)
      return count
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities', projectId] })
      const selectedCount = selectedVulns.size
      setSelectedVulns(new Set())
      alert(`Updated ${selectedCount} vulnerability/vulnerabilities status`)
    },
  })

  const handleBulkStatusChange = (status: string) => {
    if (selectedVulns.size === 0) {
      alert('Please select at least one vulnerability')
      return
    }
    if (confirm(`Update ${selectedVulns.size} selected vulnerability/vulnerabilities to "${status}"?`)) {
      bulkUpdateStatus.mutate({ status, count: selectedVulns.size })
    }
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>
          <p className="text-gray-500 mb-4">Project not found</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const latestScan = scans && scans.length > 0 ? scans[0] : null
  const criticalVulns = vulnerabilities?.filter((v: any) => v.severity === 'critical') || []
  const highVulns = vulnerabilities?.filter((v: any) => v.severity === 'high') || []
  const mediumVulns = vulnerabilities?.filter((v: any) => v.severity === 'medium') || []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline">← Back</Button>
              </Link>
              <h1 className="text-xl font-bold text-primary-600">PenGPT</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h2>
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">URL:</span> {project.url}
              </p>
              {project.description && (
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">Description:</span> {project.description}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Status: <span className="capitalize">{project.status}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="quick">Quick Scan</option>
                <option value="full">Full Scan</option>
                <option value="custom">Custom Scan</option>
              </select>
              <Button
                onClick={handleStartScan}
                disabled={createScan.isPending}
              >
                {createScan.isPending ? 'Starting...' : 'Start Scan'}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Scans</h3>
            <p className="text-3xl font-bold text-gray-900">{scans?.length || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Critical</h3>
            <p className="text-3xl font-bold text-red-600">{criticalVulns.length}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">High</h3>
            <p className="text-3xl font-bold text-orange-600">{highVulns.length}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Medium</h3>
            <p className="text-3xl font-bold text-yellow-600">{mediumVulns.length}</p>
          </div>
          <div className={`bg-white shadow rounded-lg p-6 border-2 ${selectedVulns.size > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Selected</h3>
            <p className="text-3xl font-bold text-blue-600">{selectedVulns.size}</p>
            {vulnerabilities && vulnerabilities.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                of {vulnerabilities.length} total
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Scans */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Scans</h3>
            {scansLoading ? (
              <div className="text-center py-8 text-gray-500">Loading scans...</div>
            ) : scans && scans.length > 0 ? (
              <div className="space-y-4">
                {scans.slice(0, 5).map((scan: any) => (
                  <div
                    key={scan.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {scan.scan_type.charAt(0).toUpperCase() + scan.scan_type.slice(1)} Scan
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(scan.created_at).toLocaleString()}
                        </p>
                        {(scan.status === 'running' || scan.status === 'pending') && scan.error_message && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <p className="text-xs text-blue-600 font-medium">In Progress</p>
                            </div>
                            <p className="text-xs text-gray-600 italic">{scan.error_message}</p>
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          scan.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : scan.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : scan.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : scan.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {scan.status}
                      </span>
                    </div>
                    {scan.status === 'completed' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          Vulnerabilities: {scan.total_vulnerabilities || 0} (
                          <span className="text-red-600">{scan.critical_count || 0} critical</span>,{' '}
                          <span className="text-orange-600">{scan.high_count || 0} high</span>)
                        </p>
                      </div>
                    )}
                    {scan.status === 'failed' && scan.error_message && (
                      <div className="mt-2 text-sm text-red-600">
                        <p className="font-semibold">Error:</p>
                        <p className="text-xs">{scan.error_message}</p>
                      </div>
                    )}
                    {(scan.status === 'running' || scan.status === 'pending') && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this scan?')) {
                              cancelScan.mutate(scan.id)
                            }
                          }}
                          disabled={cancelScan.isPending}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {cancelScan.isPending ? 'Cancelling...' : '⏹ Stop Scan'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No scans yet</p>
                <Button onClick={handleStartScan} className="mt-4" size="sm">
                  Start First Scan
                </Button>
              </div>
            )}
          </div>

          {/* Recent Vulnerabilities */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900">Vulnerabilities</h3>
                {vulnerabilities && vulnerabilities.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {vulnerabilities.length} total
                  </span>
                )}
                {selectedVulns.size > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {selectedVulns.size} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {vulnerabilities && vulnerabilities.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChecklist(!showChecklist)}
                    >
                      {showChecklist ? '✕ Hide Checklist' : '✓ Show Checklist'}
                    </Button>
                    {showChecklist && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllVulns}
                      >
                        {selectedVulns.size === vulnerabilities.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Checklist Actions Bar */}
            {showChecklist && selectedVulns.size > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedVulns.size} vulnerability/vulnerabilities selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => handleBulkStatusChange(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="" disabled>Bulk Actions</option>
                      <option value="open">Mark as Open</option>
                      <option value="confirmed">Mark as Confirmed</option>
                      <option value="false_positive">Mark as False Positive</option>
                      <option value="fixed">Mark as Fixed</option>
                      <option value="risk_accepted">Mark as Risk Accepted</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVulns(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {vulnsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading vulnerabilities...</div>
            ) : vulnerabilities && vulnerabilities.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {vulnerabilities.map((vuln: any) => (
                  <div
                    key={vuln.id}
                    className={`border rounded-lg p-4 transition-all ${
                      showChecklist && selectedVulns.has(vuln.id)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {showChecklist && (
                        <input
                          type="checkbox"
                          checked={selectedVulns.has(vuln.id)}
                          onChange={() => toggleVulnSelection(vuln.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      <Link
                        href={`/dashboard/vulnerabilities/${vuln.id}`}
                        className="flex-1 block"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{vuln.title}</p>
                            <p className="text-sm text-gray-500 mt-1">{vuln.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                vuln.severity === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : vuln.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : vuln.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {vuln.severity}
                            </span>
                            {vuln.status && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                {vuln.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{vuln.description}</p>
                        {vuln.affected_url && (
                          <p className="text-xs text-gray-500 mt-2 truncate">{vuln.affected_url}</p>
                        )}
                        {!vuln.ai_analysis && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-blue-600">AI analysis in progress...</span>
                          </div>
                        )}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No vulnerabilities found yet</p>
                <p className="text-sm mt-2">Run a scan to detect vulnerabilities</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Scanner Selection Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Select Scanners</h2>
                <button
                  onClick={() => setShowScannerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Select which vulnerability scanners to run. {selectedScanners.size} selected.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllScanners}
                >
                  {selectedScanners.size === availableScanners.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                {availableScanners.map((scanner) => (
                  <div
                    key={scanner.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedScanners.has(scanner.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleScanner(scanner.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedScanners.has(scanner.id)}
                        onChange={() => toggleScanner(scanner.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{scanner.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{scanner.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowScannerModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmScan}
                  disabled={selectedScanners.size === 0 || createScan.isPending}
                >
                  {createScan.isPending ? 'Starting...' : `Start Scan (${selectedScanners.size} scanners)`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

