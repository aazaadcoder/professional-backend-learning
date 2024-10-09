import mongoose , {Schema} from "mongoose";
import string from "mongoose/lib/cast/string";
import schema from "mongoose/lib/schema";


const tweetSchema = new Schema(
    {
        owner:{
            type: Schema.Types.ObjectId,
            ref : "User"
        },
        content:{
            type: String,
            required: true
        }
    },
    {timestamps: true}
)

export const Tweet = mongoose.model("Tweet", tweetSchema)