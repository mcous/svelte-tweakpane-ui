import fs from 'fs';
import path from 'path';

import { getExportedComponents } from './ast-tools';
import { getComponentInfo, ComponentDynamicPropTest } from './component-info';

// figures out prop data from src components
// and writes out a json file for each

// would rather do this in docs/+page.server.ts, but can't get the svelte-language-server modules to load there

async function generateComponentData(
	componentName: string,
	componentPath: string,
	destination: string,
	testProps?: ComponentDynamicPropTest[] | undefined
): Promise<boolean> {
	const unaliasedPath = componentPath.replace('$lib', './src/lib');

	const componentInfo = await getComponentInfo(unaliasedPath, testProps);

	if (componentInfo) {
		// overwrites existing, creates intermediate directories
		const resolvedPath = path.resolve(`${destination}/${componentName}.json`);
		fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
		fs.writeFileSync(resolvedPath, JSON.stringify(componentInfo, null, 2));
		return true;
	} else {
		return false;
	}
}

// main
let totalComponentsGenerated = 0;

const components = getExportedComponents('./src/lib/index.ts');
const destination = './src/lib-docs/generated/data';

console.log(`Generating documentation data for ${components.length} components...`);

if (fs.existsSync(destination)) {
	console.log(`Removing existing component documentation data at "${destination}"...`);
	fs.rmSync(destination, { recursive: true });
}

for (const { name, path } of components) {
	// TODO this is not pretty
	// Pass custom dynamic prop test cases to certain components
	let testProps: ComponentDynamicPropTest[] | undefined = undefined;

	if (name === 'Pane') {
		testProps = [
			{
				description: "`position='draggable'`",
				condition: {
					position: 'draggable'
				}
			},
			{
				description: "`position='inline'`",
				condition: {
					position: 'inline'
				}
			},
			{
				description: "`position='fixed'`",
				condition: {
					position: 'fixed'
				}
			}
		];
	}

	if (name === 'Monitor') {
		testProps = [
			{
				description: "`typeof value === 'number'`",
				condition: {
					value: 1
				}
			},
			{
				description: "`typeof value === 'boolean'`",
				condition: {
					value: false
				}
			},
			{
				description: "`typeof value === 'string'`",
				condition: {
					value: 'i am a string'
				}
			}
		];
	}

	const success = await generateComponentData(name, path, destination, testProps);

	if (success) {
		totalComponentsGenerated++;
	} else {
		console.warn(`Issue generating component data for "${name}.svelte"`);
	}
}

console.log(
	`Done. Created ${totalComponentsGenerated} component documentation data files in "${destination}" .`
);
