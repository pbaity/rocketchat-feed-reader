import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';

export class Messenger {
    public static async message(message: IMessage, modify: IModify): Promise<void> {
        if (!message.room) { throw new Error('No Room is available to post Message'); }
        if (!message.sender) { throw new Error('No Sender is available to post Message'); }

        const msg =  modify.getCreator().startMessage(message);
        modify.getCreator().finish(msg);
    }

    public static async notify(message: IMessage, modify: IModify): Promise<void> {
        if (!message.room) { throw new Error('No Room is available to post Notification'); }
        if (!message.sender) { throw new Error('No Sender is available to post Notification'); }

        modify.getNotifier().notifyUser(message.sender, modify.getCreator()
            .startMessage(message)
            .setUsernameAlias('RSS Reader')
            .setAvatarUrl('https://raw.githubusercontent.com/pbaity/rocketchat-feed-reader/master/icon.png')
            .getMessage());
    }
}
