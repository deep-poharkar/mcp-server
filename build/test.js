#!/usr/bin/env node
// Define the functions we want to test (copied from index.ts)
// Helper function to determine the domain of a query
function determineDomain(query) {
    var queryLower = query.toLowerCase();
    // Simple keyword-based classification
    var domainKeywords = {
        "react-docs": ["react", "component", "jsx", "hook", "props", "state"],
        "node-docs": ["node", "express", "npm", "package", "module", "require"],
        "python-docs": ["python", "pip", "django", "flask", "pandas", "numpy"]
    };
    // Count matches for each domain
    var scores = {};
    for (var _i = 0, _a = Object.entries(domainKeywords); _i < _a.length; _i++) {
        var _b = _a[_i], domain = _b[0], keywords = _b[1];
        scores[domain] = keywords.reduce(function (count, keyword) {
            return count + (queryLower.includes(keyword) ? 1 : 0);
        }, 0);
    }
    // Find domain with highest score
    var bestDomain = "general";
    var highestScore = 0;
    for (var _c = 0, _d = Object.entries(scores); _c < _d.length; _c++) {
        var _e = _d[_c], domain = _e[0], score = _e[1];
        if (score > highestScore) {
            highestScore = score;
            bestDomain = domain;
        }
    }
    return highestScore > 0 ? bestDomain : "general";
}
// Function to extract specific topics from a query
function extractTopics(query, domain) {
    var queryLower = query.toLowerCase();
    // Domain-specific topic extraction
    var topicPatterns = {
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
    var extractedTopics = [];
    // If we have patterns for this domain
    if (topicPatterns[domain]) {
        // Check each topic pattern
        for (var _i = 0, _a = Object.entries(topicPatterns[domain]); _i < _a.length; _i++) {
            var _b = _a[_i], topic = _b[0], pattern = _b[1];
            if (pattern.test(queryLower)) {
                extractedTopics.push(topic);
            }
        }
    }
    // Extract any quoted terms as potential specific topics
    var quotedTerms = query.match(/"([^"]+)"|'([^']+)'/g);
    if (quotedTerms) {
        quotedTerms.forEach(function (term) {
            // Remove quotes
            var cleanTerm = term.replace(/['"]/g, '');
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
            var reactHooks = ["useState", "useEffect", "useContext", "useReducer", "useCallback", "useMemo", "useRef"];
            var mainTopic = topics[0]; // Use the first identified topic
            if (reactHooks.includes(mainTopic)) {
                return "https://react.dev/reference/react/".concat(mainTopic);
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
            var mainTopic = topics[0];
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
            var mainTopic = topics[0];
            // Standard library topics
            if (["list", "dict", "tuple", "set", "string"].includes(mainTopic)) {
                return "https://docs.python.org/3/library/stdtypes.html#".concat(mainTopic, "s");
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
// Test queries for different domains
var testQueries = [
    // React queries
    "How do I use useState hook in React?",
    "What are React components and how do they work?",
    "Explain props in React",
    "How does JSX work in React?",
    // Node.js queries
    "How to read files in Node.js?",
    "Creating an HTTP server in Node",
    "What is the path module in Node.js?",
    "How to use Express.js for routing?",
    // Python queries
    "How to work with lists in Python",
    "Python dictionary examples",
    "Creating classes in Python",
    "Using pandas DataFrame in Python",
    // Mixed or ambiguous queries
    "What's the difference between Node.js and Python?",
    "How to handle events",
    "Best practices for file handling"
];
// Function to test the pipeline
function testQuery(query) {
    console.log("\n-------------------------------------");
    console.log("Query: \"".concat(query, "\""));
    // Step 1: Determine the domain
    var domain = determineDomain(query);
    console.log("Domain: ".concat(domain));
    // Step 2: Extract topics
    var topics = extractTopics(query, domain);
    console.log("Topics: ".concat(topics.length > 0 ? topics.join(', ') : 'None detected'));
    // Step 3: Construct URL
    var specificUrl = constructSpecificUrl(domain, topics);
    console.log("Specific URL: ".concat(specificUrl || 'No specific URL constructed, would use base URL'));
    console.log("-------------------------------------");
}
// Run tests
console.log("===== TESTING MCP SERVER TOPIC EXTRACTION AND URL CONSTRUCTION =====");
testQueries.forEach(function (query) { return testQuery(query); });
console.log("\n===== TESTING COMPLETED =====");
