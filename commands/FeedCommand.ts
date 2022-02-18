import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { FeedReaderApp } from '../FeedReaderApp';
import { FeedManager } from '../lib/FeedManager';

export class FeedCommand implements ISlashCommand {
    public command: string = 'feed';
    public i18nParamsExample: string = 'help, subscribe, remove, or list';
    public i18nDescription: string = 'Manage RSS/Atom feeds';
    public providesPreview: boolean = false;

    private readonly app: FeedReaderApp;

    constructor(app: FeedReaderApp) {
        this.app = app
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
        const [subcommand, target] = context.getArguments();

        switch (subcommand) {
            case 'list':
                await this.app.feedManager.list(context, modify);
                break;
            case 'remove':
                await this.app.feedManager.remove(target, context, modify, persistence);
                break;
            case 'subscribe':
                await this.app.feedManager.subscribe(target, context, modify, persistence);
                break;
            default:
                await this.app.feedManager.help(context, modify);
                break;
        }
    }
}