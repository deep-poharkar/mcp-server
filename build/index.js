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
            "fetch-documentation": {
                description: "Fetches documentation based on query and domain",
                parameters: z.object({
                    query: z.string().describe("The user query"),
                    domain: z.string().optional().describe("Optional domain override")
                }),
                handler: async ({ query, domain: specifiedDomain }) => {
                    // Determine domain if not specified
                    const domain = specifiedDomain || determineDomain(query);
                    // Store a reference to resources for type safety
                    const resources = serverConfig.capabilities.resources;
                    // Access the appropriate resource based on domain
                    try {
                        if (!resources[domain]) {
                            throw new Error(`Unknown domain: ${domain}`);
                        }
                        // For this example, we're just using the base URLs
                        // In a real implementation, you might extract specific URLs from the query
                        const resource = resources[domain];
                        const result = await resource.handler({});
                        return {
                            domain,
                            content: result.content,
                            source: result.metadata.source
                        };
                    }
                    catch (error) {
                        console.error(`Error fetching documentation: ${error}`);
                        return {
                            domain,
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
// Using type assertion to work around the type compatibility issue
// This is safe because the MCP SDK is designed to work this way
const transport = new StdioServerTransport(server);
// Start the server
transport.start();
console.error("Documentation Hub MCP Server started");
