# kantor-api
## Funkcjonalności

*   **Pobieranie kursów walut:** Integracja z API Narodowego Banku Polskiego (NBP) do pobierania aktualnych kursów wymiany.
*   **Wzbogacanie danych o flagi:** Integracja z API REST Countries w celu pobrania flag krajów dla poszczególnych walut.
*   **Uwierzytelnianie i Autoryzacja:** System oparty na tokenach JWT.
    *   Rejestracja nowych użytkowników (z hashowaniem haseł).
    *   Logowanie użytkowników i generowanie tokenu JWT.
    *   Ochrona wybranych endpointów za pomocą middleware weryfikującego JWT.
*   **Wymiana walut:** Zalogowani użytkownicy mogą dokonywać symulowanej wymiany walut na podstawie kursów NBP. Salda użytkowników są przechowywane w pamięci serwera.
*   **Dokumentacja API:** Interaktywna dokumentacja API dostępna dzięki Swagger UI.
*   **Prosty Frontend:** Podstawowy interfejs użytkownika do wyświetlania kursów, rejestracji, logowania i wymiany walut.

## Użyte Technologie

*   **Backend:**
    *   Node.js
    *   Express.js
    *   JSON Web Tokens (jsonwebtoken)
    *   bcryptjs (do hashowania haseł)
    *   axios (do komunikacji z zewnętrznymi API)
    *   dotenv (do zarządzania zmiennymi środowiskowymi)
    *   swagger-jsdoc, swagger-ui-express (do dokumentacji API)
*   **Frontend:**
    *   HTML5
    *   CSS3 (Flexbox)
    *   JavaScript (Fetch API, DOM Manipulation)
*   **Narzędzia Deweloperskie:**
    *   nodemon (do automatycznego restartu serwera)
    *   Jest, supertest (do testów jednostkowych i integracyjnych)
    *   Git, GitHub


    ## Uruchomienie Projektu

    * sklonuj ten projekt
    * stwórz plik .env i dodaj zmienne np:
     PORT=3000
    JWT_SECRET=b3b33779cb50c25c915bf2fc647eaeef22f00d0e0a1d5936d3ea93e785ea0dae043fb220070cfe961486482274fe5b1afe66083b2358dac50c5eea588a121be7
    JWT_EXPIRES_IN=1h
    * zainstaluj nodejs 
    * zainstaluj wszystkie potrzebne node modules - npm i
    * Uruchom serwer deweloperski - npm run dev
    * Otwórz `http://localhost:3000` w przeglądarce
    
   ## Swagger
   * Dostępny pod `http://localhost:3000/api-docs`