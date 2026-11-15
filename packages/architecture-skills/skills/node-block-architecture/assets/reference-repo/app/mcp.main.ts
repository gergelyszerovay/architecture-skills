#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { loadFsToolsConfig } from './load-fs-tools.config.ts';
import { loadLoggingConfig } from './load-logging.config.ts';
import { composeLogger } from './compose-logger.composition.ts';
import { composeFsToolsMcpServer } from './compose-fs-tools-mcp.composition.ts';

/** The fs-tools configuration, including the browsable root directory. */
const config = loadFsToolsConfig();
// stdout carries JSON-RPC, so logs go to stderr
/** The logger for this MCP server, writing audit entries to stderr. */
const log = composeLogger(loadLoggingConfig(), 'stderr', 'fs-tools-mcp');
/** The MCP server exposing the fs-tools use cases over stdio. */
const server = composeFsToolsMcpServer({ log, root: config.root });
await server.connect(new StdioServerTransport());
log.info({ root: config.root }, 'fs-tools MCP server running');
