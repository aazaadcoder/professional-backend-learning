import mongoose , {mongo, Schema} from "mongoose"


const subscriptionSchema = Schema({
    
    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User"                                 //no need for import
    },

    channel:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },


},{Timestamp:true}
)


export const Subscription = mongoose.model("Subscription", subscriptionSchema)