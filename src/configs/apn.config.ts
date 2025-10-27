import apn from "apn";
import { APN_DEVELOPER_TEAM_ID, APN_KEY_ID, APN_KEY_SHARED } from "./config";

let options = {
    token: {
        key: APN_KEY_SHARED,
        keyId: APN_KEY_ID,
        teamId: APN_DEVELOPER_TEAM_ID
    },
    production: false
}

export const apnProvider = new apn.Provider(options)