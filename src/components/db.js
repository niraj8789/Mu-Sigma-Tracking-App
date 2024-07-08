const sql = require('mssql');

const config = {
    server: 'INBAAVVMMARSSQL.mu-sigma.local',
    database: 'Daily Tracker',
    options: {
      encrypt: true,
      enableArithAbort: true,
      trustServerCertificate: true,
      IntegratedSecurity: true, // Enable trusted connection
    },
    authentication: {
      type: 'ntlm',
      options: {
        domain: 'MU-SIGMA', // Specify your domain
        userName: 'Neeraj.Kumar', // Specify your username
        password:'Bateman@8789'
      },
    },
  };
    

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch((err) => {
    console.log('Database Connection Failed! Bad Config: ', err);
  });

module.exports = {
  sql,
  poolPromise,
};
