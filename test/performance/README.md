# Performance Tests

Performance testing for the `markdown-it-hr-sandwiched-semantic-container` plugin.

## Quick Start

```bash
# Quick check
npm run performance:quick

# Full analysis
npm run performance

# Feature-specific benchmarks
npm run performance:features

# Memory analysis
npm run performance:memory
```

## Test Files

### `performance-test.js` - Comprehensive Analysis

- Feature benchmarks, scalability analysis, token density testing
- Memory usage measurement, detailed JSON logging
- Command: `node performance-test.js [features|scalability|density]`

### `quick-test.js` - Development Check

- Rapid performance comparison and basic scalability check
- Command: `node quick-test.js`

## Test Configurations

**Plugin modes**: Baseline (no plugin), Default, Bracket format, GitHub alerts, All features

**Content sizes**: 1K, 5K, 10K, 50K characters

**Metrics**: Execution time, overhead vs baseline, scalability ratio, memory usage

## Results

- **Console output**: Real-time metrics and overhead percentages
- **JSON files**: `performance_results_[timestamp].json` for historical analysis

## Interpretation

- **Normal overhead**: 10-30% vs baseline
- **Warning signs**: >50% overhead, non-linear scaling, memory leaks
- **Goal**: Graceful performance degradation with content size
