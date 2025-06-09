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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kantor Online API',
      version: '1.0.0',
      description: 'API dla aplikacji Kantoru Online...',
      contact: { /* ... */ },
    },
    servers: [ { url: `http://localhost:${PORT}`, description: 'Serwer deweloperski' } ],
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
            id: { type: 'integer', description: 'ID użytkownika', example: 1 },
            name: { type: 'string', description: 'Nazwa użytkownika', example: 'Jan Kowalski' },
            email: { type: 'string', format: 'email', description: 'Adres email użytkownika', example: 'jan.kowalski@example.com' },
            createdAt: { type: 'string', format: 'date-time', description: 'Data utworzenia konta' }
          }
        },
        UserBalances: {
          type: 'object',
          description: 'Salda walutowe użytkownika.',
          additionalProperties: {
             type: 'number',
             format: 'float',
             description: 'Saldo dla danej waluty',
             example: 100.50
          },
          example: { PLN: 1000.00, USD: 50.25 }
        },
        UserWithBalances: { 
          allOf: [ 
            { $ref: '#/components/schemas/UserBase' },
            {
              type: 'object',
              properties: {
                balances: { $ref: '#/components/schemas/UserBalances' }
              }
            }
          ]
        },
        Rate: {
          type: 'object',
          properties: {
            currency: { type: 'string', description: 'Pełna nazwa waluty', example: 'dolar amerykański' },
            code: { type: 'string', description: 'Kod ISO waluty', example: 'USD' },
            mid: { type: 'number', format: 'float', description: 'Średni kurs wymiany do PLN', example: 4.0123 },
            flagUrl: { type: 'string', format: 'url', nullable: true, description: 'URL do flagi kraju waluty', example: 'https://flagcdn.com/us.svg' }
          }
        },
        TransactionInput: { 
          type: 'object',
          required: ['fromCurrency', 'toCurrency', 'amount'],
          properties: {
            fromCurrency: { type: 'string', description: 'Kod waluty źródłowej (3 znaki)', example: 'PLN' },
            toCurrency: { type: 'string', description: 'Kod waluty docelowej (3 znaki)', example: 'USD' },
            amount: { type: 'number', format: 'float', description: 'Kwota do wymiany w walucie źródłowej', example: 100.00 }
          }
        },
        TransactionRateUsed: {
          type: 'object',
          properties: {
             fromPLN: { type: 'number', format: 'float', description: 'Kurs waluty źródłowej do PLN użyty w transakcji' },
             toPLN: { type: 'number', format: 'float', description: 'Kurs waluty docelowej do PLN użyty w transakcji' }
          }
        },
        Transaction: { 
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID transakcji', example: 1 },
            date: { type: 'string', format: 'date-time', description: 'Data i czas transakcji' },
            fromCurrency: { type: 'string', example: 'PLN' },
            amountSold: { type: 'number', format: 'float', example: 100.00 },
            toCurrency: { type: 'string', example: 'USD' },
            amountReceived: { type: 'number', format: 'float', example: 25.01 },
            rateUsed: { $ref: '#/components/schemas/TransactionRateUsed' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Zalogowano pomyślnie.' },
            token: { type: 'string', description: 'Token JWT', example: 'eyJhbGciOi...' },
            user: { $ref: '#/components/schemas/UserWithBalances' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            name: { type: 'string', nullable: true, example: 'Jan Kowalski' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
          }
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Użytkownik zarejestrowany pomyślnie.' },
            user: { $ref: '#/components/schemas/UserWithBalances' } 
          }
        },
        ExchangeResponse: {
           type: 'object',
           properties: {
             message: { type: 'string', example: 'Wymiana zakończona pomyślnie.' },
             transaction: { $ref: '#/components/schemas/Transaction' },
             updatedBalances: { $ref: '#/components/schemas/UserBalances' }
           }
        }
      }
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/api-welcome', (req, res) => {
  res.send('Witaj w Kantor API!');
});


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', currencyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/api-docs')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else if (req.path.startsWith('/api/') && !res.headersSent) { 
  }

});

app.use((req, res, next) => {
     if (req.path.startsWith('/api/') && !res.headersSent) {
         return res.status(404).json({ message: 'Nie znaleziono zasobu API.' });
     }
    
     next();
});


app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});

module.exports = app; 