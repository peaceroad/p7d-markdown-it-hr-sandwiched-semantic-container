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

  scalability: (size, variant = 0) => {
    const id = variant + 1
    const baseContent = `Paragraph ${id}.

Warning. Warning message ${id}.

> [!NOTE]
> Note alert ${id}.

[Bracket]. Format ${id}.

`
    return baseContent.repeat(Math.ceil(size / baseContent.length)).slice(0, size)
  }
}

const deterministicAbCorpus = [
  {
    name: 'small-basic',
    content: contentTemplates.basic,
    batch: 50
  },
  {
    name: 'small-github',
    content: `> [!NOTE]
> Alert with list:
> - Item 1
> - Item 2
>
> \`\`\`js
> console.log('note')
> \`\`\`
`,
    batch: 50
  },
  {
    name: 'medium-mixed',
    content: contentTemplates.complex.repeat(4),
    batch: 20
  },
  {
    name: 'large-scalability',
    content: contentTemplates.scalability(12000, 7),
    batch: 5
  },
  {
    name: 'xlarge-scalability',
    content: contentTemplates.scalability(36000, 13),
    batch: 2
  }
]

// Performance measurement utilities
function measurePerformance(fn, iterations = 50, warmup = 5) {
  const times = []
  
  for (let i = 0; i < warmup; i++) {
    fn()
  }
  
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
function runFeatureBenchmarks({ iterations = 50 } = {}) {
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
    const baselineResult = measurePerformance(() => baselineMd.render(test.content), iterations)
    
    Object.entries(configurations).forEach(([key, config]) => {
      const md = config.setup()
      const result = measurePerformance(() => md.render(test.content), iterations)
      const overhead = key === 'baseline' ? 0 : ((result.avg - baselineResult.avg) / baselineResult.avg * 100)
      
      console.log(`  ${config.name}: ${result.avg.toFixed(3)}ms avg (${overhead > 0 ? '+' : ''}${overhead.toFixed(1)}% overhead)`)
    })
  })
}

// Scalability test
function runScalabilityTest({ sizes = [1000, 5000, 10000, 50000], iterations = 20 } = {}) {
  console.log('\n=== Scalability Test ===')
  const results = {}
  
  sizes.forEach(size => {
    console.log(`\nTesting with ${size} character content...`)
    const content = contentTemplates.scalability(size)
    
    Object.entries(configurations).forEach(([key, config]) => {
      const md = config.setup()
      const result = measurePerformance(() => md.render(content), iterations)
      
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
      const tokens = md.parse(test.content, {}) // ensure env exists to avoid inline link rule errors
      const result = measurePerformance(() => md.render(test.content), 30)
      
      console.log(`  ${config.name}: ${result.avg.toFixed(3)}ms (${tokens.length} tokens)`)
    })
  })
}

function runDeterministicABBenchmark({
  iterations = 50,
  warmup = 12,
  configKeys = ['default', 'bracketFormat', 'githubAlerts', 'allFeatures']
} = {}) {
  console.log('\n=== Deterministic A/B Benchmark ===')
  console.log('Fixed corpus for before/after comparison across commits.')
  console.log(`Cases: ${deterministicAbCorpus.length}, Iterations: ${iterations}, Warmup: ${warmup}`)

  const selectedKeys = configKeys.filter((key) => configurations[key])
  const totals = { baseline: 0 }
  const baselineMd = configurations.baseline.setup()

  for (const key of selectedKeys) {
    totals[key] = 0
  }

  deterministicAbCorpus.forEach((testCase, index) => {
    const batch = testCase.batch || 1
    const renderBatch = (md) => {
      for (let i = 0; i < batch; i++) {
        md.render(testCase.content)
      }
    }
    console.log(`\n--- Case ${index + 1}: ${testCase.name} (${testCase.content.length} chars, batch=${batch}) ---`)
    const baselineResult = measurePerformance(
      () => renderBatch(baselineMd),
      iterations,
      warmup
    )
    const baselineMedianPerRender = baselineResult.median / batch
    totals.baseline += baselineMedianPerRender
    console.log(`  ${configurations.baseline.name}: ${baselineMedianPerRender.toFixed(3)}ms median/render`)

    selectedKeys.forEach((key) => {
      const md = configurations[key].setup()
      const result = measurePerformance(
        () => renderBatch(md),
        iterations,
        warmup
      )
      const medianPerRender = result.median / batch
      totals[key] += medianPerRender
      const overhead = ((medianPerRender - baselineMedianPerRender) / baselineMedianPerRender) * 100
      console.log(`  ${configurations[key].name}: ${medianPerRender.toFixed(3)}ms median/render (${overhead >= 0 ? '+' : ''}${overhead.toFixed(1)}%)`)
    })
  })

  console.log('\n--- A/B Score (lower is better) ---')
  console.log(`  ${configurations.baseline.name}: ${totals.baseline.toFixed(3)}ms total`)
  selectedKeys.forEach((key) => {
    const ratio = totals[key] / totals.baseline
    console.log(`  ${configurations[key].name}: ${totals[key].toFixed(3)}ms total (${ratio.toFixed(3)}x baseline)`)
  })
}

// Main comprehensive test
function runComprehensiveTest({ iterations = 50, sizes = { small: 1000, medium: 5000, large: 10000, xlarge: 50000 }, saveResults = true } = {}) {
  console.log('markdown-it-hr-sandwiched-semantic-container Comprehensive Performance Test')
  console.log('='.repeat(80))
  
  const testSizes = sizes
  
  const results = {}
  
  Object.entries(testSizes).forEach(([sizeName, size]) => {
    console.log(`\n=== ${sizeName.toUpperCase()} Content Test (${size} chars) ===`)
    const content = contentTemplates.scalability(size)
    console.log(`Actual content size: ${content.length} characters`)
    
    Object.entries(configurations).forEach(([configKey, config]) => {
      console.log(`\nTesting: ${config.name}`)
      const md = config.setup()
      
      // Performance measurement
      const perfResult = measurePerformance(() => md.render(content), iterations)
      
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
  if (saveResults) {
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
    case 'ab':
      runDeterministicABBenchmark()
      break
    case 'comprehensive':
    case 'full':
      runComprehensiveTest()
      runFeatureBenchmarks()
      runScalabilityTest()
      runTokenDensityTest()
      runDeterministicABBenchmark()
      break
    case 'quick':
    default: {
      console.log('Running quick performance pass (use "full" for the exhaustive suite).')
      runComprehensiveTest({
        iterations: 10,
        sizes: { small: 1000, medium: 5000 },
        saveResults: false,
      })
      runFeatureBenchmarks({ iterations: 10 })
      runScalabilityTest({ sizes: [1000, 5000], iterations: 10 })
      runTokenDensityTest()
      runDeterministicABBenchmark({ iterations: 10, warmup: 4 })
      break
    }
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
  runComprehensiveTest,
  runDeterministicABBenchmark
}
