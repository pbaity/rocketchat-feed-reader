import { IHttp, IModify, IPersistence, IPersistenceRead, IRead, IUserRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { FeedReader } from './FeedReader';
import { FeedStore } from './FeedStore';
import { IFeed } from './IFeed';
import { IFeedItem } from './IFeedItem';
import { Messenger } from './Messenger';

export class FeedManager {
    private context: SlashCommandContext;
    private persis: IPersistence;
    private persisRead: IPersistenceRead;
    private http: IHttp;
    private modify: IModify;
    private user: IUser;
    private room: IRoom;

    constructor(context: SlashCommandContext, persis: IPersistence, read: IRead, http: IHttp, modify: IModify) {
        this.context = context;
        this.persis = persis;
        this.persisRead = read.getPersistenceReader();
        this.http = http;
        this.modify = modify;
        this.user = this.context.getSender();
        this.room = this.context.getRoom();
    }

    public async subscribe(url: string): Promise<void> {
        const message: IMessage = {
            room: this.room,
            sender: this.user,
            groupable: false,
        };

        try {
            const feed: IFeed = await FeedReader.getFeedInfo(url, this.http, this.context.getRoom());
            await FeedStore.add(this.persis, message.room, feed);
            message.text = `Subscribed to feed ${feed.title} at ${feed.link}.`;
        } catch (err) {
            message.text = `Failed to subscribe to feed at ${url}.`;
            console.error(err);
        }

        Messenger.notify(message, this.modify);
    }

    public async list(): Promise<void> {
        const message: IMessage = {
            room: this.room,
            text: '',
            sender: this.user,
            groupable: false,
        };

        const feeds: Array<IFeed> = await FeedStore.getRoomFeeds(message.room, this.persisRead);

        if (feeds.length) {
            for (const feed of feeds) {
                message.text += `${feed.uuid}: ${feed.title} - ${feed.link}\n`;
            }
        } else {
            message.text = 'You have no feeds. Use `/feed subscribe <url>` to add one.';
        }

        Messenger.notify(message, this.modify);
    }

    public async remove(uuid: string): Promise<void> {
        const message: IMessage = {
            room: this.room,
            sender: this.user,
            groupable: false,
        };

        try {
            await FeedStore.remove(this.persis, message.room, uuid);
            message.text = `Removed feed with ID ${uuid}.`;
        } catch (err) {
            console.error(err);
            message.text = `Failed to remove feed with ID ${uuid}.`;
        }

        Messenger.notify(message, this.modify);
    }

    public help(): void {
        const text = `Commands: subscribe, remove, list, help
                     To subscribe to a feed in this channel: \`/feed subscribe <url>\`
                     To list subscribed feeds in this channel: \`/feed list\`
                     To remove a feed from this channel: \`/feed remove <ID>\``;

        const message: IMessage = {
            room: this.room,
            sender: this.user,
            text,
            groupable: false,
        };

        Messenger.notify(message, this.modify);
    }
}
