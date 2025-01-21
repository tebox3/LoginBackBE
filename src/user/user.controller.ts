import { Controller, Get, Post, Body, Res, Param, HttpStatus, NotFoundException, HttpException } from '@nestjs/common';
import { CreateUserDTO, LoginUserDTO } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private userService: UserService){}

    @Get('/users')
    async getUsers(@Res() res){
        const users = await this.userService.getUsers();
        return res.status(HttpStatus.OK).json({
            users: users
        })
    }

    @Get('/users/:name')
    async getUser(@Res() res, @Param('name') name){
        const user = await this.userService.getUser(name);
        if (!name) throw new NotFoundException('Usuario no existe');
        return res.status(HttpStatus.OK).json(user)
    }

    @Post('/create')
    async createPost(@Res() res, @Body() createUserDTO: CreateUserDTO){
        const user = await this.userService.createUser(createUserDTO)
        return res.status(HttpStatus.OK).json({
            message: 'Usuario creado correctamente',
            user: user
        })
    }

    @Post('/login')
    async loginUser(@Res() res, @Body() createUserDTO: CreateUserDTO){
        try {
            const login = await this.userService.login(createUserDTO);
            console.log(1);
            return res.status(HttpStatus.OK).json({
                message: 'Ingreso correcto.',
                login: login,
            });
        } catch (error) {
            // Manejar error de credenciales inválidas
            console.log(2);
            if (error.status === HttpStatus.UNAUTHORIZED) {
                return res.status(HttpStatus.OK).json({
                    message: 'Usuario incorrecto, intentelo nuevamente.',
                    //login: login,
                })
            }
            console.log(3);
            throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
