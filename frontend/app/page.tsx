'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function Home() {
  const [typedText, setTypedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [matrixChars, setMatrixChars] = useState<string[]>([])
  const [particlePositions, setParticlePositions] = useState<Array<{left: number, top: number, delay: number, duration: number}>>([])
  const fullText = 'penetration_test.exe --target=web_app --mode=full'

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.substring(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  // Initialize Matrix characters on client side only
  useEffect(() => {
    const chars = Array.from({ length: 50 }, () => 
      String.fromCharCode(0x30a0 + Math.random() * 96)
    )
    setMatrixChars(chars)
  }, [])

  // Initialize particle positions on client side only
  useEffect(() => {
    const positions = Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }))
    setParticlePositions(positions)
  }, [])

  return (
    <main className="min-h-screen bg-black text-green-400 overflow-hidden relative">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        {/* Scanning line effect */}
        <div className="absolute inset-0 animate-scan-line">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
        </div>
      </div>

      {/* Matrix-style falling characters effect */}
      {matrixChars.length > 0 && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
          {matrixChars.map((char, i) => (
            <div
              key={i}
              className="absolute text-green-400 font-mono text-sm"
              style={{
                left: `${(i * 2) % 100}%`,
                animation: `fall ${3 + (i % 5)}s linear infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {char}
            </div>
          ))}
        </div>
      )}

      {/* Glitch overlay effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-sm border-b border-green-500/30 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold font-mono text-green-400">
                <span className="animate-pulse">[</span>PenGPT<span className="animate-pulse">]</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-green-400 border-green-500/30 hover:bg-green-500/10 hover:border-green-500">
                  &gt; login
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-green-500 text-black hover:bg-green-400 font-mono border border-green-400">
                  &gt; access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Terminal window */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-black border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/20">
              <div className="bg-green-900/30 border-b border-green-500/50 px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-4 text-green-400 text-sm font-mono">terminal.exe</span>
              </div>
              <div className="p-6 font-mono text-green-400">
                <div className="mb-2">
                  <span className="text-green-500">root@pentest:~$</span>{' '}
                  <span className="animate-pulse">_</span>
                </div>
                <div className="mb-2 animate-pulse">
                  <span className="text-cyan-400">[+]</span> Initializing PenGPT Security Scanner...
                  <span className="inline-block ml-2 animate-pulse">█</span>
                </div>
                <div className="mb-2">
                  <span className="text-cyan-400">[+]</span> Loading OWASP Top 10 modules...
                  <span className="text-green-400 ml-2">[████████░░] 80%</span>
                </div>
                <div className="mb-2">
                  <span className="text-cyan-400">[+]</span> AI Analysis Engine: <span className="text-green-400 animate-pulse">READY</span>
                </div>
                <div className="mb-2">
                  <span className="text-cyan-400">[+]</span> Scanner Modules: <span className="text-green-400">10/10 ACTIVE</span>
                </div>
                <div className="mt-4 border-t border-green-500/30 pt-4">
                  <span className="text-green-500">root@pentest:~$</span>{' '}
                  <span className="text-yellow-400">{typedText}</span>
                  {showCursor && <span className="text-green-400 animate-pulse ml-1">█</span>}
                </div>
                <div className="mt-2 text-xs text-green-500/70">
                  <span className="text-cyan-400">[INFO]</span> Press ENTER to execute scan...
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold font-mono mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 animate-pulse-glow relative">
              <span className="relative inline-block">
                &gt; PENETRATION_TEST
                <span className="absolute inset-0 text-green-400 opacity-30 animate-glitch blur-sm">
                  &gt; PENETRATION_TEST
                </span>
              </span>
            </h1>
            <div className="text-2xl md:text-3xl font-mono text-green-400 mb-4">
              <span className="text-cyan-400">[</span>
              <span className="animate-pulse text-green-300">ACTIVE</span>
              <span className="text-cyan-400">]</span>
              <span className="ml-4 text-green-500 animate-pulse">●</span>
            </div>
            <p className="text-xl text-green-300 mb-8 max-w-3xl mx-auto font-mono">
              &gt; Automated security scanning with AI-powered vulnerability analysis
              <br />
              <span className="text-green-500">[OWASP Top 10] [Real-Time] [AI Analysis]</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-6 text-lg font-mono bg-green-500 text-black hover:bg-green-400 border-2 border-green-400 shadow-lg shadow-green-500/50 hover:shadow-green-400/50 transition-all">
                  &gt; START_SCAN
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-mono border-2 border-green-500 text-green-400 hover:bg-green-500/10">
                  &gt; CREATE_ACCOUNT
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Hacker Aesthetic */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-mono text-green-400 mb-4">
              &gt; SCANNER_MODULES
            </h2>
            <p className="text-xl text-green-300 font-mono max-w-2xl mx-auto">
              [10] Active vulnerability detection modules
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'SQL_INJECTION', status: 'ACTIVE', color: 'text-red-400', bgColor: 'bg-red-500', progress: 95 },
              { name: 'XSS_SCANNER', status: 'ACTIVE', color: 'text-yellow-400', bgColor: 'bg-yellow-500', progress: 88 },
              { name: 'CSRF_DETECTOR', status: 'ACTIVE', color: 'text-orange-400', bgColor: 'bg-orange-500', progress: 82 },
              { name: 'AUTH_ANALYZER', status: 'ACTIVE', color: 'text-cyan-400', bgColor: 'bg-cyan-500', progress: 90 },
              { name: 'SSRF_TESTER', status: 'ACTIVE', color: 'text-purple-400', bgColor: 'bg-purple-500', progress: 85 },
              { name: 'HEADER_CHECK', status: 'ACTIVE', color: 'text-green-400', bgColor: 'bg-green-500', progress: 92 },
            ].map((module, idx) => (
              <div
                key={idx}
                className="bg-black border-2 border-green-500/50 rounded-lg p-6 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all font-mono group relative overflow-hidden"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 text-lg">&gt; {module.name}</span>
                    <span className={`${module.color} animate-pulse`}>[●]</span>
                  </div>
                  <div className="text-green-300 text-sm mb-2">
                    Status: <span className="text-green-400 animate-pulse">{module.status}</span>
                  </div>
                  <div className="text-cyan-400 text-xs mb-3">
                    <span className="text-green-500">[+]</span> OWASP Top 10 Module
                  </div>
                  <div className="mt-4 h-2 bg-green-900/50 rounded overflow-hidden relative">
                    <div
                      className={`h-full bg-gradient-to-r from-green-500 ${module.bgColor} rounded animate-pulse relative`}
                      style={{ width: `${module.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                    <div className="absolute right-2 top-0 bottom-0 flex items-center text-xs text-green-400">
                      {module.progress}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-950/20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'VULNERABILITIES', value: '10K+', color: 'text-red-400', icon: '🔴' },
              { label: 'SCANS_RUN', value: '50K+', color: 'text-green-400', icon: '🟢' },
              { label: 'OWASP_MODULES', value: '10', color: 'text-cyan-400', icon: '🔵' },
              { label: 'AI_ANALYSIS', value: '100%', color: 'text-yellow-400', icon: '🟡' },
            ].map((stat, idx) => (
              <div key={idx} className="font-mono border-2 border-green-500/30 p-6 bg-black/50 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                <div className={`text-4xl font-bold ${stat.color} mb-2 animate-pulse group-hover:animate-none`}>
                  {stat.value}
                </div>
                <div className="text-green-400 text-sm">{stat.label}</div>
                <div className="mt-2 text-xs text-green-500/70">
                  <span className="text-cyan-400">[+]</span> ACTIVE
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Hacker Style */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-mono text-green-400 mb-4">
              &gt; EXECUTION_FLOW
            </h2>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {[
              { step: '01', cmd: 'add_project.exe', desc: 'Initialize target URL', icon: '⚡' },
              { step: '02', cmd: 'scan_start.exe --mode=full', desc: 'Execute vulnerability scan', icon: '🔍' },
              { step: '03', cmd: 'ai_analyze.exe', desc: 'Generate security report', icon: '🤖' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-black border-l-4 border-green-500 p-6 font-mono hover:border-green-400 transition-all group relative overflow-hidden"
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                {/* Animated line effect */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-green-500 text-2xl font-bold animate-pulse">[{item.step}]</div>
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-green-400 text-lg mb-2 group-hover:text-green-300 transition-colors">
                      &gt; {item.cmd}
                    </div>
                    <div className="text-green-300 text-sm">
                      <span className="text-cyan-400 animate-pulse">[+]</span> {item.desc}
                    </div>
                  </div>
                  <div className="text-green-500 animate-pulse group-hover:text-green-400 group-hover:scale-125 transition-transform">
                    [●]
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center border-2 border-green-500 p-12 bg-black/50 backdrop-blur-sm">
          <h2 className="text-4xl font-bold font-mono text-green-400 mb-4 animate-pulse">
            &gt; READY_TO_SCAN?
          </h2>
          <p className="text-xl text-green-300 mb-8 font-mono">
            <span className="text-cyan-400">[+]</span> Initialize security scan protocol
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-6 text-lg font-mono bg-green-500 text-black hover:bg-green-400 border-2 border-green-400 shadow-lg shadow-green-500/50">
                &gt; EXECUTE_SCAN
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-mono border-2 border-green-500 text-green-400 hover:bg-green-500/10"
              >
                &gt; NEW_USER
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-green-500/30 text-green-400 py-12 px-4 sm:px-6 lg:px-8 font-mono">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-4">
            <span className="text-green-500">[PenGPT]</span> Security Scanner v1.0
          </div>
          <div className="text-sm text-green-500/70">
            &gt; Automated Penetration Testing Platform
            <br />
            <span className="text-cyan-400">[+]</span> Powered by AI Analysis
          </div>
          <div className="mt-8 text-xs text-green-500/50">
            © 2024 PenGPT | All systems operational
          </div>
        </div>
      </footer>

      {/* Animated particles */}
      {particlePositions.length > 0 && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {particlePositions.map((pos, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full animate-pulse"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animationDelay: `${pos.delay}s`,
                animationDuration: `${pos.duration}s`,
              }}
            ></div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fall {
          from {
            transform: translateY(-100vh);
            opacity: 1;
          }
          to {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
