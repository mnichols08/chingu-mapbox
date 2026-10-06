const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class OfflineAssetsPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("OfflineAssets", (compilation) => {
      const { RawSource } = compiler.webpack.sources;
      compilation.hooks.processAssets.tap(
        {
          name: "OfflineAssets",
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          for (const name of ["index.html", "manifest.webmanifest", "icons/icon.svg"]) {
            compilation.emitAsset(name, new RawSource(fs.readFileSync(path.join(__dirname, "public", name))));
          }
          const assets = compilation.getAssets().filter(({ name }) => !name.endsWith(".map"));
          const hash = crypto.createHash("sha256");
          for (const asset of assets) {
            hash.update(asset.name);
            hash.update(asset.source.buffer());
          }
          const source = fs.readFileSync(path.join(__dirname, "src", "service-worker.js"), "utf8")
            .replace("__CACHE_VERSION__", hash.digest("hex").slice(0, 16))
            .replace("__PRECACHE_ASSETS__", JSON.stringify(assets.map(({ name }) => `./${name}`)));
          compilation.emitAsset("service-worker.js", new RawSource(source));
          const configPath = path.join(__dirname, "map-config.local.json");
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
            if (typeof config.mapboxToken !== "string" || !/^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(config.mapboxToken)) {
              throw new Error("map-config.local.json must contain a public pk. Mapbox token, never a secret token.");
            }
            compilation.emitAsset("map-config.json", new RawSource(JSON.stringify({ mapboxToken: config.mapboxToken })));
          } else {
            const oldConfig = path.join(__dirname, "dist", "map-config.json");
            if (fs.existsSync(oldConfig)) fs.unlinkSync(oldConfig);
            compilation.warnings.push(new Error("No map-config.local.json. Deploy map-config.json separately to enable the basemap."));
          }
        },
      );
    });
  }
}

module.exports = {
  entry: path.resolve(__dirname, "src", "app.ts"),
  devtool: "source-map",
  experiments: { asyncWebAssembly: true },
  module: {
    rules: [
      { test: /\.ts$/, exclude: /node_modules/, use: { loader: "ts-loader", options: { compilerOptions: { noEmit: false } } } },
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: { extensions: [".ts", ".js"] },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app.js",
    chunkFilename: "[name].[contenthash:12].js",
    publicPath: "auto",
  },
  plugins: [new OfflineAssetsPlugin()],
};
