## Setup Steps

1. **Configure Turso Database:**

```bash
# Install Turso CLI
curl -sSfL https://get.turso.tech/install.sh | bash

# Login to Turso
turso auth login

# Create a database
turso db create cursor10x-mcp

# Get database URL and token
turso db show cursor10x-mcp --url
turso db tokens create cursor10x-mcp
```

Or you can visit [Turso](https://turso.tech/) and sign up and proceed to create the database and get proper credentials. The free plan will more than cover your project memory.

2. **Configure Cursor MCP:**

Update `.cursor/mcp.json` in your project directory with the database url and turso auth token:

```json
{
  "mcpServers": {
    "cursor10x-mcp": {
      "command": "npx",
      "args": ["cursor10x-mcp"],
      "enabled": true,
      "env": {
        "TURSO_DATABASE_URL": "your-turso-database-url",
        "TURSO_AUTH_TOKEN": "your-turso-auth-token"
      }
    }
  }
}
```

4. **Copy and Paste Cursor Rules:**

Copy and paste the contents of the `.cursorrules` file in your project root and paste it into your cursor settings rules Cursor Settings -> Rules -> User Rules