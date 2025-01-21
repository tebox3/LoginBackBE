import { Document } from "mongoose";
 
export interface User extends Document{
    readonly nickname: string;
    readonly pass: string;
    readonly createdAt: Date
}

export interface Login extends Document{
    readonly nickname: string;
    readonly pass: string;
}