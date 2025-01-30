import { Controller, Get, Post, Body, Res, Param, HttpStatus, NotFoundException, HttpException } from '@nestjs/common';
import { CreateUserDTO, LoginUserDTO } from './dto/user.dto';
import { UserService } from './user.service';

//Endpoints relacionados al login
@Controller('user')
export class UserController {
    constructor(private userService: UserService){}

    @Get('/users')//Entrega todos los usuarios
    async getUsers(@Res() res){
        const users = await this.userService.getUsers();
        return res.status(HttpStatus.OK).json({
            users: users
        })
    }

    @Get('/users/:name') //Entrega usuario por nombre
    async getUser(@Res() res, @Param('name') name: string) {
        const user = await this.userService.getUser(name);
        //console.log("NOMBRE: ",name);
        //console.log("RESPUESTA SERVICE: ", user);
        console.log("SSSSSSSSSSSSSSSSSSSSS");

        if (!user) {
            console.log("SSSSSSSSSSSSSSSSSSSSS");
            throw new NotFoundException(`Usuario con nombre "${name}" no existe`);
        }
        //console.log("se enviara esta respuesta: ", res.status(HttpStatus.OK).json(user));
        return res.status(HttpStatus.OK).json(user);
    }


    @Get('/public-key')  //Entrega la clave publica
    async getPublicKey(@Res() res) {
        console.log(" Ingreso a public key.");
        //el await es necesario, de lo contrario no lo envia
        return res.status(HttpStatus.OK).json({ publicKey: await this.userService.getPublicKey()});
    }

    @Post('/create')  //Crea un usuario
    async createPost(@Res() res, @Body() createUserDTO: CreateUserDTO){
        const user = await this.userService.createUser(createUserDTO)
        return res.status(HttpStatus.OK).json({
            message: 'Usuario creado correctamente',
            user: user
        })
    }

    @Post('/login')  //Ingresar
    async loginUser(@Res() res, @Body() createUserDTO: CreateUserDTO){
        try {
            const login = await this.userService.login(createUserDTO);
            return res.status(HttpStatus.OK).json({
                message: 'Ingreso del usuario '+createUserDTO.nickname+' correcto',
                session: true
            });
        } catch (error) {
            // Manejar error de credenciales inválidas
            if (error.status === HttpStatus.UNAUTHORIZED || HttpStatus.INTERNAL_SERVER_ERROR) {
                return res.status(HttpStatus.OK).json({
                    message: 'Usuario incorrecto, intentelo nuevamente.',
                    session: false
                })
            }
        }
    }
}
