# Game Hub SPA
A modern Single Page Application (SPA) designed for gamers, built with vanilla JavaScript, Bootstrap 5, and HTML/CSS.

## Features

- **SPA Architecture**: Smooth navigation without page reloads.
- **Client-Side Routing**: Utilizes the History API for dynamic routing.
- **Responsive Design**: Mobile-first layouts powered by Bootstrap 5.
- **Modern UI**: Enhanced with Bootstrap Icons for a polished look.
- **Multiple Views**: Includes Home, Games, Profile, and Login/Register pages.

## Project Structure

- `index.html` - Main entry point of the application.
- `src/assets/css/style.css` - Custom styles for the app.
- `src/js/router.js` - Manages SPA routing logic.
- `src/js/views/` - Houses individual view components.

## Getting Started

### Running Locally

To run the app locally:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd game-hub-spa
   ```
2. Open `index.html` in your browser.

> **Note**: Use a local server for proper routing. Options include:

- **Python**:
  ```bash
  python -m http.server
  ```
- **Node.js (http-server)**:
  ```bash
  npm install -g http-server
  http-server
  ```

### Running with Docker

Run the app using Docker, which includes both the Node.js app and a PostgreSQL database:

1. Install [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/).
2. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd game-hub-spa
   ```
3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```
4. Access the app at [http://localhost:3000](http://localhost:3000).
5. Stop the containers:
   ```bash
   docker-compose down
   ```
6. To remove the database volume:
   ```bash
   docker-compose down -v
   ```

## Browser Compatibility

This app uses modern JavaScript features and the History API, optimized for modern browsers.

## License

This project is licensed under the MIT License.
