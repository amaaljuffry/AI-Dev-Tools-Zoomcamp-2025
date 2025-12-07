import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  Play,
  Copy,
  Check,
  Users,
  Code2,
  Loader2,
  Terminal,
  X,
} from 'lucide-react'
import {
  Button,
  Flex,
  Text,
  Box,
  Select,
  Badge,
  IconButton,
  Separator,
  ScrollArea,
  Tooltip,
} from '@radix-ui/themes'

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
]

const DEFAULT_CODE = {
  javascript: `// JavaScript - Click "Run" to execute
console.log("Hello, World!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));
`,
  python: `# Python - Click "Run" to execute
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(10):", fibonacci(10))
`,
  typescript: `// TypeScript - Syntax highlighting only
interface User {
  name: string;
  age: number;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}!\`;
};

console.log(greet({ name: "Alice", age: 30 }));
`,
}

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(DEFAULT_CODE.javascript)
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const editorRef = useRef(null)
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const runnerIframeRef = useRef(null)

  // Initialize username
  useEffect(() => {
    const storedName = localStorage.getItem('username')
    if (storedName) {
      setUsername(storedName)
    } else {
      const randomName = `User${Math.floor(Math.random() * 1000)}`
      setUsername(randomName)
      localStorage.setItem('username', randomName)
    }
  }, [])

  // Setup Yjs for collaborative editing
  useEffect(() => {
    if (!roomId) return

    const ydoc = new Y.Doc()
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}?room=${roomId}`
    
    // For development, connect directly to server port
    const devWsUrl = `ws://localhost:3001?room=${roomId}`
    const provider = new WebsocketProvider(
      window.location.hostname === 'localhost' ? devWsUrl : wsUrl,
      roomId,
      ydoc
    )

    ydocRef.current = ydoc
    providerRef.current = provider

    provider.on('status', (event) => {
      setConnected(event.status === 'connected')
    })

    // Awareness for user presence
    const awareness = provider.awareness
    awareness.setLocalStateField('user', {
      name: username || 'Anonymous',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    })

    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values())
      setUsers(states.map((s) => s.user).filter(Boolean))
    })

    // Sync code with Yjs
    const ytext = ydoc.getText('code')
    
    ytext.observe(() => {
      const newCode = ytext.toString()
      if (newCode !== code) {
        setCode(newCode)
      }
    })

    // Initialize with default code if empty
    if (ytext.toString() === '') {
      ytext.insert(0, DEFAULT_CODE.javascript)
    } else {
      setCode(ytext.toString())
    }

    return () => {
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomId, username])

  // Handle code changes from editor
  const handleCodeChange = useCallback((value) => {
    setCode(value || '')
    
    if (ydocRef.current && providerRef.current?.wsconnected) {
      const ytext = ydocRef.current.getText('code')
      const currentYText = ytext.toString()
      
      if (value !== currentYText) {
        ydocRef.current.transact(() => {
          ytext.delete(0, ytext.length)
          ytext.insert(0, value || '')
        })
      }
    }
  }, [])

  // Copy room link
  const copyLink = () => {
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Create sandboxed iframe for JS execution
  const createRunnerIframe = () => {
    if (runnerIframeRef.current) {
      document.body.removeChild(runnerIframeRef.current)
    }

    const iframe = document.createElement('iframe')
    iframe.sandbox = 'allow-scripts'
    iframe.style.display = 'none'
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          const logs = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = (...args) => {
            logs.push({ type: 'log', content: args.map(String).join(' ') });
          };
          console.error = (...args) => {
            logs.push({ type: 'error', content: args.map(String).join(' ') });
          };
          console.warn = (...args) => {
            logs.push({ type: 'warn', content: args.map(String).join(' ') });
          };

          window.addEventListener('message', async (ev) => {
            const { id, code } = ev.data;
            logs.length = 0;
            
            try {
              const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
              const fn = new AsyncFunction(code);
              const result = await fn();
              
              if (result !== undefined) {
                logs.push({ type: 'result', content: String(result) });
              }
              
              parent.postMessage({ id, type: 'success', logs }, '*');
            } catch (err) {
              logs.push({ type: 'error', content: String(err) });
              parent.postMessage({ id, type: 'error', logs }, '*');
            }
          });
        </script>
      </body>
      </html>
    `
    document.body.appendChild(iframe)
    runnerIframeRef.current = iframe
    return iframe
  }

  // Run JavaScript code
  const runJavaScript = (codeToRun) => {
    return new Promise((resolve) => {
      const iframe = createRunnerIframe()
      const runId = Date.now().toString()

      const timeout = setTimeout(() => {
        resolve([{ type: 'error', content: 'Execution timed out (5s limit)' }])
        if (runnerIframeRef.current) {
          document.body.removeChild(runnerIframeRef.current)
          runnerIframeRef.current = null
        }
      }, 5000)

      const handler = (ev) => {
        if (ev.data?.id === runId) {
          clearTimeout(timeout)
          window.removeEventListener('message', handler)
          resolve(ev.data.logs || [])
        }
      }

      window.addEventListener('message', handler)

      // Wait for iframe to load
      setTimeout(() => {
        iframe.contentWindow?.postMessage({ id: runId, code: codeToRun }, '*')
      }, 100)
    })
  }

  // Run Python code with Pyodide
  const runPython = async (codeToRun) => {
    setPyodideLoading(true)
    
    try {
      // Load Pyodide if not already loaded
      if (!window.pyodide) {
        setOutput([{ type: 'log', content: 'Loading Python runtime (Pyodide)...' }])
        
        // Load Pyodide script
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        
        window.pyodide = await window.loadPyodide()
      }

      // Capture stdout
      window.pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)

      // Run user code
      await window.pyodide.runPythonAsync(codeToRun)

      // Get output
      const stdout = window.pyodide.runPython('sys.stdout.getvalue()')
      const stderr = window.pyodide.runPython('sys.stderr.getvalue()')

      const logs = []
      if (stdout) {
        stdout.split('\n').filter(Boolean).forEach((line) => {
          logs.push({ type: 'log', content: line })
        })
      }
      if (stderr) {
        stderr.split('\n').filter(Boolean).forEach((line) => {
          logs.push({ type: 'error', content: line })
        })
      }

      return logs.length > 0 ? logs : [{ type: 'log', content: '(No output)' }]
    } catch (err) {
      return [{ type: 'error', content: String(err) }]
    } finally {
      setPyodideLoading(false)
    }
  }

  // Run code
  const runCode = async () => {
    setIsRunning(true)
    setOutput([{ type: 'log', content: 'Running...' }])

    try {
      let result
      if (language === 'javascript') {
        result = await runJavaScript(code)
      } else if (language === 'python') {
        result = await runPython(code)
      } else {
        result = [{ type: 'warn', content: `Execution not supported for ${language}. Only JavaScript and Python can be run.` }]
      }
      setOutput(result)
    } catch (err) {
      setOutput([{ type: 'error', content: String(err) }])
    } finally {
      setIsRunning(false)
    }
  }

  // Change language
  const changeLanguage = (langId) => {
    setLanguage(langId)
    
    // Only set default code if current code is a default
    const isDefault = Object.values(DEFAULT_CODE).some((d) => d === code)
    if (isDefault) {
      handleCodeChange(DEFAULT_CODE[langId] || '')
    }
  }

  return (
    <Box className="h-screen" style={{ display: 'flex', flexDirection: 'column', background: '#000', color: '#fff' }}>
      {/* Header */}
      <Flex 
        align="center" 
        justify="between" 
        px="4" 
        py="3" 
        style={{ borderBottom: '1px solid #27272a' }}
      >
        <Flex align="center" gap="4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <Code2 className="w-5 h-5" />
            <Text weight="bold">CodeInterview</Text>
          </Button>
          
          <Separator orientation="vertical" size="2" />
          
          <Flex align="center" gap="2">
            <Box 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: connected ? '#22c55e' : '#ef4444' 
              }} 
            />
            <Text size="2" color="gray">
              {connected ? 'Connected' : 'Connecting...'}
            </Text>
          </Flex>
        </Flex>

        <Flex align="center" gap="3">
          {/* Users */}
          <Tooltip content="Connected users">
            <Badge color="gray" variant="soft">
              <Users className="w-3 h-3" />
              <Text size="1">{users.length || 1}</Text>
            </Badge>
          </Tooltip>

          {/* Share button */}
          <Tooltip content="Copy room link">
            <Button
              variant="outline"
              size="2"
              onClick={copyLink}
              style={{ cursor: 'pointer' }}
            >
              {copied ? <Check className="w-4 h-4" style={{ color: '#22c55e' }} /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>

      {/* Main Content */}
      <Flex style={{ flex: 1, overflow: 'hidden' }}>
        {/* Editor Panel */}
        <Flex direction="column" style={{ flex: 1, borderRight: '1px solid #27272a' }}>
          {/* Editor Toolbar */}
          <Flex 
            align="center" 
            justify="between" 
            px="4" 
            py="2" 
            style={{ borderBottom: '1px solid #27272a', background: '#0a0a0a' }}
          >
            {/* Language Selector */}
            <Select.Root value={language} onValueChange={changeLanguage}>
              <Select.Trigger style={{ minWidth: 140 }} />
              <Select.Content>
                {LANGUAGES.map((lang) => (
                  <Select.Item key={lang.id} value={lang.id}>
                    {lang.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>

            {/* Run Button */}
            <Button
              size="2"
              onClick={runCode}
              disabled={isRunning || pyodideLoading}
              style={{ 
                cursor: isRunning || pyodideLoading ? 'not-allowed' : 'pointer',
                background: '#22c55e',
                color: '#000'
              }}
            >
              {isRunning || pyodideLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run
            </Button>
          </Flex>

          {/* Monaco Editor */}
          <Box style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              onMount={(editor) => {
                editorRef.current = editor
              }}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16 },
              }}
            />
          </Box>
        </Flex>

        {/* Output Panel */}
        <Flex direction="column" style={{ width: 384, background: '#0a0a0a' }}>
          <Flex 
            align="center" 
            gap="2" 
            px="4" 
            py="2" 
            style={{ borderBottom: '1px solid #27272a' }}
          >
            <Terminal className="w-4 h-4" style={{ color: '#71717a' }} />
            <Text size="2" weight="medium">Output</Text>
            {output.length > 0 && (
              <Tooltip content="Clear output">
                <IconButton
                  size="1"
                  variant="ghost"
                  onClick={() => setOutput([])}
                  style={{ marginLeft: 'auto', cursor: 'pointer' }}
                >
                  <X className="w-4 h-4" />
                </IconButton>
              </Tooltip>
            )}
          </Flex>
          
          <ScrollArea style={{ flex: 1 }}>
            <Box p="4" style={{ fontFamily: 'monospace', fontSize: 13 }}>
              {output.length === 0 ? (
                <Text size="2" color="gray">
                  Click "Run" to execute your code
                </Text>
              ) : (
                output.map((line, i) => (
                  <Box
                    key={i}
                    py="1"
                    style={{
                      color:
                        line.type === 'error'
                          ? '#f87171'
                          : line.type === 'warn'
                          ? '#fbbf24'
                          : line.type === 'result'
                          ? '#4ade80'
                          : '#d4d4d8',
                    }}
                  >
                    {line.type === 'error' && <span style={{ color: '#ef4444' }}>✕ </span>}
                    {line.type === 'result' && <span style={{ color: '#22c55e' }}>→ </span>}
                    {line.content}
                  </Box>
                ))
              )}
            </Box>
          </ScrollArea>
        </Flex>
      </Flex>
    </Box>
  )
}
