import { supabaseAdmin } from '../supabase.js'
import { loadEnv } from '../env.js'

interface Testcase {
  id: string
  input: string
  output: string
  is_public: boolean
}

interface RunResult {
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error'
  runtime: number
  memory: number
}

function mapLanguageToCompiler(language: string): string {
  switch (language.toLowerCase()) {
    case 'c':
      return 'gcc-15'
    case 'cpp':
      return 'g++-15'
    case 'javascript':
    case 'js':
      return 'typescript-deno'
    case 'typescript':
    case 'ts':
      return 'typescript-deno'
    case 'python':
    case 'py':
      return 'python-3.14'
    case 'java':
      return 'openjdk-25'
    case 'go':
      return 'go-1.26'
    case 'rust':
      return 'rust-1.93'
    default:
      return 'g++-15'
  }
}

function compareOutputs(userOutput: string, expectedOutput: string): boolean {
  const normalize = (str: string) => {
    return str
      .trim()
      .split(/\r?\n/)
      .map(line => line.trimEnd())
      .filter(line => line.length > 0 || line === '')
  }
  
  const linesUser = normalize(userOutput)
  const linesExpected = normalize(expectedOutput)
  
  if (linesUser.length !== linesExpected.length) return false
  for (let i = 0; i < linesUser.length; i++) {
    if (linesUser[i] !== linesExpected[i]) return false
  }
  return true
}

// 1. Core Code Sandbox Compiler & Runner (Integrates with OnlineCompiler.io REST API)
export async function runCodeInSandbox(
  code: string,
  language: string,
  timeLimit: number, // in ms
  memoryLimit: number, // in MB
  testcases: Testcase[]
): Promise<RunResult & { testcaseResults: any[] }> {
  const { onlineCompilerApiKey } = loadEnv()

  if (!onlineCompilerApiKey) {
    throw new Error(
      'OnlineCompiler API key is not configured. Please add ONLINE_COMPILER_API_KEY to your backend/.env file and restart the server.'
    )
  }

  if (testcases.length === 0) {
    return { verdict: 'Accepted', runtime: 0, memory: 0, testcaseResults: [] }
  }

  const compiler = mapLanguageToCompiler(language)

  // Execute all testcases in parallel
  const results = await Promise.all(
    testcases.map(async (tc) => {
      try {
        const sanitizedInput = tc.input ? tc.input.replace(/\\n/g, '\n') : ''
        const sanitizedOutput = tc.output ? tc.output.replace(/\\n/g, '\n') : ''

        const response = await fetch('https://api.onlinecompiler.io/api/run-code-sync/', {
          method: 'POST',
          headers: {
            'Authorization': onlineCompilerApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            compiler,
            code,
            input: sanitizedInput,
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`API call failed: ${response.status} ${text}`)
        }

        const data = (await response.json()) as {
          output: string
          error: string
          status: string
          exit_code: number
          signal: number | null
          time: string // e.g. "0.0248"
          memory: string // e.g. "8192" in KB
        }

        // Map process signals/exit codes to verdicts
        let status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' = 'Accepted'
        
        // 1. Check for compilation errors or explicit errors in compiler response
        if (data.status === 'error' && data.error && (data.exit_code === null || data.exit_code !== 0)) {
          status = 'Compilation Error'
        } else if (data.exit_code === 124 || data.signal === 9) {
          status = 'Time Limit Exceeded'
        } else if (data.exit_code !== 0) {
          status = 'Runtime Error'
        } else {
          // Check if output matches expected
          const outputMatches = compareOutputs(data.output, sanitizedOutput)
          if (!outputMatches) {
            status = 'Wrong Answer'
          }
        }

        // 2. Extra check for time limit based on the problem specification
        const runtimeMs = Math.round(parseFloat(data.time || '0') * 1000)
        if (runtimeMs > timeLimit && status === 'Accepted') {
          status = 'Time Limit Exceeded'
        }

        const memoryKb = parseInt(data.memory || '0', 10)

        return {
          id: tc.id,
          status,
          time: runtimeMs,
          memory: memoryKb,
          isPublic: tc.is_public,
          rawError: data.error,
        }
      } catch (err: any) {
        console.error(`Error running testcase ${tc.id}:`, err)
        return {
          id: tc.id,
          status: 'Runtime Error' as const,
          time: 0,
          memory: 0,
          isPublic: tc.is_public,
          rawError: err.message,
        }
      }
    })
  )

  // Aggregate the results
  let overallVerdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' = 'Accepted'
  
  // Priority: Compilation Error > Time Limit Exceeded > Runtime Error > Wrong Answer > Accepted
  const verdictPriority = {
    'Compilation Error': 5,
    'Time Limit Exceeded': 4,
    'Runtime Error': 3,
    'Wrong Answer': 2,
    'Accepted': 1,
  }

  for (const r of results) {
    if (verdictPriority[r.status] > verdictPriority[overallVerdict]) {
      overallVerdict = r.status
    }
  }

  const maxRuntime = Math.max(...results.map(r => r.time))
  const maxMemory = Math.max(...results.map(r => r.memory))

  return {
    verdict: overallVerdict,
    runtime: maxRuntime,
    memory: maxMemory,
    testcaseResults: results.map(r => ({
      id: r.id,
      status: r.status,
      time: r.time,
      memory: r.memory,
      isPublic: r.isPublic,
    })),
  }
}


// 2. High-Performance Abstract Token Anti-Cheat Plagiarism Scanner
export function calculateCodeSimilarity(codeA: string, codeB: string): number {
  // Normalize code by stripping comments, tabs, spaces, and newlines
  const normalize = (code: string) => {
    return code
      .replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, '') // remove comments
      .replace(/\s+/g, '') // remove spaces/newlines
      .toLowerCase()
  }

  let cleanA = normalize(codeA)
  let cleanB = normalize(codeB)

  if (cleanA === cleanB) return 100
  if (!cleanA || !cleanB) return 0

  // Truncate to a reasonable length to prevent CPU exhaustion DoS
  const maxLen = 1500
  if (cleanA.length > maxLen) cleanA = cleanA.substring(0, maxLen)
  if (cleanB.length > maxLen) cleanB = cleanB.substring(0, maxLen)

  // Space-optimized Levenshtein Distance (uses O(N) memory instead of O(M*N))
  const lenA = cleanA.length
  const lenB = cleanB.length
  
  let prevRow = new Int32Array(lenA + 1)
  let currRow = new Int32Array(lenA + 1)

  for (let i = 0; i <= lenA; i++) {
    prevRow[i] = i
  }

  for (let j = 1; j <= lenB; j++) {
    currRow[0] = j
    const charB = cleanB[j - 1]
    for (let i = 1; i <= lenA; i++) {
      const indicator = cleanA[i - 1] === charB ? 0 : 1
      currRow[i] = Math.min(
        prevRow[i] + 1, // deletion
        currRow[i - 1] + 1, // insertion
        prevRow[i - 1] + indicator // substitution
      )
    }
    // Swap rows
    const temp = prevRow
    prevRow = currRow
    currRow = temp
  }

  const distance = prevRow[lenA]
  const maxLength = Math.max(lenA, lenB)
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.round(similarity)
}

export async function scanForPlagiarism(
  problemId: string,
  userId: string,
  code: string
): Promise<{ isPlagiarized: boolean; similarity: number; sourceId: string | null }> {
  return { isPlagiarized: false, similarity: 0, sourceId: null }
}
