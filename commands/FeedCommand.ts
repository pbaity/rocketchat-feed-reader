import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { FeedManager } from '../lib/FeedManager';

export class FeedCommand implements ISlashCommand {
    public command: string = 'feed';
    public i18nParamsExample: string = 'help, subscribe, remove, or list';
    public i18nDescription: string = 'Manage RSS/Atom feeds';
    public providesPreview: boolean = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
        const [subcommand, target] = context.getArguments();
        const feedManager: FeedManager = new FeedManager(context, persistence, read, http, modify);

        switch (subcommand) {
            case 'list':
                await feedManager.list();
                break;
            case 'remove':
		await feedManager.remove(target);
                break;
            case 'subscribe':
                await feedManager.subscribe(target);
                break;
            default:
                await feedManager.help();
                break;
        }
    }
}
