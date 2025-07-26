/**
 * Quick Performance Test for markdown-it-hr-sandwiched-semantic-container
 * 
 * This is a lightweight test for rapid performance checks during development.
 * It provides basic comparisons between different plugin configurations.
 */

import MarkdownIt from 'markdown-it'
import mditSemanticContainer from '../../index.js'
import { performance } from 'perf_hooks'

function quickBenchmark(fn, iterations = 50) {
  // Warm-up
  for (let i = 0; i < 3; i++) {
    fn()
  }
  
  // Measure
  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }
  
  times.sort((a, b) => a - b)
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    median: times[Math.floor(times.length / 2)]
  }
}

function runQuickTest() {
  console.log('Quick Performance Test')
  console.log('='.repeat(50))
  
  const testContent = `# Performance Test Document

This is a test document for performance measurement.

Warning. This is a semantic container warning.

Information. This is an information container.

> [!NOTE]
> This is a GitHub-style note alert.

> [!WARNING]
> This is a GitHub-style warning alert.

[Bracket format]. This uses bracket format.

Note. Multiple semantic containers.
Error. Different types of containers.

Regular paragraph without any special formatting.

## More Content

Additional content to make the test more realistic.

Caution. Another semantic container.

> [!TIP]
> GitHub-style tip alert.

[Information]. More bracket format usage.

Final paragraph with regular text.`

  console.log(`Content size: ${testContent.length} characters\n`)
  
  // Test configurations
  const tests = [
    { name: 'Baseline (no plugin)', md: new MarkdownIt() },
    { name: 'Default semantic containers', md: new MarkdownIt().use(mditSemanticContainer) },
    { name: 'With bracket format', md: new MarkdownIt().use(mditSemanticContainer, { allowBracketJoint: true }) },
    { name: 'With GitHub alerts', md: new MarkdownIt().use(mditSemanticContainer, { githubTypeContainer: true }) },
    { name: 'All features enabled', md: new MarkdownIt().use(mditSemanticContainer, { allowBracketJoint: true, githubTypeContainer: true }) }
  ]
  
  const results = tests.map(test => {
    const result = quickBenchmark(() => test.md.render(testContent))
    console.log(`${test.name.padEnd(30)}: ${result.avg.toFixed(3)}ms avg, ${result.median.toFixed(3)}ms median`)
    return { name: test.name, ...result }
  })
  
  console.log('\n--- Relative Performance ---')
  const baseline = results[0].avg
  results.forEach((result, index) => {
    if (index === 0) return
    const overhead = ((result.avg - baseline) / baseline * 100)
    console.log(`${result.name.padEnd(30)}: ${overhead > 0 ? '+' : ''}${overhead.toFixed(1)}% overhead`)
  })
  
  // Simple scalability check
  console.log('\n--- Scalability Check ---')
  const largeContent = testContent.repeat(10)
  console.log(`Large content size: ${largeContent.length} characters`)
  
  const baselineSmall = quickBenchmark(() => tests[0].md.render(testContent)).avg
  const baselineLarge = quickBenchmark(() => tests[0].md.render(largeContent)).avg
  const pluginSmall = quickBenchmark(() => tests[1].md.render(testContent)).avg
  const pluginLarge = quickBenchmark(() => tests[1].md.render(largeContent)).avg
  
  const baselineRatio = baselineLarge / baselineSmall
  const pluginRatio = pluginLarge / pluginSmall
  
  console.log(`Baseline scaling ratio: ${baselineRatio.toFixed(2)}x`)
  console.log(`Plugin scaling ratio: ${pluginRatio.toFixed(2)}x`)
  console.log(`Scaling difference: ${((pluginRatio - baselineRatio) / baselineRatio * 100).toFixed(1)}%`)
}

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Run if called directly
if (process.argv[1] === __filename) {
  runQuickTest()
}

export { quickBenchmark, runQuickTest }
