import 'dotenv/config'

function req(name: string, fallback?: string){
    const v = process.env[name] ?? fallback; //Geralmente não se acessa aqui por isso a variavel tem qualquer nome 
    if (v === undefined) throw new Error(`Faltando env: ${name}`)
    return v
}

export const ENV = { 
    PORT: parseInt(process.env.PORT ?? '4300', 10),
    CORS_ORIGIN: req('CORS_ORIGIN', 'http://localhost:5173'),
    JWT_SECRET: req('JWT_SECRET'),

    SDK_WS_URL: req('SDK_WS_URL'),
    SDK_API_URL: req('SDK_API_URL'),
    SDK_HOST: req('SDK_HOST'),
    SDK_APP_ID: parseInt(req('SDK_APP_ID'), 10),

    FORCE_MOCK: (process.env.FORCE_MOCK ?? 'false').toLowerCase() === 'true',
}