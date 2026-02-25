import dotenv from 'dotenv';
dotenv.config();

const config = {
  db: {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1/vulnerablenode'
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production'
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || 'gitcombo',
    repo: process.env.GITHUB_REPO || 'vulnerable-node',
    environment: process.env.GITHUB_DEPLOY_ENV || 'production'
  }
};

// Legacy support for STAGE env var (Docker)
if (process.env.STAGE === 'DOCKER') {
  config.db.connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres_db/vulnerablenode';
}

export default config;
