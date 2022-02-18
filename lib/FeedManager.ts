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
    private readonly appId: string;
    private context: SlashCommandContext;
    private read: IRead;
    private persisRead: IPersistenceRead;
    private persis: IPersistence;
    private http: IHttp;
    private modify: IModify;

    constructor(appId: string) {
        this.appId = appId
    }

    public setProperties(context: SlashCommandContext, read: IRead, http: IHttp, modify: IModify, persis: IPersistence) {
        this.context = context
        this.read = read
        this.persisRead = read.getPersistenceReader()
        this.persis = persis
        this.http = http
        this.modify = modify
    }

    public async subscribe(url: string): Promise<void> {
        const message: IMessage = {
            room: this.context.getSender(),
            sender: this.context.getSender(),
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
            room: this.context.getSender(),
            text: '',
            sender: this.context.getSender(),
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
            room: this.context.getSender(),
            sender: this.context.getSender(),
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
            room: this.context.getSender(),
            sender: this.context.getSender(),
            text,
            groupable: false,
        };

        Messenger.notify(message, this.modify);
    }

    public async readFeeds(): Promise<void> {
        const feeds: Array<IFeed> = await FeedStore.getAllFeeds(this.persisRead);
        if (feeds.length) {
            for (const feed of feeds) {
                const messages: Array<IMessage> = [];
                const newItems: Array<IFeedItem> = await FeedReader.getNewFeedItems(feed, this.http);

                if (newItems.length) {
                    feed.lastItemLink = newItems[0].link;
                    FeedStore.update(this.persis, feed);
                    for (const item of newItems) {
                        messages.push({
                            room: feed.room,
                            sender: this.read.getUserReader().getAppUser(this.appId),
                            groupable: false,
                            text: `${item.title}\n${item.link}`,
                        });
                    }
                }
                if (messages.length) {
                    for (const message of messages) {
                        Messenger.message(message, this.modify);
                    }
                }
            }
        }
        else {
            console.log('No feeds to read');
        }
    }
}
