const path = require('path');
const fs = require('fs-extra');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

function copyPrismaModules(buildPath, _electronVersion, _platform, _arch, callback) {
  const srcNodeModules = path.resolve(__dirname, 'node_modules');
  const destNodeModules = path.join(buildPath, 'node_modules');

  const modulesToCopy = ['@prisma/client', '.prisma/client'];

  Promise.all(
    modulesToCopy.map((mod) => {
      const src = path.join(srcNodeModules, mod);
      const dest = path.join(destNodeModules, mod);
      return fs.copy(src, dest);
    })
  )
    .then(() => callback())
    .catch((err) => callback(err));
}

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/*.node',
    },
    extraResource: [
      './prisma/data/workshop.db',
    ],
    afterCopy: [copyPrismaModules],
  },
  rebuildConfig: {
    enabled: false,
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    // {
    //   name: '@electron-forge/plugin-auto-unpack-natives',
    //   config: {},
    // },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        devServer: {
          port: 3001,
        },
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload.ts',
              },
            },
          ],
        },
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
