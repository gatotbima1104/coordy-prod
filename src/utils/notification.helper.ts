import apn from "apn";
import { APPLE_CLIENT_ID } from "../configs/config";
import { apnProvider } from "../configs/apn.config";

export async function sendPushNotification(deviceToken: string, title: string, body: string) {
    try {

        const notification = new apn.Notification();
        notification.alert = {title, body}
        notification.sound = "default"
        notification.topic = APPLE_CLIENT_ID
        // notification. = "alert"

        const result = await apnProvider.send(notification, deviceToken)
        console.log("APNs result:", result);
    } catch (error) {
        console.log(error)
    }
    
}