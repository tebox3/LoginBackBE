import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { AnyArray, Model } from 'mongoose';
import { UserModule } from './user.module';
import { HttpStatus, NotFoundException, Res, HttpException,UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO, LoginUserDTO } from './dto/user.dto';
import { User } from './interfaces/user.interface';
import * as crypto from 'crypto';
import { generateKeyPairSync, privateDecrypt } from 'crypto';
import { Response } from 'express';


jest.mock('./user.service');

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  let res: Response;
  const mockUserModel = {
    findOne: jest.fn((query) => {
      if (query.name === 'francisco') {
        return Promise.resolve({
          _id: '678f0cdb7fc6c2d2acce0356',
          name: 'francisco',
          pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
          createdAt: '2025-01-21T02:56:27.469Z',
        });
      }
      return Promise.resolve(null);
    }),
    /* find: jest.fn(() => {
      return Promise.resolve([{
        _id: '678f0cdb7fc6c2d2acce0356',
        name: 'francisco',
        pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
        createdAt: '2025-01-21T02:56:27.469Z',
      },{
        _id: '642ec3cdb7fc6c2d2acce0356',
        name: 'diego',
        pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.465trffcrv/PfTMfke',
        createdAt: '2025-01-22T02:06:27.469Z',
      }])
    }) */
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      //imports: [UserModule],
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: 'UserModel',
          useValue: mockUserModel,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('Debe retornar la lista de todos los usuarios. ', async () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUsers = [{
      _id: '678f0cdb7fc6c2d2acce0356',
      name: 'francisco',
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
      createdAt: '2025-01-21T02:56:27.469Z',
    },{
      _id: '642ec3cdb7fc6c2d2acce0356',
      name: 'diego',
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.465trffcrv/PfTMfke',
      createdAt: '2025-01-22T02:06:27.469Z',
    }] as unknown as User[];
    
    jest.spyOn(service, 'getUsers').mockResolvedValue(mockUsers);
    const users = await controller.getUsers(mockResponse);
  });

  it('Debe retornar al usuario francisco', async () => {
    //Prueba Get para /users/:name
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockUser = {
      "_id": "678f0cdb7fc6c2d2acce0356",
    "name": "francisco",
    "pass": "$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke",
    "createdAt": "2025-01-21T02:56:27.469Z",
    } as unknown as User

    jest.spyOn(service, 'getUser').mockResolvedValue(mockUser);

    const usuario = await controller.getUser(mockResponse as any, 'francisco');

    expect(mockResponse.status).toHaveBeenCalledWith(200);

    expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
 });


 it('Debe retornar NotFoundException al no encontrar al usuario indicado', async () => {
  //Prueba Get para /users/:name
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockUser = {
    "_id": "678f0cdb7fc6c2d2acce0356",
  "name": "francisco",
  "pass": "$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke",
  "createdAt": "2025-01-21T02:56:27.469Z",
  } as unknown as User

  jest.spyOn(service, 'getUser').mockResolvedValue(null);

  //const usuario = await controller.getUser(mockResponse as any, 'francisco');

  await expect(controller.getUser(mockResponse, 'pancho')).rejects.toThrow(NotFoundException);
  
  //expect(mockResponse.status).toHaveBeenCalledWith(404);

  //expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
});
  it('Debe retornar mensaje de bienvenida y booleano session true', async () => {
    const mockDTO: LoginUserDTO = {
      nickname: 'francisco', // Define un nickname válido
      pass: 'rPHCarW5v8VNlq4gqJbD8MxYfMOGiEUkmH7sxIJr9R/grQV4hZ8Mvt2TH5M5eN/e4nGmI0pRrH2nqVqYZ+RomkGlQiqIrq6B0HoWaB+L5kSVilv/U3v4c4xoXtE/5i7RzZAPFdmMnj3vTfJ6ebQUxPOX9kQHXiAC88z4YcHjdKSQrXycTpco9lqDrY23u4oS9n+0MP81IZJfs4GCwIh3/WJl3h5ZxeQDepi+hUJOyy7QIBsbnPf30rAFbbFYX7Osrl3C/5y2MOXE6SSNh3tG1ocsRHuyDifeYLOqepSUNGhxPSfrMW6Qc014P7ndDeGleCnB5uNMrVmZyCbCdGw1Gw==',   
      //pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke'
      // Define una contraseña válida
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };


    const mockUser = {
      _id: '678f0cdb7fc6c2d2acce0356',
      name: 'francisco',
      //pass: await bcrypt.hash('123', 10), // Simula una contraseña encriptada
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
      createdAt: '2025-01-21T02:56:27.469Z',
      __v: 0,
    };

    //const privateKey = '-----BEGIN PRIVATE KEY----- MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZXMo4TPA1wEyi 2p8EQBhpmfuGHNbvw5aF4FCoQkfSbJbB9vYqxseU1PEC//6HeJmNWcrtRlNdmWic t6xiupZ9xt4r0rJO9qbiEHiJYNuj8UJM6nIM5wM9zNyV5XABzX0l5ZXLPPMbaazN ifFKx+ILQg4NJWYGfWotv538evVYUrgjUze08PMkO/VsxsYNGuhWck97OJs9oSjR HIFlRs8g6IdvY6EYFzsEGKSZygwzwLsiQBOYpz6sPhS/RjifyOd6YygFN3OogMny r9s3w/TNl00gD7RgaFW6ofTHn94AQJqDsAIbzW5f+shVo4hErEX9WqxvfDdYndDq BwDxkoT7AgMBAAECggEAPB2fKhoRV3RjXakkUKsfdVlqiKmCQpawEz+6XwbR0V9K BMQ2ShdnDIEmVSOS9EnFAiSC7MPF+72ZgrqD2VxskcXGHY2s1gz+k8hlZe1dYcaw hRBUUcA0k8uMeIKXy0/XXHtWRfsJ65t6+O+9RebpXB69PyKISKQ4EQYNfk5Ne8sG bPXOtuTvtzAT1h5yDOt+2GJgKWMUonX2dy6yHXwQgRLYAxlW1jQkH+51aCBlFoKz Fi0wV7HEbkySlHEE8P6mWNf2hVo3hJnkvFSA2VdX7GZiZJtx6OBJndRtcrKez1BU qH6js+3nURdOBbqyu/5yTuSyPOx0iaXqHwxBpp0YzQKBgQDyjkjh+i6rIK886TBS LHzYK92XQJY462Vz5+1zR8OhJm3dtk76pNbhlLuKYTLvPu+HmhHG3glysnRRhCw3 ceYAgEXN7ya57GN/TD6zFQQvMY0oNEMYecXh6qXe3YBzCh5lfOJ7IKdVhCEbcyLT yaE3vGnExbdPuIAamGqoomu6TQKBgQDlaQcI1kUUbNS+lZ6n+YnDeeAnaFBsdFVp tsfrWN1sZ0iZowdN3Y3XezvHnCwt3u95Y8eyjkfICMX8eWZonxKg7iz7U1SvC7P3 T1D5KY+kOYA+LKo0C2G8y5WkYtZiQU4nUJv+FB471+h2F1nHzJkktKSJNXqCLFDt m1MEykzQZwKBgCj0sYXGsr6ehDhqv4gAjwwJTB9P/o2Z4cWScdu3UGcTkBWRxQA5 eTcZ4BjblLglDlj9QOctcrb1PwLMqJKsHsQS5LaDHSzjp2FFRIkEkXJOkaEqQfIO DcW500wwZpIGMV+9mJhlyRt9dgGmjUjpkNlSbSGWqP9DDg5vkgLrefk5AoGAMCm3 p1xMznf2xjhlQcC68oYg0EUvNUXLNNGB8WALxJl+fXrjqq5L/CRMLaEVCWBXiHWx VERYv59P6ayXGnnjEFRQr0cUbVeYpeBKELVwCbtkuCjqZtjI4Tkgpo11ktVBEjHz Pgl9O3UdwcUvPSowMKuYK5JFsRSavPeyGzxZmhsCgYBLmTOmj00QufDQvWufwe0I g+hV2+wHkPw9iaJzYU6utnxMvolvVmSuhwdw3Wb+4ri+ivfahfq1lMVKbuh2QeWM Xqk1j3u1fsGbdQTaGndauCzhefDssy5o/X3qCDUHKn7omfDemxiGVx8e6fplMJdc 0sy4gmTYGOlRzjVAQKvB3g== -----END PRIVATE KEY-----'
    jest.spyOn(service, 'decryptWithPrivateKey').mockReturnValue('1234');

    service.login = jest.fn().mockImplementation(async (createUserDTO: CreateUserDTO) => {
      const { nickname, pass } = createUserDTO;
      const user = await mockUserModel.findOne({name: nickname});
      const newpass =  service.decryptWithPrivateKey(pass);
      if (!user || !(await bcrypt.compare(newpass, user.pass))) {
          console.log("Error!!!!, usuario ",nickname," incorrecto");
          throw new UnauthorizedException('Credenciales invalidas');
      }
      console.log('Usuario ',nickname,' logeado.')
      return user
    });

    //jest.spyOn(service, 'login').mockResolvedValue(mockUser as any);

    await controller.loginUser(mockResponse as any, mockDTO as any);

    const responseArgs = mockResponse.json.mock.calls[0]; // Obtiene el primer (y único) argumento de la llamada a `json`
    console.log("Respuesta recibida: ", responseArgs[0]);

    // Verifica que el usuario es el esperado
    expect(responseArgs[0].session).toEqual(true);

    // Verifica que el mock de json fue llamado
    //expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    
  });

  it('Debe retornar mensaje de ingreso erroneo y booleano session false', async () => {
    const mockDTO: LoginUserDTO = {
      nickname: 'francisco', // Define un nickname válido
      pass: 'asfsafafaasfmH7sxIJr9R/grQV4hZ8Mvt2TH5M5eN/e4nGmI0pRrH2nqVqYZ+RomkGlQiqIrq6B0HoWaB+L5kSVilv/U3v4c4xoXtE/5i7RzZAPFdmMnj3vTfJ6ebQUxPOX9kQHXiAC88z4YcHjdKSQrXycTpco9lqDrY23u4oS9n+0MP81IZJfs4GCwIh3/WJl3h5ZxeQDepi+hUJOyy7QIBsbnPf30rAFbbFYX7Osrl3C/5y2MOXE6SSNh3tG1ocsRHuyDifeYLOqepSUNGhxPSfrMW6Qc014P7ndDeGleCnB5uNMrVmZyCbCdGw1Gw==',   
      //pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke'
      // Define una contraseña válida
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };


    const mockUser = {
      _id: '678f0cdb7fc6c2d2acce0356',
      name: 'francisco',
      //pass: await bcrypt.hash('123', 10), // Simula una contraseña encriptada
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
      createdAt: '2025-01-21T02:56:27.469Z',
      __v: 0,
    };

    //const privateKey = '-----BEGIN PRIVATE KEY----- MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZXMo4TPA1wEyi 2p8EQBhpmfuGHNbvw5aF4FCoQkfSbJbB9vYqxseU1PEC//6HeJmNWcrtRlNdmWic t6xiupZ9xt4r0rJO9qbiEHiJYNuj8UJM6nIM5wM9zNyV5XABzX0l5ZXLPPMbaazN ifFKx+ILQg4NJWYGfWotv538evVYUrgjUze08PMkO/VsxsYNGuhWck97OJs9oSjR HIFlRs8g6IdvY6EYFzsEGKSZygwzwLsiQBOYpz6sPhS/RjifyOd6YygFN3OogMny r9s3w/TNl00gD7RgaFW6ofTHn94AQJqDsAIbzW5f+shVo4hErEX9WqxvfDdYndDq BwDxkoT7AgMBAAECggEAPB2fKhoRV3RjXakkUKsfdVlqiKmCQpawEz+6XwbR0V9K BMQ2ShdnDIEmVSOS9EnFAiSC7MPF+72ZgrqD2VxskcXGHY2s1gz+k8hlZe1dYcaw hRBUUcA0k8uMeIKXy0/XXHtWRfsJ65t6+O+9RebpXB69PyKISKQ4EQYNfk5Ne8sG bPXOtuTvtzAT1h5yDOt+2GJgKWMUonX2dy6yHXwQgRLYAxlW1jQkH+51aCBlFoKz Fi0wV7HEbkySlHEE8P6mWNf2hVo3hJnkvFSA2VdX7GZiZJtx6OBJndRtcrKez1BU qH6js+3nURdOBbqyu/5yTuSyPOx0iaXqHwxBpp0YzQKBgQDyjkjh+i6rIK886TBS LHzYK92XQJY462Vz5+1zR8OhJm3dtk76pNbhlLuKYTLvPu+HmhHG3glysnRRhCw3 ceYAgEXN7ya57GN/TD6zFQQvMY0oNEMYecXh6qXe3YBzCh5lfOJ7IKdVhCEbcyLT yaE3vGnExbdPuIAamGqoomu6TQKBgQDlaQcI1kUUbNS+lZ6n+YnDeeAnaFBsdFVp tsfrWN1sZ0iZowdN3Y3XezvHnCwt3u95Y8eyjkfICMX8eWZonxKg7iz7U1SvC7P3 T1D5KY+kOYA+LKo0C2G8y5WkYtZiQU4nUJv+FB471+h2F1nHzJkktKSJNXqCLFDt m1MEykzQZwKBgCj0sYXGsr6ehDhqv4gAjwwJTB9P/o2Z4cWScdu3UGcTkBWRxQA5 eTcZ4BjblLglDlj9QOctcrb1PwLMqJKsHsQS5LaDHSzjp2FFRIkEkXJOkaEqQfIO DcW500wwZpIGMV+9mJhlyRt9dgGmjUjpkNlSbSGWqP9DDg5vkgLrefk5AoGAMCm3 p1xMznf2xjhlQcC68oYg0EUvNUXLNNGB8WALxJl+fXrjqq5L/CRMLaEVCWBXiHWx VERYv59P6ayXGnnjEFRQr0cUbVeYpeBKELVwCbtkuCjqZtjI4Tkgpo11ktVBEjHz Pgl9O3UdwcUvPSowMKuYK5JFsRSavPeyGzxZmhsCgYBLmTOmj00QufDQvWufwe0I g+hV2+wHkPw9iaJzYU6utnxMvolvVmSuhwdw3Wb+4ri+ivfahfq1lMVKbuh2QeWM Xqk1j3u1fsGbdQTaGndauCzhefDssy5o/X3qCDUHKn7omfDemxiGVx8e6fplMJdc 0sy4gmTYGOlRzjVAQKvB3g== -----END PRIVATE KEY-----'
    jest.spyOn(service, 'decryptWithPrivateKey').mockReturnValue('abcde');
  
    

    service.login = jest.fn().mockImplementation(async (createUserDTO: CreateUserDTO) => {
      const { nickname, pass } = createUserDTO;
      const user = await mockUserModel.findOne({name: nickname});
      const newpass =  service.decryptWithPrivateKey(pass);
      if (!user || !(await bcrypt.compare(newpass, user.pass))) {
          console.log("Error!!!!, usuario ",nickname," incorrecto");
          throw new UnauthorizedException('Credenciales invalidas');
      }
      console.log('Usuario ',nickname,' logeado.')
      return user
    });

    //jest.spyOn(service, 'login').mockResolvedValue(mockUser as any);

    await controller.loginUser(mockResponse as any, mockDTO as any);

    const responseArgs = mockResponse.json.mock.calls[0]; // Obtiene el primer (y único) argumento de la llamada a `json`
    console.log("Respuesta recibida: ", responseArgs[0]);

    // Verifica que el usuario es el esperado
    expect(responseArgs[0].session).toEqual(false);

    // Verifica que el mock de json fue llamado
    //expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    
  });

  it('Debe retornar al usuario test creado', async () => {
    const mockDTO: LoginUserDTO = {
      nickname: 'test1', // Define un nickname válido
      pass: 'testpass',   
      //pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke'
      // Define una contraseña válida
    };

    const mockUser = {
      "name": "test1",
      "pass": "$2b$10$VUihKulusX17EnKJoxyEA.Dh.r4ckLEh.QuOV3B9WyxOEZtkAOr8e",
      "createdAt": Date.now,
      "_id": "67992339a58c185e93b39977",
      "__v": 0
    };

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(service,'createUser').mockReturnValue(mockUser as any);

    await controller.createPost(mockResponse as any, mockDTO as any);

    const responseArgs = mockResponse.json.mock.calls[0]; 

    expect(responseArgs[0].message).toBe('Usuario creado correctamente');

  });

  it('Debe retornar la clave publica ', async () => {
    const mockPublicKey = 'Esto es una clave publica';
    jest.spyOn(service,'getPublicKey').mockResolvedValue(mockPublicKey);

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.getPublicKey(mockResponse as any);

    const responseArgs = mockResponse.json.mock.calls[0]; 

    expect(responseArgs[0].publicKey).toEqual('Esto es una clave publica')

    //expect(service.getPublicKey).toHaveBeenCalled();
    //expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    //expect(res.json).toHaveBeenCalledWith({ publicKey: mockPublicKey})
  });
  //HACER OPCIONES ERRONEAS

});

