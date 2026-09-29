export const httpError = (status, message, details) =>
  Object.assign(new Error(message), { status, expose: true, details });

export const notFound = (req, res) => res.status(404).json({ error: 'Not found' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.expose) return res.status(err.status).json({ error: err.message, errors: err.details });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};
