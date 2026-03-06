/**
 * WhatsApp Bot – RAG (Retrieval-Augmented Generation) Engine
 * ----------------------------------------------------------
 * Builds an in-memory "vector" index of product documents using
 * TF-IDF style term weighting + cosine similarity.
 * No external AI provider required – works entirely offline.
 *
 * The index is refreshed every REFRESH_INTERVAL_MS so it stays
 * in sync with the database without a full server restart.
 */

'use strict';

const Product = require('../models/Product');

// ─── Config ──────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // refresh every 5 minutes
const MAX_RESULTS = 5;
const SIMILARITY_THRESHOLD = 0.05; // minimum cosine score to include a result

// ─── Internal state ───────────────────────────────────────────────────────────
let productIndex = [];   // [{ product, terms, tfidf }]
let idf = {};            // { term: idf_score }
let lastRefresh = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize text: lowercase, strip punctuation, collapse spaces */
function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of',
    'and', 'or', 'but', 'not', 'with', 'this', 'that', 'are', 'was',
    'be', 'as', 'by', 'do', 'if', 'my', 'me', 'we', 'he', 'she', 'they',
    'i', 'hi', 'hello', 'hey', 'please', 'can', 'could', 'would', 'want',
    'need', 'show', 'tell', 'me', 'about', 'your', 'you', 'what', 'how',
    'much', 'price', 'buy', 'get', 'have', 'has', 'any', 'some', 'all'
]);

/** Compute term-frequency map for a list of tokens */
function computeTF(tokens) {
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const total = tokens.length || 1;
    for (const t in tf) tf[t] /= total;
    return tf;
}

/** Cosine similarity between two TF-IDF vectors (objects) */
function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (const t in a) {
        magA += a[t] * a[t];
        if (b[t]) dot += a[t] * b[t];
    }
    for (const t in b) magB += b[t] * b[t];
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Build a rich text document for a product (used for indexing) */
function buildProductDocument(product) {
    const parts = [
        product.name,
        product.name, // weight name twice
        product.sku,
        product.description || '',
        product.stock_status || '',
        product.price ? `price ${product.price}` : '',
    ];
    return parts.join(' ');
}

/** Build the full TF-IDF index from a list of products */
function buildIndex(products) {
    // Step 1: tokenize each product document
    const docs = products.map(p => ({
        product: p.toJSON(),
        tokens: tokenize(buildProductDocument(p))
    }));

    // Step 2: compute IDF across all documents
    const N = docs.length;
    const df = {};
    for (const doc of docs) {
        const unique = new Set(doc.tokens);
        for (const t of unique) df[t] = (df[t] || 0) + 1;
    }
    const newIdf = {};
    for (const t in df) newIdf[t] = Math.log((N + 1) / (df[t] + 1)) + 1;

    // Step 3: compute TF-IDF vector for each document
    const index = docs.map(doc => {
        const tf = computeTF(doc.tokens);
        const tfidf = {};
        for (const t in tf) tfidf[t] = tf[t] * (newIdf[t] || 1);
        return { product: doc.product, tfidf };
    });

    return { index, idf: newIdf };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Refresh the RAG index from the database (called automatically on a timer
 * and on the first query after startup).
 */
async function refreshIndex() {
    try {
        const products = await Product.findAll({
            where: { stock_status: 'instock' }
        });

        if (products.length === 0) {
            // Fall back to ALL products if none are "instock"
            const all = await Product.findAll();
            const result = buildIndex(all);
            productIndex = result.index;
            idf = result.idf;
        } else {
            const result = buildIndex(products);
            productIndex = result.index;
            idf = result.idf;
        }

        lastRefresh = Date.now();
        console.log(`[RAG] Index refreshed – ${productIndex.length} products indexed.`);
    } catch (err) {
        console.error('[RAG] Failed to refresh index:', err.message);
    }
}

/**
 * Search for products matching the user's query.
 * @param {string} query - The user's natural-language message
 * @returns {Array} Top matching product objects (plain JS objects)
 */
async function search(query) {
    // Auto-refresh on first call or after interval
    if (productIndex.length === 0 || Date.now() - lastRefresh > REFRESH_INTERVAL_MS) {
        await refreshIndex();
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Build TF-IDF vector for the query
    const tf = computeTF(queryTokens);
    const queryVec = {};
    for (const t in tf) queryVec[t] = tf[t] * (idf[t] || 0.5);

    // Score all documents
    const scored = productIndex.map(entry => ({
        product: entry.product,
        score: cosineSimilarity(queryVec, entry.tfidf)
    }));

    // Sort descending, filter threshold, return top N
    return scored
        .filter(s => s.score >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS)
        .map(s => s.product);
}

/**
 * Get a single product by its database ID.
 * @param {number|string} id
 */
async function getProductById(id) {
    const product = await Product.findByPk(id);
    return product ? product.toJSON() : null;
}

/**
 * Get ALL products (for the full catalogue listing).
 */
async function getAllProducts(limit = 20) {
    // Auto-refresh
    if (productIndex.length === 0 || Date.now() - lastRefresh > REFRESH_INTERVAL_MS) {
        await refreshIndex();
    }
    return productIndex.slice(0, limit).map(e => e.product);
}

// Start background refresh timer
setInterval(refreshIndex, REFRESH_INTERVAL_MS);

module.exports = { search, getProductById, getAllProducts, refreshIndex };
