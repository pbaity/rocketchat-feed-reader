import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { FeedManager } from '../lib/FeedManager';

export class FeedCommand implements ISlashCommand {
    public command: string = 'feed';
    public i18nParamsExample: string = 'help, subscribe, remove, or list';
    public i18nDescription: string = 'Manage RSS/Atom feeds';
    public providesPreview: boolean = false;

    private readonly feedManager: FeedManager;

    constructor(feedManager: FeedManager) {
        this.feedManager = feedManager
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
        const [subcommand, target] = context.getArguments();
        this.feedManager.setProperties(context, read, modify, http, persistence)

        switch (subcommand) {
            case 'list':
                await this.feedManager.list();
                break;
            case 'remove':
                await this.feedManager.remove(target);
                break;
            case 'subscribe':
                await this.feedManager.subscribe(target);
                break;
            default:
                await this.feedManager.help();
                break;
        }
    }
}