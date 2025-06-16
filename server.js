require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

const currencyRoutes = require('./routes/currencyRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');


const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kantor Online API',
      version: '1.0.0',
      description: 'API dla aplikacji Kantoru Online, umożliwiające pobieranie kursów walut, rejestrację, logowanie, wymianę walut, usuwanie konta oraz symulację darowizn.',
      contact: {
        name: 'Twój Zespół Projektowy',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Serwer deweloperski',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: { 
        ErrorResponse: {
          type: 'object',
          properties: { message: { type: 'string', description: 'Komunikat błędu.' } },
          required: ['message']
        },
        UserBase: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Jan Kowalski' },
            email: { type: 'string', format: 'email', example: 'jan.kowalski@example.com' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        UserBalances: {
          type: 'object', description: 'Salda walutowe użytkownika.',
          additionalProperties: { type: 'number', format: 'float', example: 100.50 },
          example: { PLN: 1000.00, USD: 50.25 }
        },
        UserWithBalances: { 
          allOf: [
            { $ref: '#/components/schemas/UserBase' }, 
            { type: 'object', properties: { balances: { $ref: '#/components/schemas/UserBalances' } } }
          ]
        },
        Rate: {
          type: 'object',
          properties: {
            currency: { type: 'string', example: 'dolar amerykański' }, code: { type: 'string', example: 'USD' },
            mid: { type: 'number', format: 'float', example: 4.0123 },
            flagUrl: { type: 'string', format: 'url', nullable: true, example: 'https://flagcdn.com/us.svg' }
          }
        },
        TransactionInput: {
          type: 'object', required: ['fromCurrency', 'toCurrency', 'amount'],
          properties: {
            fromCurrency: { type: 'string', example: 'PLN' }, toCurrency: { type: 'string', example: 'USD' },
            amount: { type: 'number', format: 'float', example: 100.00 }
          }
        },
        TransactionRateUsed: {
          type: 'object',
          properties: { fromPLN: { type: 'number', format: 'float' }, toPLN: { type: 'number', format: 'float' } }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 }, date: { type: 'string', format: 'date-time' },
            fromCurrency: { type: 'string', example: 'PLN' }, amountSold: { type: 'number', format: 'float', example: 100.00 },
            toCurrency: { type: 'string', example: 'USD' }, amountReceived: { type: 'number', format: 'float', example: 25.01 },
            rateUsed: { $ref: '#/components/schemas/TransactionRateUsed' }
          }
        },
        DonationRecord: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'donation-1' }, type: { type: 'string', example: 'donation'},
                date: { type: 'string', format: 'date-time' }, currency: { type: 'string', example: 'PLN' },
                amountDonated: { type: 'number', format: 'float', example: 50.00 },
                charityTarget: { type: 'string', example: 'Wybrana Fundacja Charytatywna (Symulacja)'}
            }
        },
        LoginRequest: {
          type: 'object', required: ['email', 'password'],
          properties: { email: { type: 'string', format: 'email', example: 'user@example.com' }, password: { type: 'string', format: 'password', example: 'password123' } }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Zalogowano pomyślnie.' }, token: { type: 'string', example: 'eyJhbGciOi...' },
            user: { $ref: '#/components/schemas/UserWithBalances' } 
          }
        },
        RegisterRequest: {
          type: 'object', required: ['email', 'password'],
          properties: {
            name: { type: 'string', nullable: true, example: 'Jan Kowalski' }, email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
          }
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Użytkownik zarejestrowany pomyślnie.' }, token: { type: 'string', example: 'eyJhbGciOi...' },
            user: { $ref: '#/components/schemas/UserWithBalances' } 
          }
        },
        ExchangeResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Wymiana zakończona pomyślnie.' }, transaction: { $ref: '#/components/schemas/Transaction' },
            updatedBalances: { $ref: '#/components/schemas/UserBalances' }
          }
        },
        AccountDeletedResponse: {
          type: 'object',
          properties: { message: { type: 'string', example: 'Konto zostało pomyślnie usunięte.' } }
        },
        DonationRequest: {
          type: 'object', required: ['currency', 'amount'],
          properties: { currency: { type: 'string', example: 'PLN' }, amount: { type: 'number', format: 'float', example: 50.00 } }
        },
        DonationResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Dziękujemy! Środki zostały przekazane.'},
            donation: { $ref: '#/components/schemas/DonationRecord' },
            updatedBalances: { $ref: '#/components/schemas/UserBalances' }
          }
        }
      },
      responses: {
         Unauthorized: { description: 'Nieautoryzowany dostęp.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} },
         Forbidden: { description: 'Brak uprawnień.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} },
         BadRequest: { description: 'Nieprawidłowe dane wejściowe.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} },
         NotFound: { description: 'Zasób nie został znaleziony.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} },
         Conflict: { description: 'Konflikt, np. zasób już istnieje.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} },
         InternalServerError: { description: 'Wewnętrzny błąd serwera.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} },
         ServiceUnavailable: { description: 'Usługa tymczasowo niedostępna.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }}} }
      }
    },
  },
  apis: ['./routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/api-welcome', (req, res) => {
  res.send('Witaj w Kantor API!');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', currencyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/api-docs')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next(); 
  }
});

app.use('/api/*', (req, res, next) => {
    const error = new Error(`Nie znaleziono zasobu API: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});


let serverInstance;

 app.listen(PORT, () => {
    console.log(`Serwer uruchomiony na porcie ${PORT}`);
    
  });


module.exports = app;