import {
    IAppAccessors,
    ILogger,
    IConfigurationExtend,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { FeedCommand } from './commands/FeedCommand'

export class FeedReaderApp extends App {
    private readonly appLogger: ILogger
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
	this.appLogger = this.getLogger()
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        const feedCommand: FeedCommand = new FeedCommand()
	await configuration.slashCommands.provideSlashCommand(feedCommand)
    }
}
