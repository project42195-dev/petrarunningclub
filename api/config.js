module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ client_id: process.env.STRAVA_CLIENT_ID });
};
