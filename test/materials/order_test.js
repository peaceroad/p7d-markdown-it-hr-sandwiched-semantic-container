/**
 * order_test.js - Plugin order testing and markdown-it rule analysis
 * 
 * This file serves as a reference for debugging plugin order issues
 * and understanding markdown-it's internal rule execution order.
 * 
 * Key findings:
 * - mditSemanticContainer must run AFTER 'text_join' to avoid breaking footnote backlinks
 * - Plugin order matters: FootnoteHere → SemanticContainer is the correct order
 */
import mdit from 'markdown-it'
import mditSemanticContainer from '../../index.js'
import mditFootnoteHere from '@peaceroad/markdown-it-footnote-here'

// Helper function to show markdown-it rule order with details
function showRuleOrder(md, label) {
  console.log(`\n=== ${label} Rule Order ===`);
  console.log('Core rules:');
  md.core.ruler.__rules__.forEach((rule, i) => {
    console.log(`  ${i.toString().padStart(2)}: ${rule.name}`);
  });
  
  console.log('\nInline rules:');
  md.inline.ruler.__rules__.forEach((rule, i) => {
    console.log(`  ${i.toString().padStart(2)}: ${rule.name}`);
  });
  
  console.log('\nBlock rules:');
  md.block.ruler.__rules__.forEach((rule, i) => {
    console.log(`  ${i.toString().padStart(2)}: ${rule.name}`);
  });
}

// Helper function to analyze token structure
function analyzeTokens(tokens, indent = 0) {
  const prefix = '  '.repeat(indent);
  tokens.forEach((token, i) => {
    console.log(`${prefix}[${i}] ${token.type} (${token.tag || 'no-tag'}) - content: "${token.content || ''}" - markup: "${token.markup || ''}"`);
    if (token.children && token.children.length > 0) {
      console.log(`${prefix}  children:`);
      analyzeTokens(token.children, indent + 2);
    }
  });
}

const testContent = `A paragraph.[^1]

[^1]: A footnote.

Warning. A wargin text.

A paragraph.[^2]

[^2]: A footnote 2.`;

console.log('=== Plugin Order Comparison ===');

console.log('\n--- FootnoteHere → SemanticContainer (correct order) ---');
const md1 = mdit().use(mditFootnoteHere).use(mditSemanticContainer);
showRuleOrder(md1, 'FootnoteHere → SemanticContainer');
const result1 = md1.render(testContent);
console.log('\nBacklink check:', result1.includes('class="fn-backlink"') && result1.includes('[2]</a> A footnote 2') ? '✓ OK' : '✗ NG');

console.log('\n--- SemanticContainer → FootnoteHere (problematic order) ---');
const md2 = mdit().use(mditSemanticContainer).use(mditFootnoteHere);
showRuleOrder(md2, 'SemanticContainer → FootnoteHere');
const result2 = md2.render(testContent);
console.log('\nBacklink check:', result2.includes('class="fn-backlink"') && result2.includes('[2]</a> A footnote 2') ? '✓ OK' : '✗ NG');

// Detailed token analysis (uncomment for debugging)
// console.log('\n=== Token Analysis ===');
// const tokens1 = md1.parse(testContent);
// console.log('\n--- Tokens from correct order ---');
// analyzeTokens(tokens1);

// const tokens2 = md2.parse(testContent);
// console.log('\n--- Tokens from problematic order ---');
// analyzeTokens(tokens2);

console.log('\n=== Rule Order Comparison ===');
const mdPlain = mdit();
const mdWithFootnote = mdit().use(mditFootnoteHere);
const mdWithSemantic = mdit().use(mditSemanticContainer);
const mdBoth = mdit().use(mditFootnoteHere).use(mditSemanticContainer);

showRuleOrder(mdPlain, 'Plain markdown-it');
showRuleOrder(mdWithFootnote, 'With FootnoteHere');
showRuleOrder(mdWithSemantic, 'With SemanticContainer');
showRuleOrder(mdBoth, 'Both plugins (correct order)');
