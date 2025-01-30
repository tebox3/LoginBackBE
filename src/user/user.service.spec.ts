import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Res, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { User } from './interfaces/user.interface';
import { UserModule } from './user.module';
import { CreateUserDTO, LoginUserDTO } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { generateKeyPairSync, privateDecrypt, publicEncrypt } from 'crypto';
import * as crypto from 'crypto';



describe('UserService', () => {
  let service: UserService;

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
    find: jest.fn(() => {
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
        },]
      );
    }),
  };

  beforeEach(async () => {



    let module: TestingModule = await Test.createTestingModule({
      providers: [UserService, {
          provide: 'UserModel',
          useValue: mockUserModel,
      }],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  it('Debe retornar todos los usuarios', async () =>{
    const users = await service.getUsers();
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
    },];

    expect(users).toEqual(mockUsers);
});

it('Debe retornar la clave publica', async () =>{
  const publicKey = await service.getPublicKey();
  expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
});

it('Debe entregar la data desencriptada con la clave privada', async () => {
    const data = '1234';
    const buffer = Buffer.from(data, 'utf8');

    // Generar claves RSA
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Encriptar datos
    const dataEncriptada = publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    }, buffer);

    //console.log('DATA ENCRIPTADA:::  ', dataEncriptada.toString("base64"));
    //console.log('PRIVATE KEY TESTING:::: ', privateKey);

    // 🔹 Establecer la clave privada en el servicio antes de llamar a decryptWithPrivateKey
    (service as any).privateKey = privateKey;

    // Desencriptar
    const dataDesencriptada = service.decryptWithPrivateKey(dataEncriptada.toString("base64"));

    expect(dataDesencriptada).toEqual(data);
  });

  it('Debe retornar el usuario francisco al buscar por su nombre', async () => {
    const user = await service.getUser('francisco');
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUser = {
      _id: '678f0cdb7fc6c2d2acce0356',
      name: 'francisco',
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
      createdAt: '2025-01-21T02:56:27.469Z',
      }

    //expect(user).toHaveBeenCalledWith('francisco');
    const responseArgs = mockResponse.json.mock.calls;
    console.log(user); 
    expect(user).toEqual(mockUser);
  });

  it('Debe retornar null para un usuario inexistente', async () => {
    const user = await service.getUser('marcelo');
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    //expect(user).toHaveBeenCalledWith('francisco');
    const responseArgs = mockResponse.json.mock.calls;
    console.log(user); 
    expect(user).toBe(null);
  });

  it('Debe retornar el usuario completo si las credenciales son correctas', async () =>{
      const mockDTO: CreateUserDTO = {
        nickname: 'francisco', // Define un nickname válido
        //pass: 'testpass',   
        pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
        createdAt: new Date('2025-01-21T02:56:27.469Z')
        // Define una contraseña válida
      };
      const mockUser = {
        _id: '678f0cdb7fc6c2d2acce0356',
        name: 'francisco',
        pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
        createdAt: '2025-01-21T02:56:27.469Z',
        }
      jest.spyOn(service, 'decryptWithPrivateKey').mockReturnValue('1234');
      const user = await service.login(mockDTO);
      expect(user).toEqual(mockUser);
  });

  it('Debe retornar un error de credenciales invalidas', async () =>{
    const mockDTO: LoginUserDTO = {
      nickname: 'francisco', // Define un nickname válido
      //pass: 'testpass',   
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.sdgdsgds3fsds/PfTMfke',
      //createdAt: new Date('2025-01-21T02:56:27.469Z')
      // Define una contraseña válida
    };
    const mockUser = {
      _id: '678f0cdb7fc6c2d2acce0356',
      name: 'francisco',
      pass: '$2b$10$OezzcY7oJs6i0H2u48bvG.7k7J5BvSKhc26gHFKahVJHj/PfTMfke',
      createdAt: '2025-01-21T02:56:27.469Z',
      }

    //Al desencriptar la contraseña, esta es otra incorrecta
    jest.spyOn(service, 'decryptWithPrivateKey').mockReturnValue('asdf');
    await expect(service.login(mockDTO as any)).rejects.toThrow(UnauthorizedException);
});

  it('Debe retornar al usuario creado', async () =>{
    const mockDTO: LoginUserDTO = {
      nickname: 'test', // Define un nickname válido
      //pass: 'testpass',   
      pass: 'testpass'
      // Define una contraseña válida
    };
    
    function mockUserModel(dto: any){
      this.data = dto;
      this.save = () => {
        return this.data;
      }
    }

    let module: TestingModule = await Test.createTestingModule({
      providers: [UserService, {
          provide: 'UserModel',
          useValue: mockUserModel,
      }],
    }).compile();

    service = module.get<UserService>(UserService);
    const user = await service.createUser(mockDTO as any);
    /* expect(user).toEqual(expect.objectContaining({
      data: expect.objectContaining({
        name: "francisco",
        pass: expect.any(String), // La contraseña es un hash, así que solo verificamos que sea un string.
        createdAt: expect.any(Date), // Verificamos que createdAt sea un objeto de tipo Date.
      }),
      save: expect.any(Function), // Verificamos que `save` es una función.
    })); */
    expect(user).toHaveProperty('data.name', 'test');
    expect(user).toHaveProperty('data.pass', expect.any(String));
    expect(user).toHaveProperty('data.createdAt', expect.any(Date));
    expect(user).toHaveProperty('save', expect.any(Function));
});


});
