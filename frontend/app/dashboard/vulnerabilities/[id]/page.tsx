'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vulnerabilitiesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export default function VulnerabilityDetailPage() {
  const params = useParams()
  const vulnerabilityId = params.id as string
  const queryClient = useQueryClient()
  const [isPrinting, setIsPrinting] = useState(false)

  const { data: vulnerability, isLoading } = useQuery({
    queryKey: ['vulnerability', vulnerabilityId],
    queryFn: async () => {
      const response = await vulnerabilitiesApi.getById(vulnerabilityId)
      return response.data
    },
  })

  const updateVulnerability = useMutation({
    mutationFn: async (data: any) => {
      const response = await vulnerabilitiesApi.update(vulnerabilityId, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerability', vulnerabilityId] })
      alert('Vulnerability updated successfully!')
    },
  })

  const handleStatusChange = (status: string) => {
    updateVulnerability.mutate({ status })
  }

  const handlePrint = () => {
    setIsPrinting(true)
    window.print()
    setTimeout(() => setIsPrinting(false), 1000)
  }

  const handleExportPDF = () => {
    // This would trigger a PDF generation API call
    alert('PDF export feature coming soon!')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-600 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return 'text-red-600'
    if (score >= 7.0) return 'text-orange-600'
    if (score >= 4.0) return 'text-yellow-600'
    return 'text-blue-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading vulnerability report...</div>
        </div>
      </div>
    )
  }

  if (!vulnerability) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Vulnerability not found</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const reportDate = new Date(vulnerability.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/projects/${vulnerability.project_id}`}>
                <Button variant="outline" size="sm">← Back to Project</Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Vulnerability Report</h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={vulnerability.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="confirmed">Confirmed</option>
                <option value="false_positive">False Positive</option>
                <option value="fixed">Fixed</option>
                <option value="risk_accepted">Risk Accepted</option>
              </select>
              <Button onClick={handlePrint} variant="outline" size="sm">
                🖨️ Print Report
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                📄 Export PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6 print:shadow-none">
          <div className={`${getSeverityColor(vulnerability.severity)} px-8 py-6`}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{vulnerability.title}</h1>
                <p className="text-lg opacity-90">{vulnerability.category}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-2 rounded-lg border-2 font-bold text-lg ${getSeverityBadge(vulnerability.severity)}`}>
                  {vulnerability.severity.toUpperCase()}
                </div>
                {vulnerability.cvss_score && (
                  <div className="mt-3">
                    <div className="text-sm opacity-90">CVSS Score</div>
                    <div className={`text-2xl font-bold ${getCVSSColor(vulnerability.cvss_score)}`}>
                      {vulnerability.cvss_score}/10.0
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Report Metadata */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Report Date</div>
                <div className="text-gray-900 font-semibold">{reportDate}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                <div className="text-gray-900 font-semibold capitalize">{vulnerability.status.replace('_', ' ')}</div>
              </div>
              {vulnerability.cwe_id && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">CWE ID</div>
                  <div className="text-gray-900 font-semibold">{vulnerability.cwe_id}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-6 print:shadow-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
            Executive Summary
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">{vulnerability.description}</p>
            
            {vulnerability.affected_url && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Affected Resource</h3>
                    <p className="mt-1 text-sm text-blue-700 break-all">{vulnerability.affected_url}</p>
                    {vulnerability.affected_parameter && (
                      <p className="mt-1 text-sm text-blue-700">
                        <span className="font-medium">Parameter:</span> {vulnerability.affected_parameter}
                      </p>
                    )}
                    {vulnerability.http_method && (
                      <p className="mt-1 text-sm text-blue-700">
                        <span className="font-medium">Method:</span> {vulnerability.http_method}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        {vulnerability.ai_analysis && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-lg rounded-lg p-8 mb-6 print:shadow-none">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">AI-Powered Analysis</h2>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{vulnerability.ai_analysis}</p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-6 print:shadow-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            Technical Details
          </h2>
          
          <div className="space-y-6">
            {/* Proof of Concept */}
            {vulnerability.proof_of_concept && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-red-100 text-red-600 rounded-full p-1 mr-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Proof of Concept
                </h3>
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{vulnerability.proof_of_concept}</pre>
                </div>
              </div>
            )}

            {/* Request Payload */}
            {vulnerability.request_payload && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </span>
                  Request Payload
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                    {vulnerability.request_payload}
                  </pre>
                </div>
              </div>
            )}

            {/* Response Payload */}
            {vulnerability.response_payload && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-600 rounded-full p-1 mr-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Response Payload
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                    {vulnerability.response_payload}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-6 print:shadow-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-green-500">
            Recommendations
          </h2>
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                {vulnerability.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-6 print:shadow-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            Risk Assessment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Severity Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Severity Level</span>
                  <span className={`px-3 py-1 rounded font-semibold ${getSeverityBadge(vulnerability.severity)}`}>
                    {vulnerability.severity.toUpperCase()}
                  </span>
                </div>
                {vulnerability.cvss_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">CVSS Score</span>
                    <span className={`text-lg font-bold ${getCVSSColor(vulnerability.cvss_score)}`}>
                      {vulnerability.cvss_score}/10.0
                    </span>
                  </div>
                )}
                {vulnerability.cwe_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">CWE ID</span>
                    <span className="text-gray-900 font-semibold">{vulnerability.cwe_id}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact</h3>
              <div className="space-y-2 text-gray-700">
                {vulnerability.severity === 'critical' && (
                  <>
                    <p>• Immediate action required</p>
                    <p>• Potential for complete system compromise</p>
                    <p>• Data breach risk</p>
                    <p>• Service disruption possible</p>
                  </>
                )}
                {vulnerability.severity === 'high' && (
                  <>
                    <p>• Significant security risk</p>
                    <p>• Potential for unauthorized access</p>
                    <p>• Data exposure possible</p>
                    <p>• Should be addressed promptly</p>
                  </>
                )}
                {vulnerability.severity === 'medium' && (
                  <>
                    <p>• Moderate security concern</p>
                    <p>• Limited exploitation potential</p>
                    <p>• Should be addressed in next update</p>
                  </>
                )}
                {vulnerability.severity === 'low' && (
                  <>
                    <p>• Minor security issue</p>
                    <p>• Low exploitation risk</p>
                    <p>• Can be addressed in regular maintenance</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {vulnerability.tags && vulnerability.tags.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {vulnerability.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print:mt-4">
          <p>Generated by PenGPT Security Scanner</p>
          <p className="mt-1">Report ID: {vulnerability.id}</p>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          nav {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:mt-4 {
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
