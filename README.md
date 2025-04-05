# Documentation Hub MCP Server

A Model Context Protocol (MCP) server for intelligent documentation retrieval across multiple technical domains.

## Overview

This project implements an MCP server that provides targeted documentation retrieval for technical queries. It uses a hybrid approach to:

1. Determine the technical domain of a query (React, Node.js, Python)
2. Extract specific topics from the query
3. Construct precise documentation URLs
4. Fetch and return the most relevant documentation

The server is built using TypeScript and the MCP SDK, providing a standardized interface for AI models to access documentation resources.

## Features

- **Domain Classification**: Automatically identifies whether a query is about React, Node.js, Python, or general topics
- **Topic Extraction**: Uses regex pattern matching to identify specific technical concepts in queries
- **URL Construction**: Builds targeted documentation URLs based on identified topics
- **Multiple Documentation Sources**: Supports documentation from React, Node.js, Python, and can be extended to other domains
- **Standardized Interface**: Implements the Model Context Protocol for interoperability with MCP-compatible clients

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Running the Server

```bash
node build/index.js
```

### Testing Topic Extraction

The project includes a test script to demonstrate how topic extraction and URL construction work:

```bash
# Build the test script
npx tsc src/test.ts --outDir build

# Run the test
node build/test.js
```

### Integrating with Clients

The server can be integrated with any MCP-compatible client. Here's an example of how a client might interact with the server:

```typescript
// Example client code (not included in this project)
const client = new McpClient();
const result = await client.callTool("fetch-documentation", {
  query: "How do I use useState hook in React?",
});

console.log(result);
// Output: {
//   domain: "react-docs",
//   topics: ["useState", "state"],
//   specificUrl: "https://react.dev/reference/react/useState",
//   content: "...",
//   source: "https://react.dev/reference/react/useState"
// }
```

## Project Structure

- `src/index.ts` - Main server implementation
- `src/test.ts` - Test script for topic extraction and URL construction
- `build/` - Compiled JavaScript output
- `package.json` - Project configuration and dependencies

## Available Tools

The server exposes the following tools:

### determine-domain

Determines which technical domain a query belongs to.

```typescript
{
  query: string; // The user query to classify
}
```

Returns:

```typescript
{
  domain: string; // The identified domain
  confidence: string; // "high" or "low"
}
```

### extract-topics

Extracts specific topics from a query for a given domain.

```typescript
{
  query: string; // The user query to analyze
  domain: string; // The technical domain to extract topics for
}
```

Returns:

```typescript
{
  topics: string[]; // Array of identified topics
  count: number; // Number of topics found
}
```

### fetch-documentation

Fetches documentation based on query and domain.

```typescript
{
  query: string; // The user query
  domain?: string; // Optional domain override
}
```

Returns:

```typescript
{
  domain: string; // The identified domain
  topics: string[]; // Array of identified topics
  specificUrl: string | null; // The constructed URL if available
  content: string; // The fetched documentation content
  source: string; // The source URL
}
```

## Available Resources

The server provides the following documentation resources:

- `react-docs` - React.js documentation
- `node-docs` - Node.js documentation
- `python-docs` - Python documentation
- `general` - General documentation when domain is unclear

## Extending the Server

### Adding New Domains

To add support for a new technical domain:

1. Add domain keywords to the `domainKeywords` object in the `determineDomain` function
2. Add topic patterns to the `topicPatterns` object in the `extractTopics` function
3. Add URL construction logic to the `constructSpecificUrl` function
4. Add a new resource handler in the server configuration

### Improving Topic Extraction

The topic extraction can be improved by:

1. Enhancing regex patterns for existing topics
2. Adding new topics to existing domains
3. Implementing more sophisticated NLP techniques for topic extraction

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
