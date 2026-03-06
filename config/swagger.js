const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ERP Fullstack API',
            version: '1.0.0',
            description: 'API documentation for the ERP Fullstack application',
        },
        servers: [
            {
                url: '/api/v1',
                description: 'Primary API server',
            },
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
