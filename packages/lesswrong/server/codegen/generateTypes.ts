import { generateFragmentTypes, generateFragmentsGqlFile } from './generateFragmentTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import { generateSQLSchema } from '../scripts/generateSQLSchema';
import fs from 'fs';
import path from 'path';
import { generateCollectionTypeNames } from './generateCollectionTypeNames';
import { generateInputTypes } from './generateInputTypes';
import { generateDefaultFragmentsFile } from './generateDefaultFragments';
import { typeDefs } from '../vulcan-lib/apollo-server/initGraphQL';
import { print } from 'graphql';

function enumerateFiles(dirPath: string): string[] {
  let fileList: string[] = [];

  // Read the contents of the directory
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // If it's a directory, recursively enumerate its contents
      fileList = fileList.concat(enumerateFiles(fullPath));
    } else if (entry.isFile()) {
      // If it's a file, add it to the list
      fileList.push(fullPath);
    }
    // Note: This ignores symlinks and other special types
  }

  return fileList;
}

function generateAllComponentsVite(): string {
  return `// Generated file - run "yarn generate" to update\n` +
    enumerateFiles("packages/lesswrong/components")
      .filter(f => f.endsWith(".tsx"))
      .map(f => {
        const relativePath = f.replace('packages/lesswrong/components/', '../../components/');
        return `import "${relativePath}"`;
      })
      .join("\n")
      + "\n\n";
}

function generateAllComponents(): string {
  const componentsDir = "packages/lesswrong/components";
  const header = `// Generated file - run "yarn generate" to update
import { importComponent } from '../vulcan-lib/components';

`;

  return header + enumerateFiles(componentsDir)
    .filter(f => f.endsWith(".tsx"))
    .map(f => {
      const relativePath = f.replace('packages/lesswrong/components/', '../../components/');
      const content = fs.readFileSync(f, 'utf-8');
      const components = extractComponentNames(content);
      
      if (components.length === 0) return null;
      
      const componentArg = components.length === 1 
        ? `"${components[0]}"` 
        : `[${components.map(c => `"${c}"`).join(', ')}]`;
      
      return `importComponent(${componentArg}, () => require("${relativePath}"));`;
    })
    .filter(line => line !== null)
    .join("\n")
    + "\n\n";
}

/**
 * `generateAllComponents` only handles components that are registered with `registerComponent`.
 * This function generates a file for components that are not registered, but have a `defineStyles`
 * block that needs to be included in `allStyles`, and so the file needs to be imported somewhere.
 */
function generateNonRegisteredComponentFiles(): string {
  const componentsDir = "packages/lesswrong/components";
  const header = `// Generated file - run "yarn generate" to update

`;

  return header + enumerateFiles(componentsDir)
    .filter(f => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map(f => {
      const relativePath = f.replace('packages/lesswrong/components/', '../../components/');
      const content = fs.readFileSync(f, 'utf-8');
      if (!nonRegisteredComponentFileHasDefineStyles(content) || extractComponentNames(content).length > 0) return null;

      return `import "${relativePath}"`;
    })
    .filter(line => line !== null)
    .join("\n")
    + "\n\n";
}

function nonRegisteredComponentFileHasDefineStyles(content: string): boolean {
  const regex = /defineStyles\s*\(\s*["'](\w+)["']/gm;
  const match = regex.exec(content);
  return match !== null;
}

function extractComponentNames(content: string): string[] {
  const regex = /registerComponent\s*(<\s*\w*\s*>)?\s*\(\s*["'](\w+)["']/gm;
  const components: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    components.push(match[2]);
  }
  
  return components;
}

export function generateTypes(repoRoot?: string) {
  function writeIfChanged(contents: string, path: string) {
    if (repoRoot) {
      const absPath = repoRoot+path;
      let oldFileContents = "";
      try {
        oldFileContents = fs.readFileSync(absPath, 'utf-8');
      } catch {
        // eslint-disable-next-line no-console
        console.warn(`Updating file ${absPath} but it was not found`);
      }
      if (contents !== oldFileContents) {
        fs.writeFileSync(absPath, contents);
      }
    } else {
      // If repoRoot is not provided, it means we were invoked from meteor shell
      // for debugging, and we should output to console.log instead of to files
      // eslint-disable-next-line no-console
      console.log(`======== ${path} ========`);
      // eslint-disable-next-line no-console
      console.log(contents);
    }
  }
  
  try {
    writeIfChanged(generateCollectionTypeNames(), "/packages/lesswrong/lib/generated/collectionTypeNames.ts");

    // We need to perform this abomination because the collectionTypeNames module is generated by generateTypes.ts
    // and if we just import it in the subsequent codegen steps, it will have stale values, since the import will
    // have happened before the contents of the module were updated.
    //
    // Also, we need to explicitly clear the cache before the dynamic require, because `require` could be caching it
    // from it being imported elsewhere (in unrelated code).
    const collectionTypeNamesPath = require.resolve("@/lib/generated/collectionTypeNames");
    require.cache[collectionTypeNamesPath] = undefined;
    const { collectionNameToTypeName, typeNameToCollectionName }: typeof import("@/lib/generated/collectionTypeNames") = require("@/lib/generated/collectionTypeNames");

    writeIfChanged(generateDefaultFragmentsFile(collectionNameToTypeName), "/packages/lesswrong/lib/generated/defaultFragments.ts");
    writeIfChanged(generateInputTypes(), "/packages/lesswrong/lib/generated/inputTypes.d.ts");
    writeIfChanged(generateFragmentTypes(collectionNameToTypeName, typeNameToCollectionName), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeIfChanged(generateFragmentsGqlFile(collectionNameToTypeName), "/packages/lesswrong/lib/generated/fragments.gql");
    writeIfChanged(generateDbTypes(), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeIfChanged(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
    writeIfChanged(generateAllComponentsVite(), "/packages/lesswrong/lib/generated/allComponentsVite.ts");
    writeIfChanged(generateAllComponents(), "/packages/lesswrong/lib/generated/allComponents.ts");
    writeIfChanged(generateNonRegisteredComponentFiles(), "/packages/lesswrong/lib/generated/nonRegisteredComponents.ts");
    //writeIfChanged(generateFragmentsGqlFile(), "/packages/lesswrong/lib/generated/fragments.gql");
    //writeIfChanged(generateGraphQLSchemaFile(), "/packages/lesswrong/lib/generated/gqlSchema.gql");
    writeIfChanged(generateGraphQLAndFragmentsSchemaFile(collectionNameToTypeName), "/packages/lesswrong/lib/generated/gqlSchemaAndFragments.gql");
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

// After running this you still need to run:
//   yarn graphql-codegen --config codegen.yml
export const generateTypesAndSQLSchema = (rootDir?: string) => {
  generateSQLSchema(rootDir);
  generateTypes(rootDir);
}

function generateGraphQLSchemaFile(): string {
  const sb: string[] = [];
  sb.push("# Generated file - run 'yarn generate' to update.\n\n");
  sb.push(print(typeDefs));
  return sb.join("");
}

function generateGraphQLAndFragmentsSchemaFile(collectionNameToTypeName: Record<string,string>): string {
  return generateGraphQLSchemaFile() + generateFragmentsGqlFile(collectionNameToTypeName);
}
