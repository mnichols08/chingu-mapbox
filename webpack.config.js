const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sass = require("sass");
const { buildSite } = require("./scripts/content-site");
const { PUBLIC_ASSETS } = require("./scripts/site-assets");

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
          const site = buildSite();
          for (const name of PUBLIC_ASSETS) {
            let contents = fs.readFileSync(path.join(__dirname, "public", name), /\.(png|jpe?g|webp)$/i.test(name) ? undefined : "utf8");
            if (name === "site.css") contents = sass.compileString(contents, { style: "compressed" }).css;
            if (name === "index.html") {
              contents = contents.replace("__PLANNING_GUIDES__", site.planningCards);
              contents = contents.replace("__LOCAL_GUIDES__", site.localCards);
            }
            compilation.emitAsset(name, new RawSource(contents));
          }
          for (const page of site.pages) compilation.emitAsset(page.name, new RawSource(page.source));
          const assets = compilation.getAssets().filter(({ name }) => name !== "map-config.json" && !name.endsWith(".map"));
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

module.exports = (_env, argv = {}) => ({
  entry: path.resolve(__dirname, "src", "app.ts"),
  // Keep maps available during local development without publishing the full
  // source tree and source-map payloads with production static assets.
  devtool: argv.mode === "production" ? false : "source-map",
  experiments: { asyncWebAssembly: true },
  module: {
    rules: [
      { test: /\.ts$/, exclude: /node_modules/, use: { loader: "ts-loader", options: { compilerOptions: { noEmit: false } } } },
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          { loader: "sass-loader", options: { sassOptions: { style: "compressed" } } },
        ],
      },
    ],
  },
  resolve: { extensions: [".ts", ".js"] },
  output: {
    path: path.resolve(__dirname, "dist"),
    clean: { keep: /^map-config\.json$/ },
    filename: "app.js",
    chunkFilename: "[name].[contenthash:12].js",
    publicPath: "auto",
  },
  plugins: [new OfflineAssetsPlugin()],
});
