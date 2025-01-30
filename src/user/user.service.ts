import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDTO } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { generateKeyPairSync, privateDecrypt } from 'crypto';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
    //Variables de las claves publicas y privadas ademas de la futura clave desencriptada.
    private privateKey: string;
    private publicKey: string;
    private newpass: any;
    constructor(@InjectModel('User') private readonly userModel: Model<User>){
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    async getUsers(): Promise<User[]>{  //Entrega todos los usuarios
        const Users = await this.userModel.find();
        return Users
    }

    async getUser(Name : string): Promise<User>{    //Entrega un usuario especifico por el nombre
        const user = await this.userModel.findOne({ name: Name});
        return user
    }

    async createUser(createUserDTO: CreateUserDTO): Promise<User>{
        const { nickname, pass } = createUserDTO;
        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(pass, saltRounds);
        const user = new this.userModel({
            name: nickname,
            pass: hashedPassword, // Guardar el hash, no la contraseña en texto plano
            createdAt: new Date(),
        });
        await user.save();
        return user;
    }

    async login(createUserDTO: CreateUserDTO): Promise<User>{
        //Busca la cuenta con el nombre de usuario y desencripta la contraseña para compararlas
        const { nickname, pass } = createUserDTO;
        const user = await this.userModel.findOne({name: nickname});
        //console.log(user);
        //console.log("PRIVATE KEY: ", this.privateKey);
        //console.log("PUBLIC KEY: ", this.publicKey);
        this.newpass =  this.decryptWithPrivateKey(pass);
        if (!user || !(await bcrypt.compare(this.newpass, user.pass))) {
            console.log("Error!!!!, usuario ",nickname," incorrecto");
            throw new UnauthorizedException('Credenciales invalidas');
        }
        console.log('Usuario ',nickname,' logeado.')
        return user
    }
    
    async getPublicKey(): Promise<any> {
        return this.publicKey;
    }

    decryptWithPrivateKey(data: string): string {
        //Desencriptar la contraseña
        try{
            //console.log('PRIVATE KEY SERVICES::: ', this.privateKey);
            const buffer = Buffer.from(data, 'base64');
            const decrypted = privateDecrypt({
                key: this.privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // Esquema OAEP
            }, buffer);
            return decrypted.toString('utf8');
        }catch(error){
            console.log("ERROR: ", error);
        }
    }
}
