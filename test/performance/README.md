# Performance Tests

Performance testing for the `markdown-it-hr-sandwiched-semantic-container` plugin.

## Quick Start

```bash
# Quick check (lightweight defaults)
npm run performance:quick   # runs performance-test.js quick

# Full analysis (comprehensive)
npm run performance         # runs performance-test.js full

# Feature-specific benchmarks
npm run performance:features  # same as: node performance-test.js features

# Memory analysis (requires --expose-gc)
npm run performance:memory
```

## Test Files

### `performance-test.js` - Comprehensive Analysis

- Feature benchmarks, scalability analysis, token density testing
- Memory usage measurement, detailed JSON logging (disabled in quick mode)
- Commands:
  - `node performance-test.js quick` (default fast path)
  - `node performance-test.js full` or `node performance-test.js comprehensive` (full suite)
  - `node performance-test.js features`
  - `node performance-test.js scalability`
  - `node performance-test.js density`

## Test Configurations

**Plugin modes**: Baseline (no plugin), Default, Bracket format, GitHub alerts, All features

**Content sizes**: Quick mode: 1K, 5K. Full mode: 1K, 5K, 10K, 50K characters

**Metrics**: Execution time, overhead vs baseline, scalability ratio, memory usage (if gc is available), token density

## Results

- **Console output**: Real-time metrics and overhead percentages
- **JSON files**: `performance_results_[timestamp].json` (only in full/comprehensive runs)

## Interpretation

- **Normal overhead**: 10-30% vs baseline
- **Warning signs**: >50% overhead, non-linear scaling, memory leaks
- **Goal**: Graceful performance degradation with content size
