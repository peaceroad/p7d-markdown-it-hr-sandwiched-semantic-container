/**
 * Comprehensive Performance Test for markdown-it-hr-sandwiched-semantic-container
 * 
 * This test combines detailed performance analysis with feature-specific benchmarks.
 * It measures execution time, memory usage, and scalability across different content sizes
 * and plugin configurations.
 */

import MarkdownIt from 'markdown-it'
import mditSemanticContainer from '../../index.js'
import { performance } from 'perf_hooks'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test configurations
const configurations = {
  baseline: { name: 'Baseline (no plugin)', setup: () => new MarkdownIt() },
  default: { name: 'Default semantic containers', setup: () => new MarkdownIt().use(mditSemanticContainer) },
  bracketFormat: { name: 'With bracket format', setup: () => new MarkdownIt().use(mditSemanticContainer, { allowBracketJoint: true }) },
  githubAlerts: { name: 'With GitHub alerts', setup: () => new MarkdownIt().use(mditSemanticContainer, { githubTypeContainer: true }) },
  allFeatures: { name: 'All features enabled', setup: () => new MarkdownIt().use(mditSemanticContainer, { allowBracketJoint: true, githubTypeContainer: true }) }
}

// Test content templates
const contentTemplates = {
  basic: `This is a paragraph.

Warning. This is a warning message.

This is another paragraph.`,

  complex: `This is a paragraph with [bracket format].

> [!NOTE]
> This is a GitHub-style alert.

Warning. This is a semantic container.

Information. Multiple semantic containers in one document.

> [!WARNING]
> Another GitHub alert.

[Mixed content]. With various formats.`,

  largeMixed: `# Large Document Test

This document contains various semantic containers and formats.

`.repeat(5) + `
Warning. Semantic container warning.
Information. Semantic container information.
Note. Semantic container note.

> [!NOTE]
> GitHub-style note alert.

> [!WARNING]  
> GitHub-style warning alert.

[Bracket format]. Mixed with other formats.

`.repeat(10),

  scalability: (size) => {
    const baseContent = `Paragraph ${Math.random()}.

Warning. Warning message ${Math.random()}.

> [!NOTE]
> Note alert ${Math.random()}.

[Bracket]. Format ${Math.random()}.

`
    return baseContent.repeat(Math.ceil(size / baseContent.length))
  }
}

// Performance measurement utilities
function measurePerformance(fn, iterations = 100) {
  const times = []
  
  // Warm-up
  for (let i = 0; i < 5; i++) {
    fn()
  }
  
  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }
  
  times.sort((a, b) => a - b)
  
  return {
    min: times[0],
    max: times[times.length - 1],
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)]
  }
}

function measureMemory(fn) {
  if (!global.gc) {
    return null
  }
  
  global.gc()
  const memBefore = process.memoryUsage().heapUsed
  
  fn()
  
  global.gc()
  const memAfter = process.memoryUsage().heapUsed
  
  return {
    before: memBefore,
    after: memAfter,
    diff: memAfter - memBefore
  }
}

// Feature-specific benchmark tests
function runFeatureBenchmarks() {
  console.log('\n=== Feature-specific Benchmarks ===')
  
  const featureTests = [
    { name: 'Basic semantic containers', content: contentTemplates.basic },
    { name: 'GitHub-style alerts', content: contentTemplates.complex },
    { name: 'Bracket format', content: '[Warning]. Bracket format test.\n[Information]. Another bracket format.' },
    { name: 'Mixed content', content: contentTemplates.complex },
    { name: 'Large document', content: contentTemplates.largeMixed }
  ]
  
  featureTests.forEach(test => {
    console.log(`\n--- ${test.name} ---`)
    console.log(`Content size: ${test.content.length} characters`)
    
    // Get baseline first
    const baselineMd = configurations.baseline.setup()
    const baselineResult = measurePerformance(() => baselineMd.render(test.content), 50)
    
    Object.entries(configurations).forEach(([key, config]) => {
      const md = config.setup()
      const result = measurePerformance(() => md.render(test.content), 50)
      const overhead = key === 'baseline' ? 0 : ((result.avg - baselineResult.avg) / baselineResult.avg * 100)
      
      console.log(`  ${config.name}: ${result.avg.toFixed(3)}ms avg (${overhead > 0 ? '+' : ''}${overhead.toFixed(1)}% overhead)`)
    })
  })
}

// Scalability test
function runScalabilityTest() {
  console.log('\n=== Scalability Test ===')
  
  const sizes = [1000, 5000, 10000, 50000]
  const results = {}
  
  sizes.forEach(size => {
    console.log(`\nTesting with ${size} character content...`)
    const content = contentTemplates.scalability(size)
    
    Object.entries(configurations).forEach(([key, config]) => {
      const md = config.setup()
      const result = measurePerformance(() => md.render(content), 20)
      
      if (!results[key]) results[key] = []
      results[key].push({ size, time: result.avg })
      
      console.log(`  ${config.name}: ${result.avg.toFixed(3)}ms`)
    })
  })
  
  // Calculate scalability ratio
  console.log('\n--- Scalability Analysis ---')
  Object.entries(results).forEach(([key, data]) => {
    const config = configurations[key]
    const ratio = data[data.length - 1].time / data[0].time
    console.log(`${config.name}: ${ratio.toFixed(2)}x time increase for ${sizes[sizes.length - 1] / sizes[0]}x content`)
  })
}

// Token density test
function runTokenDensityTest() {
  console.log('\n=== Token Density Test ===')
  
  const densityTests = [
    { name: 'Low density', content: 'Regular paragraph text without any special formatting.\n\nAnother regular paragraph.' },
    { name: 'Medium density', content: 'Warning. Some semantic containers.\n\nInformation. Mixed with regular text.' },
    { name: 'High density', content: 'Warning. Semantic.\nNote. Multiple.\nInformation. Containers.\n[Bracket]. Format.\n> [!NOTE]\n> GitHub alert.' }
  ]
  
  densityTests.forEach(test => {
    console.log(`\n--- ${test.name} ---`)
    
    Object.entries(configurations).forEach(([key, config]) => {
      const md = config.setup()
      const tokens = md.parse(test.content)
      const result = measurePerformance(() => md.render(test.content), 100)
      
      console.log(`  ${config.name}: ${result.avg.toFixed(3)}ms (${tokens.length} tokens)`)
    })
  })
}

// Main comprehensive test
function runComprehensiveTest() {
  console.log('markdown-it-hr-sandwiched-semantic-container Comprehensive Performance Test')
  console.log('='.repeat(80))
  
  const testSizes = {
    small: 1000,
    medium: 5000,
    large: 10000,
    xlarge: 50000
  }
  
  const results = {}
  
  Object.entries(testSizes).forEach(([sizeName, size]) => {
    console.log(`\n=== ${sizeName.toUpperCase()} Content Test (${size} chars) ===`)
    const content = contentTemplates.scalability(size)
    console.log(`Actual content size: ${content.length} characters`)
    
    Object.entries(configurations).forEach(([configKey, config]) => {
      console.log(`\nTesting: ${config.name}`)
      const md = config.setup()
      
      // Performance measurement
      const perfResult = measurePerformance(() => md.render(content))
      
      // Memory measurement (if available)
      const memResult = measureMemory(() => md.render(content))
      
      if (!results[configKey]) results[configKey] = {}
      results[configKey][sizeName] = {
        performance: perfResult,
        memory: memResult,
        contentSize: content.length
      }
      
      console.log(`  Time - Avg: ${perfResult.avg.toFixed(3)}ms, Median: ${perfResult.median.toFixed(3)}ms, P95: ${perfResult.p95.toFixed(3)}ms`)
      if (memResult) {
        console.log(`  Memory - Used: ${(memResult.diff / 1024 / 1024).toFixed(2)}MB`)
      }
    })
  })
  
  // Generate summary
  console.log('\n' + '='.repeat(80))
  console.log('Performance Summary')
  console.log('='.repeat(80))
  
  Object.entries(configurations).forEach(([configKey, config]) => {
    console.log(`\n${config.name}:`)
    Object.entries(testSizes).forEach(([sizeName, size]) => {
      const result = results[configKey][sizeName]
      if (result) {
        const baselineResult = results.baseline?.[sizeName]
        const overhead = baselineResult ? ((result.performance.avg - baselineResult.performance.avg) / baselineResult.performance.avg * 100) : 0
        
        console.log(`  ${sizeName}: ${result.performance.avg.toFixed(3)}ms (${overhead > 0 ? '+' : ''}${overhead.toFixed(1)}% vs baseline)`)
      }
    })
  })
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `performance_results_${timestamp}.json`
  
  const detailedResults = {
    timestamp: new Date().toISOString(),
    configurations: Object.keys(configurations),
    testSizes,
    results,
    summary: {
      memoryTestAvailable: !!global.gc,
      nodeVersion: process.version,
      platform: process.platform
    }
  }
  
  fs.writeFileSync(filename, JSON.stringify(detailedResults, null, 2))
  console.log(`\nDetailed results saved to: ${filename}`)
  
  if (!global.gc) {
    console.log('\nNote: To run memory tests, execute with: node --expose-gc performance-test.js')
  }
}

// Command line interface
function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'features':
      runFeatureBenchmarks()
      break
    case 'scalability':
      runScalabilityTest()
      break
    case 'density':
      runTokenDensityTest()
      break
    case 'comprehensive':
    default:
      runComprehensiveTest()
      runFeatureBenchmarks()
      runScalabilityTest()
      runTokenDensityTest()
      break
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main()
}

export { 
  measurePerformance, 
  measureMemory, 
  runFeatureBenchmarks, 
  runScalabilityTest, 
  runTokenDensityTest, 
  runComprehensiveTest 
}
