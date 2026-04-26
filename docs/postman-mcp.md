# Postman Route MCP

This project includes an MCP server that reads the API route registry and can export or sync a Postman collection.

## Run the MCP server

From the repository root:

```bash
npm --silent --prefix aforce-api run mcp:postman-routes
```

The root `.mcp.json` registers this command as `aforce-postman-routes` for MCP clients that support project configs.

## Available MCP tools

- `list_api_routes`: returns the registered Express routes.
- `export_postman_collection`: writes a Postman v2.1 collection JSON file.
- `sync_postman_collection`: writes the collection locally and creates or updates it in Postman.

## Sync to Postman

Set these environment variables before running the sync command or before starting the MCP server:

```bash
POSTMAN_API_KEY=your-api-key
POSTMAN_COLLECTION_UID=existing-collection-uid
POSTMAN_WORKSPACE_ID=workspace-id-for-new-collections
POSTMAN_COLLECTION_NAME=AForce API
```

`POSTMAN_COLLECTION_UID` is optional. If it is missing and `POSTMAN_API_KEY` is present, the sync creates a new collection. If no API key is set, it only exports locally.

You can also run the same sync without MCP:

```bash
npm --prefix aforce-api run postman:sync
```

For continuous local export while editing routes:

```bash
npm --prefix aforce-api run postman:watch
```
