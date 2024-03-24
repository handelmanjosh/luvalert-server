import mongoose from 'mongoose';
import * as WebSocket from 'ws';
const MONGO_URI = "mongodb+srv://admin:blQ2nS4S4ygeSqXL@luvalert.iljuktd.mongodb.net/"
import * as url from 'url';
import { create_mongodb, get_mongodb, update } from './db';

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("successfully connected to mongodb");
    } catch (e) {
        console.error(e);
        console.error("failed to connect to mongodb database");
        return;
    }
    const userSchema = new mongoose.Schema({
        id: String,
        username: String,
        crushes: [String],
        crushees: [String],
        hasPremium: Boolean,
        location: [Number]
    });
    
    const User = mongoose.model("User", userSchema);
    wss.on('connection', async (ws, req) => {
        console.log("connected");
        const queryObject = url.parse(req.url || '', true).query;
        const username = queryObject.username;
        let user: any = await get_mongodb(User, { username });
        if (!user) {
            user = await create_mongodb(User, {
                id: (Math.random() * 1000000).toString(),
                username,
                crushes: [],
                crushees: [],
                hasPremium: false,
                location: [0, 0]
            })
        }
        ws.on('message', async (json) => {
            console.log("message recieved");
            const data = JSON.parse(json.toString());
            console.log(data);
            switch(data.type) {
                case "CrushModify": {
                    const u: any = await get_mongodb(User, { username })
                    // not updating crushees because we might not need it
                    if (u.crushes.includes(data.name)) {
                        await update(User, { username }, { $pull: { crushes: data.name } },)
                    } else {
                        await update(User, { username }, { $addToSet: { crushes: data.name }});
                    }
                    console.log(data.name, data.status);
                    break;
                }
                case "PositionUpdate": {
                    const u: any = await get_mongodb(User, { username });
                    if (u) {
                        await update(User, { username }, { $set: { location: [Number(data.latitude), Number(data.longitude)] } });
                        console.log(`Position updated to ${data.latitude}, ${data.longitude}`);
                    }

                    break;
                }
                default:
                    console.error("Unsupported type")
                    break;
            }
        })
        ws.on('close', () => {
            console.log("Client disconnected");
        });
        console.log(user);
        ws.send(JSON.stringify({crushes: user.crushes, crushees: user.crushees, hasPremium: user.hasPremium, type: "UserData"}));
    })
}

main();