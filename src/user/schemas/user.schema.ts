import  { Schema } from 'mongoose'

export const UserSchema = new Schema({
    name:{ type: String, requiered: true},
    pass:{ type: String, requiered: true},
    createdAt: {
        type: Date,
        default: Date.now
    }
})