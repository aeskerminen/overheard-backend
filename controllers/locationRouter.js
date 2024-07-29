const locationRouter = require("express").Router();
const axios = require("axios");

locationRouter.post("/:lat/:lon", async (req, res) => {
  const lat = req.params.lat;
  const lon = req.params.lon;

  const offgridResponse = await axios.post(
    `localhost:8000/api/data/${lat}/${lon}`
  );

  console.log(offgridResponse);

  return res.json(offgridResponse);
});

module.exports = locationRouter;
