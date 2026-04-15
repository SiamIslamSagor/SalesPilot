# Server Boilerplate with TypeScript

This is a structured server boilerplate using **TypeScript**, designed to help you kickstart your Node.js applications with ease. The setup includes **Express**, **Mongoose**, **dotenv**, **ESLint**, **Prettier**, and other tools for development and production environments.

---

## Features

- TypeScript for type safety and modern JavaScript features.
- Express for a fast and unopinionated web framework.
- Mongoose for seamless MongoDB integration.
- Environment variable management using dotenv.
- Linting with ESLint and code formatting with Prettier.
- Development with `ts-node-dev` for hot-reloading.
- Production-ready build script.

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- Node.js (>= 16.x)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd server_boilerplate
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:

   ```env
   PORT=5000
   DATABASE_URL=mongodb://localhost:27017/your-database-name
   ```

---

## Available Scripts

### Development

Run the server in development mode:

```bash
npm run start:dev
```

This uses `ts-node-dev` for automatic server restarts on file changes.

### Build

Compile TypeScript into JavaScript:

```bash
npm run build
```

The compiled files will be located in the `dist` directory.

### Production

Start the server in production mode:

```bash
npm run start:prod
```

This runs the compiled JavaScript files from the `dist` directory.

### Linting

Run ESLint to analyze your code for potential issues:

```bash
npm run lint
```

Automatically fix linting issues:

```bash
npm run lint:fix
```

### Formatting

Format your codebase using Prettier:

```bash
npm run format
```

---

## Project Structure

```
server_boilerplate/
├── src/
│   ├── app/
│   │   ├── config/
│   │      └── index.ts  # Environment variable configuration
│   ├── server.ts         # Entry point of the application
│   ├── app.ts            # Express app setup
├── dist/                 # Compiled JavaScript files (after build)
├── .env                  # Environment variables
├── package.json          # Project metadata and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
├── .prettierignore       # Prettier ignore file
├── .prettierrc           # Prettier configuration file
```

---

## Environment Variables

The application requires the following environment variables:

- **PORT**: The port number for the server.
- **DATABASE_URL**: MongoDB connection string.

Define these variables in a `.env` file located in the project root.

---

## Dependencies

### Runtime

- `express`: Web framework.
- `mongoose`: MongoDB ORM.
- `dotenv`: Environment variable management.
- `cors`: Enable Cross-Origin Resource Sharing.

### Development

- `typescript`: TypeScript language support.
- `ts-node-dev`: Development server with hot-reloading.
- `eslint`: Linter for identifying problematic patterns in code.
- `prettier`: Code formatting tool.
- Type definitions (`@types/*`) for enhanced TypeScript support.

---

## Contributing

Contributions are welcome! If you find a bug or have a feature request, feel free to open an issue or submit a pull request.

---

## Author

MD SIAM ISLAM SAGOR
