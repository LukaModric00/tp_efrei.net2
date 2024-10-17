export default {
  development: {
    type: 'development',
    port: 3000,
    mongodb: 'mongodb+srv://ltandou:0202@cluster0.yxh2k1h.mongodb.net/dbEfrei?retryWrites=true&w=majority&appName=Cluster0'
  },
  production: {
    type: 'production',
    port: 3000,
    mongodb: 'mongodb+srv://ltandou:0202@cluster0.yxh2k1h.mongodb.net/dbEfrei?retryWrites=true&w=majority&appName=Cluster0'
  },
  jwtSecret: 'carotte'
};
