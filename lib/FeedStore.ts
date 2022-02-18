import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IFeed } from './IFeed';

export class FeedStore {
    public static async add(persis: IPersistence, room: IRoom, feed: IFeed): Promise<boolean> {
        feed.uuid = this.assignUuid();
        feed.room = room;

        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'feed'),
            new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, feed.link),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, feed.uuid),
        ];

        try {
            await persis.createWithAssociations(feed, associations);
        } catch (err) {
            console.warn(err);
            return false;
        }

        return true;
    }

    public static async update(persis: IPersistence, feed: IFeed): Promise<boolean> {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'feed'),
            new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, feed.room.id),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, feed.link),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, feed.uuid!),
        ];

        try {
            await persis.updateByAssociations(associations, feed, false);
        } catch (err) {
            console.warn(err);
            return false;
        }

        return true;
    }

    public static async getRoomFeeds(room: IRoom, persis: IPersistenceRead): Promise<Array<IFeed>> {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'feed'),
            new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id),
        ];

        const feeds: Array<IFeed> = [];

        try {
            const records: Array<IFeed> = (await persis.readByAssociations(associations)) as Array<IFeed>;

            if (records.length) {
                feeds.push.apply(feeds, records);
            }
        } catch (err) {
            console.warn(err);
        }

        return feeds;
    }

    public static async getAllFeeds(persis: IPersistenceRead): Promise<Array<IFeed>> {
        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'feed');
        const feeds: Array<IFeed> = [];

        try {
            const records: Array<IFeed> = (await persis.readByAssociation(association)) as Array<IFeed>;

            if (records.length) {
                feeds.push.apply(feeds, records);
            }
        } catch (err) {
            console.warn(err);
        }

        return feeds;
    }

    public static async remove(persis: IPersistence, room: IRoom, uuid: string): Promise<boolean> {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'feed'),
            new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid),
        ];

        try {
            await persis.removeByAssociations(associations);
        } catch (err) {
            console.warn(err);
            return false;
        }

        return true;
    }

    private static assignUuid(): string {
        return (Math.ceil(Math.random() * Math.pow(10, 12)) + Math.pow(10, 12)).toString();
    }
}
