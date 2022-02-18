import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

export interface IFeed {
    uuid?: string;
    title: string;
    link: string;
    description: string;
    lastItemLink?: string;
    room: IRoom;
}
