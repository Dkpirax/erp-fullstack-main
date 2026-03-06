const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
    'erp_db',
    'root',
    '',
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

sequelize.authenticate()
    .then(() => {
        console.log('CONNECTED_EMPTY_PASS');
        process.exit(0);
    })
    .catch(err => {
        console.error('FAILED_CONNECTION:', err.message);
        process.exit(1);
    });
