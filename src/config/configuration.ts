export default () => ({
  port: parseInt(process.env.PORT!, 10),
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN!,
  },
  mail: {
    host: process.env.MAIL_HOST!,
    port: parseInt(process.env.MAIL_PORT!, 10),
    user: process.env.MAIL_USER!,
    pass: process.env.MAIL_PASS!,
  },
});
