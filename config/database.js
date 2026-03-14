const { Sequelize } = require('sequelize');
require('dotenv').config();

// const sequelize = new Sequelize(
//     process.env.DB_NAME || 'hyoytkltzg_erp_all',
//     process.env.DB_USER || 'hyoytkltzg_adminerp',
//     process.env.DB_PASSWORD || '+;VIEY7uyJnO',
//     {
//         host: process.env.DB_HOST || 'localhost',
//         dialect: process.env.DB_DIALECT || 'mysql',
//         port: process.env.DB_PORT || 3306,
//         logging: process.env.NODE_ENV === 'development' ? console.log : false,
//         pool: {
//             max: 5,
//             min: 0,
//             acquire: 30000,
//             idle: 10000
//         }
//     }
// );

const sequelize = new Sequelize(
    process.env.DB_NAME || 'erp_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established successfully.');
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
    });

module.exports = sequelize;
