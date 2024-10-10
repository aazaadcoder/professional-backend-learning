import mongoose , {mongo, Schema} from "mongoose"


const subscriptionSchema = Schema({
    
    channel:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User"                                 //no need for import
    },
    

    


},{Timestamp:true}
)


export const Subscription = mongoose.model("Subscription", subscriptionSchema)