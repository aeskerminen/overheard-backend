const locationRouter = require("express").Router();
const axios = require("axios");

locationRouter.post("/:lat/:lon", async (req, res) => {
  const lat = req.params.lat;
  const lon = req.params.lon;

  axios
    .get(`http://localhost:8000/api/data/${lat}/${lon}`)
    .then((result) => {
      return res.json(result.data.data);
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).end();
    });
});

module.exports = locationRouter;
