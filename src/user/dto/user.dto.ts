export class CreateUserDTO {
    readonly nickname: string;
    readonly pass: string;
    readonly createdAt: Date
}

export class LoginUserDTO{
    readonly nickname: string;
    readonly pass: string
}