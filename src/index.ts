import express from 'express';
import * as admin from 'firebase-admin';

admin.initializeApp();

const app = express();
// Esta es la línea clave. El servidor SIEMPRE escuchará en el puerto que Cloud Run le asigne.
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Server is up and running!');
});

app.get('/api/health', (req, res) => {
  res.status(200).send({ status: 'ok', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`[server]: Server is listening on port ${port}`);
});
