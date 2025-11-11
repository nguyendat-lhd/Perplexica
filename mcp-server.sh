#!/bin/bash
# MCP Server Wrapper Script
# This script ensures the MCP server runs from the correct directory

cd "$(dirname "$0")/.." || exit 1
exec npm run mcp:server

