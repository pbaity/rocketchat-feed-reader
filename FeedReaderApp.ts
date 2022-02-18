import {
    IAppAccessors,
    ILogger,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';
import { FeedCommand } from './commands/FeedCommand'
import { FeedManager } from './lib/FeedManager'

export class FeedReaderApp extends App {
    public readonly feedManager: FeedManager

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        this.feedManager = new FeedManager(info.id)
    }

    public async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        // configuration.scheduler.registerProcessors([
        //     {
        //         id: 'feed-reader',
        //         processor: async () => this.feedManager.readFeeds(),
        //         startupSetting: {
        //           type: StartupType.RECURRING,
        //           interval: '60 seconds',
        //         }
        //     },
        // ]);

        const feedCommand: FeedCommand = new FeedCommand(this.feedManager)
        await configuration.slashCommands.provideSlashCommand(feedCommand)
    }
}
