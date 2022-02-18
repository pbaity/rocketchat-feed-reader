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
    private readonly read: IRead;
    private readonly persisRead: IPersistenceRead;
    private readonly http: IHttp;

    constructor(appId: string, read: IRead, http: IHttp) {
        this.appId = appId
        this.read = read;
        this.persisRead = read.getPersistenceReader();
        this.http = http;
    }

    public async subscribe(url: string, context: SlashCommandContext, modify: IModify, persis: IPersistence): Promise<void> {
        const message: IMessage = {
            room: context.getSender(),
            sender: context.getSender(),
            groupable: false,
        };

        try {
            const feed: IFeed = await FeedReader.getFeedInfo(url, this.http, context.getRoom());
            await FeedStore.add(persis, message.room, feed);
            message.text = `Subscribed to feed ${feed.title} at ${feed.link}.`;
        } catch (err) {
            message.text = `Failed to subscribe to feed at ${url}.`;
            console.error(err);
        }

        Messenger.notify(message, modify);
    }

    public async list(context: SlashCommandContext, modify: IModify): Promise<void> {
        const message: IMessage = {
            room: context.getSender(),
            text: '',
            sender: context.getSender(),
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

        Messenger.notify(message, modify);
    }

    public async remove(uuid: string, context: SlashCommandContext, modify: IModify, persis: IPersistence): Promise<void> {
        const message: IMessage = {
            room: context.getSender(),
            sender: context.getSender(),
            groupable: false,
        };

        try {
            await FeedStore.remove(persis, message.room, uuid);
            message.text = `Removed feed with ID ${uuid}.`;
        } catch (err) {
            console.error(err);
            message.text = `Failed to remove feed with ID ${uuid}.`;
        }

        Messenger.notify(message, modify);
    }

    public help(context: SlashCommandContext, modify: IModify): void {
        const text = `Commands: subscribe, remove, list, help
                     To subscribe to a feed in this channel: \`/feed subscribe <url>\`
                     To list subscribed feeds in this channel: \`/feed list\`
                     To remove a feed from this channel: \`/feed remove <ID>\``;

        const message: IMessage = {
            room: context.getSender(),
            sender: context.getSender(),
            text,
            groupable: false,
        };

        Messenger.notify(message, modify);
    }

    public async readFeeds(persis: IPersistence, modify: IModify): Promise<void> {
        const feeds: Array<IFeed> = await FeedStore.getAllFeeds(this.persisRead);
        if (feeds.length) {
            for (const feed of feeds) {
                const messages: Array<IMessage> = [];
                const newItems: Array<IFeedItem> = await FeedReader.getNewFeedItems(feed, this.http);

                if (newItems.length) {
                    feed.lastItemLink = newItems[0].link;
                    FeedStore.update(persis, feed);
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
                        Messenger.message(message, modify);
                    }
                }
            }
        }
        else {
            console.log('No feeds to read');
        }
    }
}
