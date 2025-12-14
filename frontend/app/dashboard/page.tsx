'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Skip authentication in development (for testing)
      if (process.env.NODE_ENV === 'development') {
        // Allow access without authentication
        return
      }
      
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router])

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await projectsApi.getAll()
        return response.data
      } catch (err: any) {
        // In development, return empty array if API fails (auth might not be set up)
        if (process.env.NODE_ENV === 'development') {
          console.warn('API call failed, returning empty array for development:', err)
          return []
        }
        throw err
      }
    },
    retry: false,
  })

  const handleLogout = async () => {
    if (process.env.NODE_ENV === 'development') {
      router.push('/')
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">PenGPT</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <Link href="/dashboard/projects/new">
            <Button>New Project</Button>
          </Link>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Development Mode</p>
            <p className="text-sm">Authentication is skipped. API calls may fail without proper authentication setup.</p>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{project.url}</p>
                <p className="text-gray-500 text-xs">
                  {project.description || 'No description'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link href="/dashboard/projects/new">
              <Button>Create Your First Project</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

