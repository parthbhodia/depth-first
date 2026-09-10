import maxDepthBinaryTree from './problems/maximum-depth-of-binary-tree/index.js';
import countGoodNodes from './problems/count-good-nodes-in-binary-tree/index.js';
import climbingStairs from './problems/climbing-stairs/index.js';
import consistentHashing from './problems/consistent-hashing/index.js';

/**
 * The site's problem registry.
 *
 * Adding a problem:
 *   1. cp -r content/problems/<nearest-existing> content/problems/<new-slug>
 *   2. rewrite algorithms.js (instrumented solutions) and index.js (page content)
 *   3. import it here and add it to the array
 *
 * Routes, the index page, the sitemap and scripts/check.mjs all read this list.
 *
 * Every problem module must provide:
 *   stage        'binary-tree' | 'call-tree' — which canvas renders it
 *   inputLabel   what the input box is called
 *   parseInput   (text) => the value passed to approach.build()
 *   reference    (input) => the correct answer, for the check script
 *   checkInputs  input strings to verify against
 */
export const problems = [maxDepthBinaryTree, countGoodNodes, climbingStairs, consistentHashing];

export const problemBySlug = (slug) => problems.find((p) => p.slug === slug) || null;

export const problemSlugs = () => problems.map((p) => p.slug);
