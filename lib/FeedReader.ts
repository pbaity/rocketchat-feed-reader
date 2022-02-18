import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IFeed } from './IFeed';
import { IFeedItem } from './IFeedItem';

export class FeedReader {
    public static async getFeedInfo(url: string, http: IHttp, room: IRoom): Promise<IFeed> {
        try {
            const response = await http.get(url);
            return this.parseChannelDetails(response.content!, room);
        } catch (err) {
            throw new Error('Could not get feed info: ' + err);
        }
    }

    public static async getNewFeedItems(feed: IFeed, http: IHttp): Promise<Array<IFeedItem>> {
        try {
            const response = await http.get(feed.link);
            const feedItems = this.parseFeedItems(response.content!);
            const lastItemIndex = feedItems.findIndex((item) => item.link === feed.lastItemLink);
            return feedItems.slice(0, lastItemIndex);
        } catch (err) {
            throw new Error('Could not get feed items: ' + err);
        }
    }

    private static parseChannelDetails(xml: string, room: IRoom): IFeed {
        const titleReg = xml.match(/<channel>.*?<title>(.*?)<\/title>/ms);
        const linkReg = xml.match(/<channel>.*?<link>(.*?)<\/link>/ms);
        const descReg = xml.match(/<channel>.*?<description>(.*?)<\/description>/ms);
        const lastItemLinkReg = xml.match(/<channel>.*?<item>.*?<link>(.*?)<\/link>.*?<\/item>/ms);

        const title = titleReg && titleReg.length > 1 ? titleReg[1] : undefined;
        const link = linkReg && linkReg.length > 1 ? linkReg[1] : undefined;
        const description = descReg && descReg.length > 1 ? descReg[1] : undefined;
        const lastItemLink = lastItemLinkReg && lastItemLinkReg.length > 1 ? lastItemLinkReg[1] : undefined;

        if (title && link && description) {
            return {
                title,
                link,
                description,
                lastItemLink,
                room,
            };
        } else {
            throw new Error('Failed to read RSS channel details.');
        }
    }

    private static parseFeedItems(xml: string): Array<IFeedItem> {
        const items: Array<IFeedItem> = [];
        const itemReg = xml.match(/<item>(.*?)<\/item>/gms);

        if (!itemReg) {
            throw new Error('Could not parse feed items.');
        }

        for (const itemMatch of itemReg) {
            const itemDetails = itemMatch.length > 1 ? itemMatch[1] : undefined;
            if (itemDetails) {
                const item = this.parseItemDetails(itemDetails);
                items.push(item);
            }
        }

        return items;
    }

    private static parseItemDetails(itemXml: string): IFeedItem {
        const titleReg = itemXml.match(/<title>(.*?)<\/title>/ms);
        const linkReg = itemXml.match(/<link>(.*?)<\/link>/ms);
        const descReg = itemXml.match(/<description>(.*?)<\/description>/ms);
        const pubDateReg = itemXml.match(/<pubDate>(.*?)<\/pubDate>/ms);

        const title = titleReg && titleReg.length > 1 ? titleReg[1] : undefined;
        const link = linkReg && linkReg.length > 1 ? linkReg[1] : undefined;
        const description = descReg && descReg.length > 1 ? descReg[1] : undefined;
        const pubDate = pubDateReg && pubDateReg.length > 1 ? new Date(pubDateReg[1]) : undefined;

        if (title && link && description) {
            return {
                title,
                link,
                description,
                pubDate,
            };
        } else {
            throw new Error('Failed to read channel item details.');
        }
    }
}
