#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Helper function to fetch content from a URL
async function fetchDocumentation(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch documentation: ${response.statusText}`);
        }
        return await response.text();
    }
    catch (error) {
        console.error(`Error fetching documentation: ${error}`);
        return "Unable to fetch documentation content.";
    }
}
// Helper function to determine the domain of a query
function determineDomain(query) {
    const queryLower = query.toLowerCase();
    // Simple keyword-based classification
    const domainKeywords = {
        "react-docs": ["react", "component", "jsx", "hook", "props", "state"],
        "node-docs": ["node", "express", "npm", "package", "module", "require"],
        "python-docs": ["python", "pip", "django", "flask", "pandas", "numpy"]
    };
    // Count matches for each domain
    const scores = {};
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
        scores[domain] = keywords.reduce((count, keyword) => {
            return count + (queryLower.includes(keyword) ? 1 : 0);
        }, 0);
    }
    // Find domain with highest score
    let bestDomain = "general";
    let highestScore = 0;
    for (const [domain, score] of Object.entries(scores)) {
        if (score > highestScore) {
            highestScore = score;
            bestDomain = domain;
        }
    }
    return highestScore > 0 ? bestDomain : "general";
}
// Function to extract specific topics from a query
function extractTopics(query, domain) {
    const queryLower = query.toLowerCase();
    // Domain-specific topic extraction
    const topicPatterns = {
        "react-docs": {
            "useState": /use\s*state/i,
            "useEffect": /use\s*effect/i,
            "useContext": /use\s*context/i,
            "useReducer": /use\s*reducer/i,
            "useCallback": /use\s*callback/i,
            "useMemo": /use\s*memo/i,
            "useRef": /use\s*ref/i,
            "components": /component/i,
            "props": /props/i,
            "state": /state\b/i,
            "jsx": /jsx/i,
            "rendering": /render/i,
            "events": /event/i
        },
        "node-docs": {
            "fs": /\bfs\b|file\s*system/i,
            "http": /\bhttp\b|\bserver\b/i,
            "path": /\bpath\b/i,
            "buffer": /\bbuffer\b/i,
            "stream": /\bstream\b/i,
            "events": /\bevents\b/i,
            "modules": /\bmodule\b|\brequire\b|\bimport\b/i,
            "npm": /\bnpm\b|\bpackage\b/i,
            "express": /\bexpress\b/i,
            "process": /\bprocess\b/i
        },
        "python-docs": {
            "list": /\blist\b|\blists\b/i,
            "dict": /\bdict\b|\bdictionary\b|\bdictionaries\b/i,
            "tuple": /\btuple\b|\btuples\b/i,
            "set": /\bset\b|\bsets\b/i,
            "string": /\bstring\b|\bstr\b/i,
            "file": /\bfile\b|\bopen\b|\bread\b|\bwrite\b/i,
            "class": /\bclass\b|\bobject\b|\binheritance\b/i,
            "function": /\bfunction\b|\bdef\b/i,
            "module": /\bmodule\b|\bimport\b/i,
            "pandas": /\bpandas\b|\bpd\b|\bdataframe\b/i,
            "numpy": /\bnumpy\b|\bnp\b|\barray\b/i,
            "django": /\bdjango\b/i,
            "flask": /\bflask\b/i
        }
    };
    const extractedTopics = [];
    // If we have patterns for this domain
    if (topicPatterns[domain]) {
        // Check each topic pattern
        for (const [topic, pattern] of Object.entries(topicPatterns[domain])) {
            if (pattern.test(queryLower)) {
                extractedTopics.push(topic);
            }
        }
    }
    // Extract any quoted terms as potential specific topics
    const quotedTerms = query.match(/"([^"]+)"|'([^']+)'/g);
    if (quotedTerms) {
        quotedTerms.forEach(term => {
            // Remove quotes
            const cleanTerm = term.replace(/['"]/g, '');
            if (cleanTerm.length > 2) { // Avoid very short terms
                extractedTopics.push(cleanTerm);
            }
        });
    }
    return extractedTopics;
}
// Function to construct specific documentation URLs based on domain and topics
function constructSpecificUrl(domain, topics) {
    if (topics.length === 0) {
        return null; // No specific topics found
    }
    // URL construction logic per domain
    switch (domain) {
        case "react-docs": {
            // React hooks and common concepts have specific URLs
            const reactHooks = ["useState", "useEffect", "useContext", "useReducer", "useCallback", "useMemo", "useRef"];
            const mainTopic = topics[0]; // Use the first identified topic
            if (reactHooks.includes(mainTopic)) {
                return `https://react.dev/reference/react/${mainTopic}`;
            }
            else if (mainTopic === "components") {
                return "https://react.dev/learn/your-first-component";
            }
            else if (mainTopic === "props") {
                return "https://react.dev/learn/passing-props-to-a-component";
            }
            else if (mainTopic === "state") {
                return "https://react.dev/learn/state-a-components-memory";
            }
            else if (mainTopic === "jsx") {
                return "https://react.dev/learn/writing-markup-with-jsx";
            }
            else if (mainTopic === "events") {
                return "https://react.dev/learn/responding-to-events";
            }
            else if (mainTopic === "rendering") {
                return "https://react.dev/learn/render-and-commit";
            }
            break;
        }
        case "node-docs": {
            const mainTopic = topics[0];
            if (mainTopic === "fs") {
                return "https://nodejs.org/api/fs.html";
            }
            else if (mainTopic === "http") {
                return "https://nodejs.org/api/http.html";
            }
            else if (mainTopic === "path") {
                return "https://nodejs.org/api/path.html";
            }
            else if (mainTopic === "buffer") {
                return "https://nodejs.org/api/buffer.html";
            }
            else if (mainTopic === "stream") {
                return "https://nodejs.org/api/stream.html";
            }
            else if (mainTopic === "events") {
                return "https://nodejs.org/api/events.html";
            }
            else if (mainTopic === "modules") {
                return "https://nodejs.org/api/modules.html";
            }
            else if (mainTopic === "process") {
                return "https://nodejs.org/api/process.html";
            }
            else if (mainTopic === "npm") {
                return "https://docs.npmjs.com/";
            }
            else if (mainTopic === "express") {
                return "https://expressjs.com/en/api.html";
            }
            break;
        }
        case "python-docs": {
            const mainTopic = topics[0];
            // Standard library topics
            if (["list", "dict", "tuple", "set", "string"].includes(mainTopic)) {
                return `https://docs.python.org/3/library/stdtypes.html#${mainTopic}s`;
            }
            else if (mainTopic === "file") {
                return "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files";
            }
            else if (mainTopic === "class") {
                return "https://docs.python.org/3/tutorial/classes.html";
            }
            else if (mainTopic === "function") {
                return "https://docs.python.org/3/tutorial/controlflow.html#defining-functions";
            }
            else if (mainTopic === "module") {
                return "https://docs.python.org/3/tutorial/modules.html";
            }
            // Popular libraries
            else if (mainTopic === "pandas") {
                return "https://pandas.pydata.org/docs/user_guide/index.html";
            }
            else if (mainTopic === "numpy") {
                return "https://numpy.org/doc/stable/user/index.html";
            }
            else if (mainTopic === "django") {
                return "https://docs.djangoproject.com/en/stable/";
            }
            else if (mainTopic === "flask") {
                return "https://flask.palletsprojects.com/en/latest/";
            }
            break;
        }
    }
    return null; // No specific URL could be constructed
}
// Create the MCP server
const serverConfig = {
    name: "documentation-hub",
    version: "1.0.0",
    capabilities: {
        resources: {
            "react-docs": {
                description: "React.js documentation",
                schema: z.object({
                    url: z.string().optional().describe("Specific React documentation URL to fetch")
                }),
                handler: async ({ url: specificUrl } = {}) => {
                    const baseUrl = "https://react.dev/reference/react";
                    const targetUrl = specificUrl || baseUrl;
                    const content = await fetchDocumentation(targetUrl);
                    return {
                        content,
                        metadata: {
                            source: targetUrl,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            },
            "node-docs": {
                description: "Node.js documentation",
                schema: z.object({
                    url: z.string().optional().describe("Specific Node.js documentation URL to fetch")
                }),
                handler: async ({ url: specificUrl } = {}) => {
                    const baseUrl = "https://nodejs.org/en/docs";
                    const targetUrl = specificUrl || baseUrl;
                    const content = await fetchDocumentation(targetUrl);
                    return {
                        content,
                        metadata: {
                            source: targetUrl,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            },
            "python-docs": {
                description: "Python documentation",
                schema: z.object({
                    url: z.string().optional().describe("Specific Python documentation URL to fetch")
                }),
                handler: async ({ url: specificUrl } = {}) => {
                    const baseUrl = "https://docs.python.org/3/";
                    const targetUrl = specificUrl || baseUrl;
                    const content = await fetchDocumentation(targetUrl);
                    return {
                        content,
                        metadata: {
                            source: targetUrl,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            },
            "general": {
                description: "General documentation when domain is unclear",
                schema: z.object({
                    url: z.string().describe("URL to fetch documentation from")
                }),
                handler: async ({ url }) => {
                    if (!url) {
                        return {
                            content: "Please provide a specific URL for general documentation queries.",
                            metadata: {
                                source: "none",
                                timestamp: new Date().toISOString()
                            }
                        };
                    }
                    const content = await fetchDocumentation(url);
                    return {
                        content,
                        metadata: {
                            source: url,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
            }
        },
        tools: {
            "determine-domain": {
                description: "Determines which technical domain a query belongs to",
                parameters: z.object({
                    query: z.string().describe("The user query to classify")
                }),
                handler: async ({ query }) => {
                    const domain = determineDomain(query);
                    return {
                        domain,
                        confidence: domain !== "general" ? "high" : "low"
                    };
                }
            },
            "extract-topics": {
                description: "Extracts specific topics from a query for a given domain",
                parameters: z.object({
                    query: z.string().describe("The user query to analyze"),
                    domain: z.string().describe("The technical domain to extract topics for")
                }),
                handler: async ({ query, domain }) => {
                    const topics = extractTopics(query, domain);
                    return {
                        topics,
                        count: topics.length
                    };
                }
            },
            "fetch-documentation": {
                description: "Fetches documentation based on query and domain",
                parameters: z.object({
                    query: z.string().describe("The user query"),
                    domain: z.string().optional().describe("Optional domain override")
                }),
                handler: async ({ query, domain: specifiedDomain }) => {
                    // Determine domain if not specified
                    const domain = specifiedDomain || determineDomain(query);
                    // Extract specific topics from the query
                    const topics = extractTopics(query, domain);
                    // Try to construct a specific URL based on the topics
                    const specificUrl = constructSpecificUrl(domain, topics);
                    // Store a reference to resources for type safety
                    const resources = serverConfig.capabilities.resources;
                    // Access the appropriate resource based on domain
                    try {
                        if (!resources[domain]) {
                            throw new Error(`Unknown domain: ${domain}`);
                        }
                        // Use the specific URL if available, otherwise use the base URL
                        const resource = resources[domain];
                        const result = await resource.handler({ url: specificUrl });
                        return {
                            domain,
                            topics: topics.length > 0 ? topics : ["general"],
                            specificUrl,
                            content: result.content,
                            source: result.metadata.source
                        };
                    }
                    catch (error) {
                        console.error(`Error fetching documentation: ${error}`);
                        return {
                            domain,
                            topics,
                            content: "Error fetching documentation for this domain.",
                            error: String(error)
                        };
                    }
                }
            }
        },
    }
};
// Create the MCP server with our configuration
const server = new McpServer(serverConfig);
// Create the server transport
const transport = new StdioServerTransport(server);
// Start the server
transport.start();
console.error("Documentation Hub MCP Server started");
