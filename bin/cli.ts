#!/usr/bin/env node

/**
 * CLI for generating TypeScript SDK from OpenAPI specifications
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadOpenAPISpec } from '../src/openapi-parser';
import { generateSDK } from '../src/generator';
import { generateHooks } from '../src/hooks-generator';
import { generateMarkdown } from '../src/markdown-generator';
import { generateHTML } from '../src/html-generator';
import { GenerationOptions } from '../src/types';

const program = new Command();

program
  .name('openapi-sdk-generate')
  .description('Generator TypeScript SDK and React hooks from OpenAPI 3 specifications')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate TypeScript SDK, React hooks and documentation')
  .requiredOption('-i, --input <files...>', 'Paths to OpenAPI files (JSON or YAML)', [])
  .requiredOption('-o, --output <dir>', 'Directory for output generated files')
  .option('-b, --base-url <url>', 'Base URL for API (will be used in HTML documentation)')
  .option('-a, --axios-instance <name>', 'Name of axios instance (default: axios)', 'axios')
  .action(async (options) => {
    try {
      const inputFiles: string[] = Array.isArray(options.input) 
        ? options.input 
        : [options.input];
      
      const outputDir = path.resolve(options.output);
      const baseUrl = options.baseUrl || '';
      const axiosInstance = options.axiosInstance || 'axios';
      
      console.log('🚀 Start generating SDK...\n');
      console.log(`📁 Input files: ${inputFiles.join(', ')}`);
      console.log(`📂 Output directory: ${outputDir}\n`);
      
      // Check if input files exist
      for (const file of inputFiles) {
        if (!fs.existsSync(file)) {
          console.error(`❌ Error: file not found: ${file}`);
          process.exit(1);
        }
      }
      
      // Load all specifications
      console.log('📖 Loading OpenAPI specifications...');
      const specs = await Promise.all(
        inputFiles.map(file => loadOpenAPISpec(file))
      );
      
      console.log(`✅ Loaded ${specs.length} specifications\n`);
      
      // Options for generation
      const genOptions: GenerationOptions = {
        inputFiles,
        outputDir,
        baseUrl,
        axiosInstance
      };
      
      // Generate SDK
      console.log('📦 Generating TypeScript SDK...');
      await generateSDK(specs, genOptions);
      console.log('✅ SDK generated\n');
      
      // Generate React hooks
      console.log('⚛️  Generating React hooks...');
      await generateHooks(specs, genOptions);
      console.log('✅ React hooks generated\n');
      
      // Generate Markdown documentation
      console.log('📝 Generating Markdown documentation...');
      await generateMarkdown(specs, genOptions);
      console.log('✅ Markdown documentation generated\n');
      
      // Generate HTML documentation
      console.log('🌐 Generating HTML documentation...');
      await generateHTML(specs, genOptions);
      console.log('✅ HTML documentation generated\n');
      
      console.log('✨ Generation completed successfully!');
      console.log(`\n📂 Results saved in: ${outputDir}`);
      console.log('\n📄 Generated files:');
      console.log('   - sdk.ts - TypeScript SDK');
      console.log('   - hooks.ts - React hooks');
      console.log('   - API.md - Markdown documentation');
      console.log('   - index.html - Interactive HTML documentation');
      console.log('   - package.json - npm package configuration');
      console.log('   - tsconfig.json - TypeScript configuration');
      
    } catch (error) {
      console.error('❌ Error during generation:', error);
      if (error instanceof Error) {
        console.error(error.message);
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Handle case when no command is specified
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);


