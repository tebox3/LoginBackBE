import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Login, User } from './interfaces/user.interface';
import { CreateUserDTO, LoginUserDTO } from './dto/user.dto';
import { StringDecoder } from 'string_decoder';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(@InjectModel('User') private readonly userModel: Model<User>){}

    async getUsers(): Promise<User[]>{
        const Users = await this.userModel.find();
        return Users
    }

    async getUser(Name : string): Promise<User>{
        const user = await this.userModel.findOne({ name: Name});
        return user
    }

    async createUser(createUserDTO: CreateUserDTO): Promise<User>{
        const user = new this.userModel(createUserDTO);
        await user.save()
        return user
    }

    async login(createUserDTO: CreateUserDTO): Promise<User>{
        const { nickname, pass } = createUserDTO;
        const user = await this.userModel.findOne({name: nickname}).exec();
        if (!user || !(await this.validatePassword(pass, user.pass))) {
            console.log("Error!!!!, usuario ",nickname," incorrecto");
            throw new UnauthorizedException('Credenciales invalidas');
        }
        console.log('Usuario ',nickname,' logeado.')
        return user
    }

    private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        if (plainPassword==hashedPassword){
            return true;
        }
        return false;
        //return bcrypt.compare(plainPassword, hashedPassword); // Asegúrate de usar bcrypt o similar para gestionar contraseñas
    }
}
