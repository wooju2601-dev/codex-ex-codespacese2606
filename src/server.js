const path = require("path");

const buildPath = path.join(__dirname, "client", "dist");

app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});