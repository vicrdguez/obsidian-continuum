import { Plugin } from 'obsidian';
import { ContinuumController } from './continuum-controller';

export default class ContinuumPlugin extends Plugin {
	async onload(): Promise<void> {
		const continuum = await ContinuumController.load(this);
		continuum.register();
	}
}
